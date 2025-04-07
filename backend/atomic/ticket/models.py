from sqlalchemy import Boolean
from db import db

# Ticket Model
class Ticket(db.Model):
    ticketID = db.Column(db.String(36), primary_key=True)
    eventID = db.Column(db.String(36), nullable=False)
    seatID = db.Column(db.String(36), nullable=False)
    userID = db.Column(db.String(36), nullable=False)  # Current owner of ticket
    status = db.Column(db.String(20), nullable=False, default="pending_payment")
    transactionID = db.Column(db.String(64), nullable=True)
    listed_for_trade = db.Column(Boolean, nullable=False, default=False)


    def to_dict(self):
        return {
            "ticketID": self.ticketID,
            "eventID": self.eventID,
            "seatID": self.seatID,
            "status": self.status,
            "transactionID": self.transactionID,
            "userID": self.userID,
            "listed_for_trade": self.listed_for_trade
        }