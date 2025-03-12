from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import uuid
import os
import json
import threading
import logging
import requests

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Database Configuration (Supabase/PostgreSQL)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/ticket_db")
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Trade Ticket Service API URL
TRADE_TICKET_SERVICE_URL = os.getenv("TRADE_TICKET_SERVICE_URL", "http://trade-ticket-service")

# Ticket Model
class Ticket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticketID = db.Column(db.String(36), unique=True, nullable=False)
    eventID = db.Column(db.String(36), nullable=False)
    seatID = db.Column(db.String(36), nullable=False)
    userID = db.Column(db.String(36), nullable=False)  # Current owner of the ticket
    idempotencyKey = db.Column(db.String(64), unique=True, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending_payment")
    transactionID = db.Column(db.String(64), unique=True, nullable=True) 
    tradeRequestID = db.Column(db.String(64), nullable=True)  # Associated trade request ID

# Create a Pending Ticket with Idempotency Key
@app.route('/ticket', methods=['POST'])
def create_ticket():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['eventID', 'seatID', 'userID', 'idempotencyKey']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Check if a ticket already exists for the same event, seat, and user
        existing_ticket = Ticket.query.filter_by(
            eventID=data['eventID'],
            seatID=data['seatID'],
            userID=data['userID']
        ).first()

        if existing_ticket:
            return jsonify({
                "ticketID": existing_ticket.ticketID,
                "status": existing_ticket.status
            }), 200  # Return existing ticket details
        
        # Create a new ticket
        ticket_id = str(uuid.uuid4())
        new_ticket = Ticket(
            ticketID=ticket_id,
            eventID=data['eventID'],
            seatID=data['seatID'],
            userID=data['userID'],
            idempotencyKey=data['idempotencyKey'],
            status="pending_payment"
        )
        
        db.session.add(new_ticket)
        db.session.commit()
        
        return jsonify({"ticketID": ticket_id, "status": "pending_payment"}), 201
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating ticket: {str(e)}")
        return jsonify({"error": "Failed to create ticket"}), 500

# Confirm Ticket After Payment
@app.route('/ticket/confirm/<ticket_id>', methods=['PUT'])
def confirm_ticket(ticket_id):
    try:
        # Find ticket using the URL parameter
        ticket = Ticket.query.filter_by(ticketID=ticket_id).first()
        
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404
        
        if ticket.status == "confirmed":
            return jsonify({"message": "Ticket already confirmed"}), 200
            
        ticket.status = "confirmed"
        db.session.commit()
        
        return jsonify({"ticketID": ticket.ticketID, "status": "confirmed"}), 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error confirming ticket: {str(e)}")
        return jsonify({"error": "Failed to confirm ticket"}), 500

# Get Ticket Status
@app.route('/ticket/<ticketID>', methods=['GET'])
def get_ticket(ticketID):
    try:
        ticket = Ticket.query.filter_by(ticketID=ticketID).first()
        
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404
            
        return jsonify({
            "ticketID": ticket.ticketID,
            "eventID": ticket.eventID,
            "seatID": ticket.seatID,
            "userID": ticket.userID,
            "status": ticket.status
        }), 200
    
    except Exception as e:
        logger.error(f"Error retrieving ticket: {str(e)}")
        return jsonify({"error": "Failed to retrieve ticket"}), 500
    
# Void ticket
@app.route('/ticket/void/<ticketID>', methods=['PUT'])
def void_ticket(ticket_id):
    try:
        # Find ticket using the URL parameter
        ticket = Ticket.query.filter_by(ticketID=ticket_id).first()
        
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404
        # Check if ticket is in a state that can be voided
        if ticket.status in ["voided"]:
            return jsonify({
                "error": f"Cannot void ticket with status: {ticket.status}",
                "ticketID": ticket.ticketID
            }), 400
            
        # If there's an active trade request, we should handle it
        if ticket.tradeRequestID:
            # Option 1: Automatically cancel the trade request
            # You would need to call the Trade Ticket Service here to cancel the trade
            # Example: cancel_trade_request(ticket.tradeRequestID)
            
            # Option 2: Prevent voiding if there's an active trade
            return jsonify({
                "error": "Cannot void ticket with active trade request",
                "ticketID": ticket.ticketID,
                "tradeRequestID": ticket.tradeRequestID
            }), 400
        
        # Update the ticket status
        previous_status = ticket.status
        ticket.status = "voided"
        
        db.session.commit()
        
        # Log the status change
        logger.info(f"Ticket {ticket_id} voided. Previous status: {previous_status}")
        
        return jsonify({
            "ticketID": ticket.ticketID,
            "status": "voided",
            "previousStatus": previous_status,
            "message": "Ticket successfully voided"
        }), 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error voiding ticket: {str(e)}")
        return jsonify({"error": "Failed to void ticket"}), 500

# Function to get trade request details from Trade Ticket Service
def get_trade_request_details(tradeRequestID):
    try:
        response = requests.get(f"{TRADE_TICKET_SERVICE_URL}/trade/{tradeRequestID}")
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Failed to fetch trade request details: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Error calling Trade Ticket Service: {str(e)}")
        return None

# Update ticket ownership (after Trade Acceptance)
@app.route('/ticket/trade/<ticketID>', methods=['PUT'])
def trade_ticket(ticketID):
    try:
        data = request.json
        
        # Validate required field
        if 'tradeRequestID' not in data:
            return jsonify({"error": "Missing required field: tradeRequestID"}), 400

        ticket = Ticket.query.filter_by(ticketID=ticketID).first()
        
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404
        
        # Ensure that the ticket is actually involved in the trade request
        if ticket.tradeRequestID != data["tradeRequestID"]:
            return jsonify({"error": "Invalid trade request ID"}), 400

        # Retrieve trade request details (Trade Ticket Service should ensure this is valid)
        trade_request = get_trade_request_details(data["tradeRequestID"])
        
        if not trade_request or trade_request["status"] != "confirmed":
            return jsonify({"error": "Trade request is not confirmed"}), 400
        
        # Update the userID to reflect the new owner
        ticket.userID = trade_request["requestedUserID"]  # Transfer ownership
        ticket.tradeRequestID = None  # Trade completed, remove association
        db.session.commit()

        return jsonify({
            "ticketID": ticket.ticketID,
            "newUserID": ticket.userID,
            "status": "traded"
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating ticket trade: {str(e)}")
        return jsonify({"error": "Failed to update ticket owner"}), 500 

# Initialise database
def init_db():
    with app.app_context():
        try:
            db.create_all()
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Database initialization failed: {str(e)}")
            exit(1)  # Exit if DB fails to initialise

if __name__ == '__main__' and threading.current_thread() == threading.main_thread():
    init_db()
    
    # Start the Flask application
    app.run(debug=True, use_reloader=False)  # Disable reloader when using threads