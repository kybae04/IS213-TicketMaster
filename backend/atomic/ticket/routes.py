import logging
import requests
from flask import request, jsonify
from db import db
from models import Ticket
from config import Config
import uuid

# Configure logging
logger = logging.getLogger(__name__)

TRADE_TICKET_SERVICE_URL = Config.TRADE_TICKET_SERVICE_URL

def register_routes(app):
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
        
            # Check if ticket with the same idempotencyKey already exists
            existing_ticket = Ticket.query.filter_by(idempotencyKey=data['idempotencyKey']).first()

            if existing_ticket:
                return jsonify({
                    "ticketID": existing_ticket.ticketID,
                    "eventID": existing_ticket.eventID,
                    "seatID": existing_ticket.seatID,
                    "userID": existing_ticket.userID,
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
        
            return jsonify({
                "ticketID": ticket_id,
                "eventID": data['eventID'],
                "seatID": data['seatID'],
                "userID": data['userID'],
                "status": "pending_payment"
            }), 201
    
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating ticket: {str(e)}")
            return jsonify({"error": "Failed to create ticket"}), 500

    # Confirm Ticket After Payment
    @app.route('/ticket/confirm/<ticket_id>', methods=['PUT'])
    def confirm_ticket(ticket_id):
        try:
            data = request.json

            # Validate that transactionID is present
            if 'transactionID' not in data:
                return jsonify({"error": "Missing required field: transactionID"}), 400
        
            # Find ticket using the URL parameter
            ticket = Ticket.query.filter_by(ticketID=ticket_id).first()
        
            if not ticket:
                return jsonify({"error": "Ticket not found"}), 404
        
            if ticket.status == "confirmed":
                # If already confirmed, check if it's the same transaction
                if ticket.transactionID == data['transactionID']:
                    return jsonify({
                        "message": "Ticket already confirmed",
                        "ticketID": ticket.ticketID,
                        "transactionID": ticket.transactionID
                    }), 200
                else:
                    # Different transaction ID - potential duplicate payment or error
                    logger.warning(f"Conflicting transactionID for ticket {ticket_id}. Existing: {ticket.transactionID}, Received: {data['transactionID']}")
                    return jsonify({
                    "error": "Ticket already confirmed with different transaction ID",
                    "ticketID": ticket.ticketID
                    }), 409  # Conflict status code
        
            # Check that ticket is in pending_payment status
            if ticket.status != "pending_payment":
                return jsonify({
                    "error": f"Cannot confirm ticket with status: {ticket.status}",
                    "ticketID": ticket.ticketID
                }), 400

            # Update the ticket status and add transactionID
            ticket.status = "confirmed"
            ticket.transactionID = data['transactionID']
            db.session.commit()

            logger.info(f"Ticket {ticket_id} confirmed with transaction {data['transactionID']}")
        
            return jsonify({
                "message": "Ticket successfully confirmed",
                "ticketID": ticket.ticketID,
                "status": "confirmed",
                "transactionID": ticket.transactionID
            }), 200
    
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
                "status": ticket.status,
                "transactionID": ticket.transactionID,
                "tradeRequestID": ticket.tradeRequestID
            }), 200
    
        except Exception as e:
            logger.error(f"Error retrieving ticket: {str(e)}")
            return jsonify({"error": "Failed to retrieve ticket"}), 500
    
    # Get Tickets by Transaction ID
    @app.route('/tickets/transaction/<transaction_id>', methods=['GET'])
    def get_tickets_by_transaction(transaction_id):
        try:
            tickets = Ticket.query.filter_by(transactionID=transaction_id).all()
            if tickets == []:
                return jsonify({"error": "Transaction ID does not exist"}), 404
            return jsonify([ticket.to_dict() for ticket in tickets]), 200
        except Exception as e:
            logger.error(f"Error retrieving tickets: {str(e)}")
            return jsonify({"error": "Failed to retrieve tickets"}), 500

    # Void ticket
    @app.route('/ticket/void/<ticketID>', methods=['PUT'])
    def void_ticket(ticketID):
        try:
            # Find ticket using the URL parameter
            ticket = Ticket.query.filter_by(ticketID=ticketID).first()
        
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
                    "error": "Cannot void ticket while it has an active trade request. Please cancel the trade first.",
                    "ticketID": ticket.ticketID,
                    "tradeRequestID": ticket.tradeRequestID
                }), 400
        
            # Update the ticket status
            previous_status = ticket.status
            ticket.status = "voided"
        
            db.session.commit()
        
            # Log the status change
            logger.info(f"Ticket {ticketID} voided. Previous status: {previous_status}")
        
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
                try:
                    return response.json()
                except ValueError:
                    logger.error("Invalid JSON response from Trade Ticket Service")
                    return None
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
            
            # Ensure ticket is currently in a trade process
            if not ticket.tradeRequestID:
                return jsonify({"error": "This ticket is not currently involved in any trade"}), 400
            
            # Ensure that the ticket is actually involved in the trade request
            if ticket.tradeRequestID != data["tradeRequestID"]:
                return jsonify({"error": "Invalid trade request ID"}), 400

            # Retrieve trade request details (Trade Ticket Service should ensure this is valid)
            trade_request = get_trade_request_details(data["tradeRequestID"])
            if not trade_request:
                return jsonify({
                    "error": "Trade Ticket Service is unavailable. Please try again later."
                }), 503  # Service Unavailable
            
            if trade_request["status"] != "confirmed":
                return jsonify({"error": "Trade request is not confirmed"}), 400
            
            requested_user_id = trade_request.get("requestedUserID")
            if not requested_user_id:
                return jsonify({"error": "Trade request data is incomplete"}), 400
            
            # Prevent trading to the same user
            if requested_user_id == ticket.userID:
                return jsonify({"error": "You cannot trade a ticket to yourself"}), 400

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