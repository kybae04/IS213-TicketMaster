# app.py
# import uuid
import os
import logging
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
# from flask_migrate import Migrate
from config import Config
from db import db
from models import Payment, IdempotencyKey
from services.stripe_service import create_charge, refund_charge
import random
from datetime import datetime
from flask_cors import CORS

# Generating transaction ID
def generate_transaction_id():
    while True:
        new_id = f"txn-{random.randint(100000, 999999)}"
        if not Payment.query.filter_by(transactionID=new_id).first():
            return new_id

# Configure logging
# logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.config.from_object(Config)
# logging.debug("Database URL:", os.environ.get('DATABASE_URL'))
CORS(app)  # Enable CORS for all routes

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
        return jsonify({"error": f"Missing required fields. Required fields: {required_fields}"}), 400

    # Generate transactionID
    transaction_id = generate_transaction_id()

    # convert amount to cents
    amount_cents = int(data['amount'] * 100)

    # Step 1: Create the charge via Stripe
    stripe_response = create_charge(
        amount=amount_cents,
        currency=data['currency'],
        source=data['source'],
        chargeType="payment",
        idempotencyKey=data['idempotency_key']
    )

    # Step 2: Handle failure
    if "error" in stripe_response:
        error_message = stripe_response["error"]

        # Log failed payment attempt in idempotency cache
        idempotency_key_record = IdempotencyKey(
            key=data['idempotency_key'],
            response={
                "transactionID": transaction_id,
                "message": f"Payment failed: {error_message}"
            },
            created_at=datetime.utcnow()
        )

        db.session.add(idempotency_key_record)
        db.session.commit()

        return jsonify({"error": error_message, "transactionID": transaction_id}), 400

    # Step 3: Record successful payment
    # logging.debug("Creating payment record")
    payment_record = Payment(
        transactionID=transaction_id,
        stripeID=stripe_response['id'],
        amount=data['amount'],
        currency=data['currency'],
        chargeType="payment",
        status=stripe_response.get('status', 'unknown'),
        # idempotencyKey=data['idempotency_key']
    )

    idempotency_key_record = IdempotencyKey(
        key=data['idempotency_key'],
        response={
            "transactionID": transaction_id,
            "message": "Payment processed successfully",
        },
        created_at=datetime.utcnow()
    )

    try:
        # logging.debug("Adding payment record to the session")
        db.session.add(payment_record)
        # logging.debug("Committing the session")
        db.session.flush()
        db.session.commit()
        # logging.debug("Payment record committed successfully")
        db.session.add(idempotency_key_record)
        db.session.commit()
    except Exception as e:
        # logging.error("Error during commit: %s", e)
        db.session.rollback()  # Rollback the session to avoid invalid state
        return jsonify({"error": str(e)}), 500

    return jsonify({
        "transactionID": transaction_id,
        "stripeID": stripe_response['id'],
        "amount": data['amount'],
        "currency": data['currency'],
        "chargeType": "payment",
        "status": stripe_response.get('status', 'unknown'),
        "idempotencyKey": data['idempotency_key']
    }), 200 # not sure if want to change to 201, but might need to change in buy_ticket composite service also

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
        "status": payment_record.status
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
        return jsonify({"error": "Missing stripeID or idempotency_key"}), 400

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

    # Generate transactionID
    transaction_id = generate_transaction_id()

    # Store the transaction in the database using the Payment model
    payment_record = Payment(
        transactionID=transaction_id,
        stripeID=data['stripeID'],
        amount=original_payment.amount,
        currency=original_payment.currency,
        chargeType="refund",
        status=refund_response.get('status', 'unknown'),
        # idempotencyKey=data['idempotency_key']
    )

    idempotency_key_record = IdempotencyKey(
        key=data['idempotency_key'],
        response={
            "transactionID": transaction_id,
            "message": "Refund processed successfully",
        },
        created_at=datetime.utcnow()
    )

    db.session.add(payment_record)
    db.session.commit()

    db.session.add(idempotency_key_record)
    db.session.commit()

    return jsonify({
        "transactionID": transaction_id,
        "stripeID": data['stripeID'],
        "amount": original_payment.amount,
        "currency": original_payment.currency,
        "chargeType": "refund",  
        "status": refund_response.get('status', 'unknown'),
        "idempotencyKey": data['idempotency_key']
    }), 201

if __name__ == '__main__':
    with app.app_context():
        # logging.debug("creating database tables")
        db.create_all() 
        # logging.debug("database tables created successfully")
    app.run(debug=True, host="0.0.0.0", port=5001)
