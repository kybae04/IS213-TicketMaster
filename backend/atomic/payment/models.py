# models.py
from db import db

class Payment(db.Model):
    __tablename__ = 'transactions'
    transactionID = db.Column(db.Integer, primary_key=True)
    stripeID = db.Column(db.String(128), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    currency = db.Column(db.String(10), nullable=False)
    chargeType = db.Column(db.String(255), nullable=False) # chargeType is payment/refund
    status = db.Column(db.String(50))
    idempotencyKey = db.Column(db.String(36), unique=True, nullable=False)

    def __repr__(self):
        return f'<Payment {self.stripeID}>'
