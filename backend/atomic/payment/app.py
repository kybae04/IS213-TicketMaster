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
    Expects JSON payload with: amount, currency, source, description, and optionally idempotency key.
    """
    data = request.get_json()

    # Generate or use provided idempotency key
    idempotencyKey = data.get('idempotencyKey') or str(uuid.uuid4())

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
        idempotencyKey=idempotencyKey
    )

    if "error" in stripe_response:
        return jsonify(stripe_response), 400

    # Optionally, store the result in your database here using models.py

    return jsonify({
        "stripeID": stripe_response['id'],
        "amount": data['amount'],
        "currency": data['currency'],
        "type": data['type'],
        "status": stripe_response.get('status', 'unknown'),
        "idempotencyKey": idempotencyKey
    }), 200

@app.route('/refund', methods=['POST'])
def process_refund():
    """
    Endpoint to process a refund.
    Expects JSON payload with: chargeID, amount (if partial refund), and optionally idempotency key.
    """
    data = request.get_json()
    
    if 'chargeID' not in data:
        return jsonify({"error": "Missing chargeID"}), 400

    # Generate or use provided idempotency key for refund
    idempotencyKey = data.get('idempotencyKey') or str(uuid.uuid4())

    # The amount can be omitted for full refunds; adjust logic accordingly.
    refund_response = refund_charge(
        chargeID=data['chargeID'],
        amount=data.get('amount'),
        idempotencyKey=idempotencyKey
    )

    if "error" in refund_response:
        return jsonify(refund_response), 400

    # Optionally, store refund details in your database
    ### FIGURE OUT HOW TO STORE IN DATABASE!!!

    return jsonify({
        "transactionID": refund_response['id'],
        "chargeID": data['chargeID'],
        "amount": data.get('amount'),
        "type": "refund",
        "status": refund_response.get('status', 'unknown'),
        "idempotencyKey": idempotencyKey
    }), 200

if __name__ == '__main__':
    app.run(debug=True)
