# app.py
import uuid
import os
import logging
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
# from flask_migrate import Migrate
from config import Config
from db import db
from models import Payment
from services.stripe_service import create_charge, refund_charge

# Configure logging
# logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.config.from_object(Config)
# logging.debug("Database URL:", os.environ.get('DATABASE_URL'))

db.init_app(app)
# migrate = Migrate(app, db)


@app.route('/')
def home():
    return "health check"

@app.route('/payment', methods=['POST'])
def process_payment():
    """
    Endpoint to process a payment.
    Expects JSON payload with: 
    {
        "amount": 5000,
        "currency": "usd",
        "source": "tok_visa",
    }

    Note that amount is in CENTS
    """
    data = request.get_json()

    # Generate or use provided idempotency key
    idempotencyKey = str(uuid.uuid4())

    # Validate required fields
    required_fields = ['amount', 'currency', 'source']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    # Create the charge via Stripe
    stripe_response = create_charge(
        amount=data['amount'],
        currency=data['currency'],
        source=data['source'],
        chargeType="payment",
        idempotencyKey=idempotencyKey
    )

    if "error" in stripe_response:
        return jsonify(stripe_response), 400

    # Store the transaction in the database using the Payment model
    # logging.debug("Creating payment record")
    payment_record = Payment(
        stripeID=stripe_response['id'],
        amount=data['amount'],
        currency=data['currency'],
        chargeType="payment",
        status=stripe_response.get('status', 'unknown'),
        idempotencyKey=idempotencyKey
    )

    try:
        # logging.debug("Adding payment record to the session")
        db.session.add(payment_record)
        # logging.debug("Committing the session")
        db.session.flush()
        db.session.commit()
        # logging.debug("Payment record committed successfully")
    except Exception as e:
        # logging.error("Error during commit: %s", e)
        db.session.rollback()  # Rollback the session to avoid invalid state
        return jsonify({"error": str(e)}), 500

    return jsonify({
        "stripeID": stripe_response['id'],
        "amount": data['amount'],
        "currency": data['currency'],
        "chargeType": "payment",
        "status": stripe_response.get('status', 'unknown'),
        "idempotencyKey": idempotencyKey
    }), 200

@app.route('/refund', methods=['POST'])
def process_refund():
    """
    Endpoint to process a refund.
    Expects JSON payload with: 
    {
        "stripeID": "ch_1ExampleID",
    }
    Note: amount is in CENTS
    """
    data = request.get_json()
    
    if 'stripeID' not in data:
        return jsonify({"error": "Missing stripeID"}), 400

    # Generate or use provided idempotency key for refund
    idempotencyKey = str(uuid.uuid4())

    # Retrieve the original payment record from the database
    original_payment = Payment.query.filter_by(stripeID=data['stripeID']).first()
    if not original_payment:
        return jsonify({"error": "Original payment not found"}), 404
    
    # The amount can be omitted for full refunds; adjust logic accordingly.
    refund_response = refund_charge(
        stripeID=data['stripeID'],
        idempotencyKey=idempotencyKey
    )

    if "error" in refund_response:
        return jsonify(refund_response), 400

    # Store the transaction in the database using the Payment model
    payment_record = Payment(
        stripeID=data['stripeID'],
        amount=original_payment.amount,
        currency=original_payment.currency,
        chargeType="refund",
        status=refund_response.get('status', 'unknown'),
        idempotencyKey=idempotencyKey
    )

    db.session.add(payment_record)
    db.session.commit()

    return jsonify({
        "stripeID": data['stripeID'],
        "amount": original_payment.amount,
        "currency": original_payment.currency,
        "chargeType": "refund",  
        "status": refund_response.get('status', 'unknown'),
        "idempotencyKey": idempotencyKey
    }), 200

if __name__ == '__main__':
    with app.app_context():
        # logging.debug("creating database tables")
        db.create_all() 
        # logging.debug("database tables created successfully")
    app.run(debug=True)
