# models.py
from db import db
from sqlalchemy import Numeric
import random

def generate_transaction_id():
    while True:
        new_id = f"txn-{random.randint(100000, 999999)}"
        if not Payment.query.filter_by(transactionID=new_id).first():
            return new_id

class Payment(db.Model):
    __tablename__ = 'transactions'
    transactionID = db.Column(db.String(20), primary_key=True, default=generate_transaction_id)
    stripeID = db.Column(db.Text, nullable=False)
    amount = db.Column(Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(10), nullable=False)
    chargeType = db.Column(db.String(255), nullable=False) # chargeType is payment/refund
    status = db.Column(db.String(50))
    idempotencyKey = db.Column(db.Text, unique=True, nullable=False)

    def __repr__(self):
        return f'<Payment {self.stripeID}>'
