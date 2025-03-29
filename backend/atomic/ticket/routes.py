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
    # Replace the existing trade_ticket function with this implementation

    @app.route('/ticket/trade/request/<trade_request_id>', methods=['PUT'])
    def trade_ticket_by_request_id(trade_request_id):
        """
        Process a ticket trade using the trade request ID
        This finds both tickets associated with the trade request and swaps ownership
        """
        try:
            # Find all tickets with this trade request ID
            tickets_in_trade = Ticket.query.filter_by(tradeRequestID=trade_request_id).all()
            
            if not tickets_in_trade:
                return jsonify({"error": "No tickets found with the provided trade request ID"}), 404
                
            if len(tickets_in_trade) != 2:
                return jsonify({
                    "error": f"Expected exactly 2 tickets for trade, found {len(tickets_in_trade)}. Trade request data may be inconsistent."
                }), 400
            
            # Extract the two tickets
            ticket1 = tickets_in_trade[0]
            ticket2 = tickets_in_trade[1]
            
            # Get original user IDs
            ticket1_id = ticket1.ticketID
            ticket2_id = ticket2.ticketID
            user1_id = ticket1.userID
            user2_id = ticket2.userID
            
            logger.info(f"Starting trade between tickets: {ticket1_id} (user: {user1_id}) and {ticket2_id} (user: {user2_id})")
            
            # Additional validation to ensure we're not trading between same user
            if user1_id == user2_id:
                return jsonify({
                    "error": "Cannot trade tickets between the same user"
                }), 400
            
            # Make sure tickets are in a valid state to trade
            if ticket1.status != "confirmed" or ticket2.status != "confirmed":
                invalid_ticket = ticket1 if ticket1.status != "confirmed" else ticket2
                return jsonify({
                    "error": f"Cannot trade ticket with status: {invalid_ticket.status}. Both tickets must be confirmed."
                }), 400
            
            # Swap ownership
            ticket1.userID = user2_id
            ticket2.userID = user1_id
            
            # Clear trade request IDs
            ticket1.tradeRequestID = None
            ticket2.tradeRequestID = None
            
            # Commit the changes in a single transaction
            db.session.commit()
            
            logger.info(f"Trade completed successfully. Ticket {ticket1_id} now owned by {user2_id}, Ticket {ticket2_id} now owned by {user1_id}")
            
            return jsonify({
                "message": "Trade completed successfully",
                "tradeRequestID": trade_request_id,
                "tickets": [
                    {
                        "ticketID": ticket1_id,
                        "newUserID": user2_id
                    },
                    {
                        "ticketID": ticket2_id,
                        "newUserID": user1_id
                    }
                ]
            }), 200
                
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error in trade_ticket_by_request_id: {str(e)}")
            return jsonify({"error": f"Failed to process trade request: {str(e)}"}), 500
    # Update ticket ownership (after Trade Acceptance)
   # Replace the existing trade_ticket function with this implementation

    @app.route('/ticket/trade/<ticketID>', methods=['PUT'])
    def trade_ticket(ticketID):
        """
        Process a ticket trade by finding the partner ticket with the same trade request ID
        and swapping ownership without calling the composite service
        """
        try:
            data = request.json
            
            # Validate required field
            if 'tradeRequestID' not in data:
                return jsonify({"error": "Missing required field: tradeRequestID"}), 400

            # Get the current ticket
            ticket = Ticket.query.filter_by(ticketID=ticketID).first()
            
            if not ticket:
                return jsonify({"error": "Ticket not found"}), 404
            
            # Ensure ticket is currently in a trade process
            if not ticket.tradeRequestID:
                return jsonify({"error": "This ticket is not currently involved in any trade"}), 400
                
            trade_request_id = data['tradeRequestID']
            
            # Ensure the ticket has the correct trade request ID
            if ticket.tradeRequestID != trade_request_id:
                return jsonify({
                    "error": "Ticket has a different trade request ID than provided"
                }), 400
            
            # Find the partner ticket directly in the database
            # (No need to call external services)
            partner_ticket = Ticket.query.filter(
                Ticket.tradeRequestID == trade_request_id,
                Ticket.ticketID != ticketID
            ).first()
            
            if not partner_ticket:
                return jsonify({
                    "error": "Could not find partner ticket with the same trade request ID"
                }), 404
                    
            # Get original user IDs
            ticket1_id = ticket.ticketID
            ticket2_id = partner_ticket.ticketID
            user1_id = ticket.userID
            user2_id = partner_ticket.userID
            
            logger.info(f"Starting trade between tickets: {ticket1_id} (user: {user1_id}) and {ticket2_id} (user: {user2_id})")
            
            # Additional validation to ensure we're not trading between same user
            if user1_id == user2_id:
                return jsonify({
                    "error": "Cannot trade tickets between the same user"
                }), 400
            
            # Make sure tickets are in a valid state to trade
            if ticket.status != "confirmed" or partner_ticket.status != "confirmed":
                invalid_ticket = ticket if ticket.status != "confirmed" else partner_ticket
                return jsonify({
                    "error": f"Cannot trade ticket with status: {invalid_ticket.status}. Both tickets must be confirmed."
                }), 400
            
            # Swap ownership
            ticket.userID = user2_id
            partner_ticket.userID = user1_id
            
            # Clear trade request IDs
            ticket.tradeRequestID = None
            partner_ticket.tradeRequestID = None
            
            # Commit the changes in a single transaction
            db.session.commit()
            
            logger.info(f"Trade completed successfully. Ticket {ticket1_id} now owned by {user2_id}, Ticket {ticket2_id} now owned by {user1_id}")
            
            return jsonify({
                "message": "Trade completed successfully",
                "ticket1": {
                    "ticketID": ticket1_id,
                    "newUserID": user2_id
                },
                "ticket2": {
                    "ticketID": ticket2_id,
                    "newUserID": user1_id
                }
            }), 200
                
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error in trade_ticket: {str(e)}")
            return jsonify({"error": f"Failed to process trade request: {str(e)}"}), 500

    # Set Trade Request ID on a ticket
    @app.route('/ticket/<ticket_id>/set-trade-id', methods=['POST'])
    def set_trade_request_id(ticket_id):
        """
        Set the trade request ID on a ticket
        This endpoint allows marking a ticket as part of a trade request
        """
        try:
            data = request.json
            
            if 'tradeRequestID' not in data:
                return jsonify({"error": "Missing required field: tradeRequestID"}), 400
                
            ticket = Ticket.query.filter_by(ticketID=ticket_id).first()
            
            if not ticket:
                return jsonify({"error": "Ticket not found"}), 404
                
            # Set the trade request ID
            ticket.tradeRequestID = data['tradeRequestID']
            db.session.commit()
            
            logger.info(f"Successfully set trade request ID {data['tradeRequestID']} on ticket {ticket_id}")
            
            return jsonify({
                "message": "Trade request ID set successfully",
                "ticketID": ticket_id,
                "tradeRequestID": data['tradeRequestID']
            }), 200
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error setting trade request ID: {str(e)}")
            return jsonify({"error": "Failed to set trade request ID"}), 500