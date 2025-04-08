import logging
import requests
from flask import request, jsonify
from db import db
from models import Ticket
from config import Config
import uuid

# Configure logging
logger = logging.getLogger(__name__)

TRADE_TICKET_SERVICE_URL = "http://trade_ticket_service:8003"

def register_routes(app):
    
    # Create a Pending Ticket
    @app.route('/ticket', methods=['POST'])
    def create_ticket():
        try:
            data = request.json
        
            # Validate required fields
            required_fields = ['eventID', 'seatID', 'userID']
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
        
            # Create a new ticket
            ticketID = str(uuid.uuid4())
            new_ticket = Ticket(
                ticketID=ticketID,
                eventID=data['eventID'],
                seatID=data['seatID'],
                userID=data['userID'],
                status="pending_payment",
                listed_for_trade=False
            )
        
            db.session.add(new_ticket)
            db.session.commit()
        
            return jsonify({
                "ticketID": ticketID,
                "eventID": data['eventID'],
                "seatID": data['seatID'],
                "userID": data['userID'],
                "status": "pending_payment",
                "listed_for_trade": False
            }), 201
    
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating ticket: {str(e)}")
            return jsonify({"error": "Failed to create ticket"}), 500

    # Confirm Ticket After Payment
    @app.route('/ticket/confirm/<ticketID>', methods=['PUT'])
    def confirm_ticket(ticketID):
        try:
            data = request.json

            # Validate that transactionID is present
            if 'transactionID' not in data:
                return jsonify({"error": "Missing required field: transactionID"}), 400
        
            # Find ticket using the URL parameter
            ticket = Ticket.query.filter_by(ticketID=ticketID).first()
        
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
                    logger.warning(f"Conflicting transactionID for ticket {ticketID}. Existing: {ticket.transactionID}, Received: {data['transactionID']}")
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

            logger.info(f"Ticket {ticketID} confirmed with transaction {data['transactionID']}")
        
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
                "listed_for_trade": ticket.listed_for_trade
            }), 200
    
        except Exception as e:
            logger.error(f"Error retrieving ticket: {str(e)}")
            return jsonify({"error": "Failed to retrieve ticket"}), 500
    
    # Get Tickets by Transaction ID
    @app.route('/tickets/transaction/<transactionID>', methods=['GET'])
    def get_tickets_by_transaction(transactionID):
        try:
            tickets = Ticket.query.filter_by(transactionID=transactionID).all()
            if tickets == []:
                return jsonify({"error": "Transaction ID does not exist"}), 404
            return jsonify([ticket.to_dict() for ticket in tickets]), 200
        except Exception as e:
            logger.error(f"Error retrieving tickets: {str(e)}")
            return jsonify({"error": "Failed to retrieve tickets"}), 500
    
    # Get Tickets by EventID
    @app.route("/tickets/event/<event_id>", methods=["GET"])
    def get_tickets_by_event(event_id):
        try:
            tickets = Ticket.query.filter_by(eventID=event_id).all()
            if tickets == []:
                return jsonify({"error": "Event ID does not exist"}), 404
            return jsonify([ticket.to_dict() for ticket in tickets]), 200
        except Exception as e:
            logger.error(f"Error retrieving tickets: {str(e)}")
            return jsonify({"error": "Failed to retrieve tickets"}), 500

    # Get Tickets by User ID
    @app.route('/tickets/user/<user_id>', methods=['GET'])
    def get_tickets_by_user(user_id):
        try:
            tickets = Ticket.query.filter_by(userID=user_id).all()
            if tickets == []:
                return jsonify({"error": "User ID does not exist"}), 404
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
            
            # If ticket is listed for trade
            if ticket.listed_for_trade:
                # Prevent voiding if there's an active trade
                return jsonify({
                    "error": "Cannot void ticket while it is listed for trade. Please cancel the trade first.",
                    "ticketID": ticket.ticketID,
                    "listed_for_trade": ticket.listed_for_trade
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
    
    # Function to allow user to list the ticket for trade
    @app.route("/ticket/<ticket_id>/list-for-trade", methods=["PUT"])
    def list_for_trade(ticket_id):
        try:
            data = request.get_json()
            list_status = data.get("listed_for_trade")

            if list_status is None:
                return jsonify({"error": "Missing 'listed_for_trade' in request body"}), 400
            
            ticket = Ticket.query.filter_by(ticketID=ticket_id).first()
            if not ticket:
                return jsonify({"error": f"Ticket {ticket_id} not found"}), 404
            
            ticket.listed_for_trade = bool(list_status)
            db.session.commit()

            return jsonify({
                "message": f"Ticket {ticket_id} listing status updated",
                "listed_for_trade": ticket.listed_for_trade
            }), 200
        
        except Exception as e:
            return jsonify({"error": f"Server error: {str(e)}"}), 500

    # Function to swap ownership of tickets
    @app.route('/ticket/trade/request/<trade_request_id>', methods=['PUT'])
    def trade_ticket_by_request_id(trade_request_id):
        """
        Process a ticket trade using the trade request ID
        This finds both tickets associated with the trade request and swaps ownership
        """
        try:
            # Step 1: Get trade request details from Trade Ticket Composite
            response = requests.get(f"{TRADE_TICKET_SERVICE_URL}/trade-request/{trade_request_id}")

            if response.status_code != 200:
                return jsonify({"error": "Trade request not found"}), 404
            
            trade_data = response.json()
            ticket1_id = trade_data.get("ticketID")
            ticket2_id = trade_data.get("requestedTicketID")
            user1_id = trade_data.get("requesterID")
            user2_id = trade_data.get("requestedUserID")

            # Step 2: Load both tickets
            ticket1 = Ticket.query.filter_by(ticketID=ticket1_id).first()
            ticket2 = Ticket.query.filter_by(ticketID=ticket2_id).first()

            if not ticket1 or not ticket2:
                return jsonify({"error": "One or both tickets not found"}), 404
            
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
            
            # Swap ticketIDs and seatIDs between the two owners
            temp_seatID = ticket1.seatID
            ticket1.seatID = ticket2.seatID
            ticket2.seatID = temp_seatID
            
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
