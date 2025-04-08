# models.py
from db import db
from sqlalchemy import Numeric, Integer, String, Text, JSON, DateTime
from datetime import datetime, timedelta
# import random

# def generate_transaction_id():
#     while True:
#         new_id = f"txn-{random.randint(100000, 999999)}"
#         if not Payment.query.filter_by(transactionID=new_id).first():
#             return new_id


def get_singapore_time():
    return datetime.utcnow() + timedelta(hours=8)


class Payment(db.Model):
    __tablename__ = 'transactions'
    # transactionID = db.Column(db.String(20), primary_key=True, default=generate_transaction_id)
    transactionID = db.Column(db.String(20), primary_key=True)
    stripeID = db.Column(db.Text, nullable=False)
    amount = db.Column(Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(10), nullable=False)
    chargeType = db.Column(db.String(255), nullable=False) # chargeType is payment/refund
    status = db.Column(db.String(50))
    # idempotencyKey = db.Column(db.Text, unique=True, nullable=False)

class IdempotencyKey(db.Model):
    __tablename__ = 'idempotency_keys'

    key = db.Column(Text, primary_key=True)  # Now this is the primary key
    response = db.Column(JSON, nullable=False)  # Stores the response in JSON format
    created_at = db.Column(DateTime, default=get_singapore_time, nullable=False)

    def __repr__(self):
        return f'<IdempotencyKey {self.key}>'
