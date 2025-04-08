from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta

db = SQLAlchemy()

def get_singapore_time():
    return datetime.utcnow() + timedelta(hours=8)

# TradeRequest Model
class TradeRequest(db.Model):

    __tablename__ = 'trade_request'


    tradeRequestID = db.Column("traderequestid", db.String(64), primary_key=True)
    requesterID = db.Column("requesterid", db.String(36), nullable=False)
    requestedUserID = db.Column("requesteduserid", db.String(36), nullable=False)
    ticketID = db.Column("ticketid", db.String(36), nullable=False)
    requestedTicketID = db.Column("requestedticketid", db.String(36), nullable=False)
    status = db.Column("status", db.String(20), nullable=False, default="pending")
    created_at = db.Column("created_at", db.DateTime, default=get_singapore_time)

    def to_dict(self):
        return {
            "tradeRequestID": self.tradeRequestID,
            "requesterID": self.requesterID,
            "requestedUserID": self.requestedUserID,
            "ticketID": self.ticketID,
            "requestedTicketID": self.requestedTicketID,
            "status": self.status,
            "created_at": self.created_at.isoformat()
        }