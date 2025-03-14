# app.py
import uuid
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config
from services.stripe_service import create_charge, refund_charge

app = Flask(__name__)
app.config.from_object(Config)
db = SQLAlchemy(app)
migrate = Migrate(app, db)


import models


@app.route('/payment', methods=['POST'])
def process_payment():
    """
    Endpoint to process a payment.
    Expects JSON payload with: amount, currency, source, description, and optionally idempotency_key.
    """
    data = request.get_json()

    # Generate or use provided idempotency key
    idempotency_key = data.get('idempotency_key') or str(uuid.uuid4())

    # Validate required fields
    required_fields = ['amount', 'currency', 'source', 'type']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    # Create the charge via Stripe
    stripe_response = create_charge(
        amount=data['amount'],
        currency=data['currency'],
        source=data['source'],
        type=data['type'],
        idempotency_key=idempotency_key
    )

    if "error" in stripe_response:
        return jsonify(stripe_response), 400

    # Optionally, store the result in your database here using models.py

    return jsonify({
        "stripe_charge_id": stripe_response['id'],
        "amount": data['amount'],
        "currency": data['currency'],
        "type": data['type'],
        "status": stripe_response.get('status', 'unknown'),
        "idempotency_key": idempotency_key
    }), 200

@app.route('/refund', methods=['POST'])
def process_refund():
    """
    Endpoint to process a refund.
    Expects JSON payload with: charge_id, amount (if partial refund), and optionally idempotency_key.
    """
    data = request.get_json()
    
    if 'charge_id' not in data:
        return jsonify({"error": "Missing charge_id"}), 400

    # Generate or use provided idempotency key for refund
    idempotency_key = data.get('idempotency_key') or str(uuid.uuid4())

    # The amount can be omitted for full refunds; adjust logic accordingly.
    refund_response = refund_charge(
        charge_id=data['charge_id'],
        amount=data.get('amount'),
        idempotency_key=idempotency_key
    )

    if "error" in refund_response:
        return jsonify(refund_response), 400

    # Optionally, store refund details in your database

    return jsonify({
        "refund_id": refund_response['id'],
        "charge_id": data['charge_id'],
        "amount": data.get('amount'),
        "status": refund_response.get('status', 'unknown'),
        "idempotency_key": idempotency_key
    }), 200

if __name__ == '__main__':
    app.run(debug=True)
