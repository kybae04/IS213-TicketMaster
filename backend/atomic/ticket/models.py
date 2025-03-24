from db import db

# Ticket Model
class Ticket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticketID = db.Column(db.String(36), unique=True, nullable=False)
    eventID = db.Column(db.String(36), nullable=False)
    seatID = db.Column(db.String(36), nullable=False)
    userID = db.Column(db.String(36), nullable=False)  # Current owner of ticket
    idempotencyKey = db.Column(db.String(64), unique=True, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending_payment")
    transactionID = db.Column(db.String(64), unique=True, nullable=True) 
    tradeRequestID = db.Column(db.String(64), nullable=True)  # Associated trade request ID

    def to_dict(self):
        return {
            "ticketID": self.ticketID,
            "eventID": self.eventID,
            "seatID": self.seatID,
            "status": self.status,
            "tradeRequestID": self.tradeRequestID,
            "transactionID": self.transactionID,
            "userID": self.userID
        }