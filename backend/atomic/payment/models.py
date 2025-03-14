# models.py
from app import db

class Payment(db.Model):
    transactionID = db.Column(db.Integer, primary_key=True)
    stripeID = db.Column(db.String(128), unique=True, nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    currency = db.Column(db.String(10), nullable=False)
    type = db.Column(db.String(255))
    status = db.Column(db.String(50))
    idempotencyKey = db.Column(db.String(36), unique=True, nullable=False)

    def __repr__(self):
        return f'<Payment {self.stripe_charge_id}>'
