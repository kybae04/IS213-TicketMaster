# app.py
# import uuid
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
    return jsonify({"message": "health check"}), 200

@app.route('/payment', methods=['POST'])
def process_payment():
    """
    Endpoint to process a payment.
    Expects JSON payload with: 
    {
        "amount": 150.00,
        "currency": "USD",
        "source": "tok_visa",
        "idempotency_key": "unique_key_here"
    }

    Note that amount is in dollars, to 2dp
    """

    data = request.get_json()

    # Generate or use provided idempotency key
    #idempotencyKey = str(uuid.uuid4())

    # Validate required fields
    required_fields = ['amount', 'currency', 'source','idempotency_key']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    # convert amount to cents
    amount_cents = int(data['amount'] * 100)

    # Create the charge via Stripe
    stripe_response = create_charge(
        amount=amount_cents,
        currency=data['currency'],
        source=data['source'],
        chargeType="payment",
        idempotencyKey=data['idempotency_key']
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
        idempotencyKey=data['idempotency_key']
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
        "idempotencyKey": data['idempotency_key']
    }), 200

@app.route('/payment/<transactionID>', methods=['GET'])
def get_payment(transactionID):
    """
    Endpoint to retrieve a payment record by transaction ID.
    """
    payment_record = Payment.query.filter_by(transactionID=transactionID).first()
    if not payment_record:
        return jsonify({"error": "Payment record not found"}), 404

    return jsonify({
        "transactionID": payment_record.transactionID,
        "stripeID": payment_record.stripeID,
        "amount": payment_record.amount,
        "currency": payment_record.currency,
        "chargeType": payment_record.chargeType,
        "status": payment_record.status,
        "idempotencyKey": payment_record.idempotencyKey
    }), 200

@app.route('/refund', methods=['POST'])
def process_refund():
    """
    Endpoint to process a refund.
    Expects JSON payload with: 
    {
        "stripeID": "ch_1ExampleID",
        "idempotency_key": "unique_key_here"
    }
    Note: amount is in CENTS
    """
    data = request.get_json()
    
    if 'stripeID' not in data and 'idempotency_key' not in data:
        return jsonify({"error": "Missing stripeID"}), 400

    # Generate or use provided idempotency key for refund
    # idempotencyKey = str(uuid.uuid4())

    # Retrieve the original payment record from the database
    original_payment = Payment.query.filter_by(stripeID=data['stripeID']).first()
    if not original_payment:
        return jsonify({"error": "Original payment not found"}), 404
    
    # The amount can be omitted for full refunds; adjust logic accordingly.
    refund_response = refund_charge(
        stripeID=data['stripeID'],
        idempotencyKey=data['idempotency_key']
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
        idempotencyKey=data['idempotency_key']
    )

    db.session.add(payment_record)
    db.session.commit()

    return jsonify({
        "stripeID": data['stripeID'],
        "amount": original_payment.amount,
        "currency": original_payment.currency,
        "chargeType": "refund",  
        "status": refund_response.get('status', 'unknown'),
        "idempotencyKey": data['idempotency_key']
    }), 200

if __name__ == '__main__':
    with app.app_context():
        # logging.debug("creating database tables")
        db.create_all() 
        # logging.debug("database tables created successfully")
    app.run(debug=True, host="0.0.0.0", port=5001)
