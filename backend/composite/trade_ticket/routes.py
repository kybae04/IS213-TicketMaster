from flask import Flask, request, jsonify
import requests
import uuid
import pika
import json
from datetime import datetime
import traceback
import os

app = Flask(__name__)

# Update atomic services URLs to use Docker container names and internal ports
PAYMENT_SERVICE_URL = "http://payment_service:5001"
SEAT_SERVICE_URL = "http://seatalloc_service:5000"
TICKET_SERVICE_URL = "http://ticket_service:5005"
EVENT_SERVICE_URL = "https://personal-d3kdunmg.outsystemscloud.com/ESDProject/rest/"

# Update RabbitMQ host to use Docker container name
RABBITMQ_HOST = "rabbitmq"
RABBITMQ_PORT = 5672
TRADE_QUEUE = "trade_requests"

# Update the publish_to_rabbitmq function with credentials
def publish_to_rabbitmq(queue_name, message):
    """Publish a message to RabbitMQ queue"""
    try:
        # Establish connection with credentials
        credentials = pika.PlainCredentials('guest', 'guest')  # Default credentials
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host=RABBITMQ_HOST, 
                port=RABBITMQ_PORT,
                credentials=credentials
            )
        )
        channel = connection.channel()
        
        # Declare queue (creates if doesn't exist)
        channel.queue_declare(queue=queue_name, durable=True)
        
        # Publish message
        channel.basic_publish(
            exchange='',
            routing_key=queue_name,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # make message persistent
                content_type='application/json'
            )
        )
        
        connection.close()
        return True
    except Exception as e:
        print(f"Error publishing to RabbitMQ: {str(e)}")
        return False
# (1-4) Send trade request (User 1 initiates trade)
# Update the create_trade_request function

# Update the create_trade_request function with proper HTTP method and better error handling

@app.route('/trade-request', methods=['POST'])
def create_trade_request():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ["ticketID", "requesterID", "requestedTicketID", "requestedUserID"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
                
        # First, verify both tickets exist before proceeding
        ticket1_id = data["ticketID"]
        ticket2_id = data["requestedTicketID"]
        
        # Validate tickets exist
        try:
            response1 = requests.get(f"{TICKET_SERVICE_URL}/ticket/{ticket1_id}")
            if response1.status_code != 200:
                return jsonify({"error": f"Ticket {ticket1_id} not found or not available"}), 404
                
            response2 = requests.get(f"{TICKET_SERVICE_URL}/ticket/{ticket2_id}")
            if response2.status_code != 200:
                return jsonify({"error": f"Ticket {ticket2_id} not found or not available"}), 404
        except Exception as e:
            print(f"Error validating tickets: {str(e)}")
            return jsonify({"error": "Failed to validate tickets. Ticket service may be unavailable."}), 500
                
        # Generate trade request ID
        trade_request_id = str(uuid.uuid4())
        
        # Set trade request ID on both tickets BEFORE publishing to queue
        trade_id_data = {
            "tradeRequestID": trade_request_id
        }
        
        # Set trade ID on ticket 1 using PATCH (not POST)
        try:
            response1 = requests.post(
                f"{TICKET_SERVICE_URL}/ticket/{ticket1_id}/set-trade-id",
                json=trade_id_data
            )
            print(f"Setting trade ID on ticket 1 - Status: {response1.status_code}")
            
            if response1.status_code != 200:
                return jsonify({
                    "error": f"Failed to set trade request ID on ticket {ticket1_id}",
                    "status": response1.status_code,
                    "details": response1.text
                }), 500
                
        except Exception as e:
            print(f"Error setting trade ID on ticket 1: {str(e)}")
            return jsonify({"error": f"Failed to set trade request ID on ticket {ticket1_id}: {str(e)}"}), 500
        
        # Set trade ID on ticket 2 using PATCH (not POST)
        try:
            response2 = requests.post(
                f"{TICKET_SERVICE_URL}/ticket/{ticket2_id}/set-trade-id",
                json=trade_id_data
            )
            print(f"Setting trade ID on ticket 2 - Status: {response2.status_code}")
            
            if response2.status_code != 200:
                # If setting trade ID on ticket 2 fails, revert ticket 1 to maintain consistency
                revert_response = requests.post(
                    f"{TICKET_SERVICE_URL}/ticket/{ticket1_id}/set-trade-id",
                    json={"tradeRequestID": None}
                )
                
                return jsonify({
                    "error": f"Failed to set trade request ID on ticket {ticket2_id}",
                    "status": response2.status_code,
                    "details": response2.text
                }), 500
                
        except Exception as e:
            print(f"Error setting trade ID on ticket 2: {str(e)}")
            # Revert ticket 1 if ticket 2 update fails
            revert_response = requests.post(
                f"{TICKET_SERVICE_URL}/ticket/{ticket1_id}/set-trade-id",
                json={"tradeRequestID": None}
            )
            return jsonify({"error": f"Failed to set trade request ID on ticket {ticket2_id}: {str(e)}"}), 500
        
        # Only after successfully updating both tickets, create the trade message
        trade_message = {
            "tradeRequestID": trade_request_id,
            "ticketID": data["ticketID"],
            "requesterID": data["requesterID"],
            "requestedTicketID": data["requestedTicketID"],
            "requestedUserID": data["requestedUserID"],
            "status": "pending",
            "timestamp": datetime.now().isoformat()
        }
        
        # Publish to RabbitMQ
        success = publish_to_rabbitmq(TRADE_QUEUE, trade_message)
        
        if not success:
            # If RabbitMQ fails, revert the changes to tickets
            try:
                requests.post(
                    f"{TICKET_SERVICE_URL}/ticket/{ticket1_id}/set-trade-id",
                    json={"tradeRequestID": None}
                )
                requests.post(
                    f"{TICKET_SERVICE_URL}/ticket/{ticket2_id}/set-trade-id",
                    json={"tradeRequestID": None}
                )
            except Exception as revert_error:
                print(f"Failed to revert ticket changes: {str(revert_error)}")
                
            return jsonify({
                "error": "Failed to process trade request due to messaging service error."
            }), 500
        
        return jsonify({
            "tradeRequestID": trade_request_id,
            "message": "Trade request submitted successfully."
        }), 202  # HTTP 202 Accepted
        
    except Exception as e:
        print(f"Error creating trade request: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# Add this function to peek at messages in RabbitMQ without consuming them
def peek_messages_from_rabbitmq(queue_name, user_id=None):
    """
    Peek at messages in RabbitMQ queue without consuming them
    If user_id is provided, filter for messages related to that user
    """
    messages = []
    try:
        # Establish connection
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=RABBITMQ_HOST, port=RABBITMQ_PORT)
        )
        channel = connection.channel()
        
        # Declare queue (ensure it exists)
        channel.queue_declare(queue=queue_name, durable=True)
        
        # Get message count
        queue_info = channel.queue_declare(queue=queue_name, durable=True, passive=True)
        message_count = queue_info.method.message_count
        
        # Collect messages without actually removing them from the queue
        for _ in range(message_count):
            method_frame, header_frame, body = channel.basic_get(queue=queue_name, auto_ack=False)
            if method_frame:
                # Parse message
                message = json.loads(body)
                
                # If user_id is provided, filter messages
                if user_id is None or (
                    message.get("requestedUserID") == user_id or 
                    message.get("requesterID") == user_id
                ):
                    messages.append(message)
                
                # Return message to queue (we're just peeking)
                channel.basic_nack(delivery_tag=method_frame.delivery_tag, requeue=True)
            else:
                break
                
        connection.close()
        return messages, True
    except Exception as e:
        print(f"Error peeking messages from RabbitMQ: {str(e)}")
        return [], False

# (5-7) Get all pending trade requests for a user
@app.route('/trade-requests/<requested_user_id>', methods=['GET'])
def get_pending_trade_requests(requested_user_id):
    # Try to get pending requests from RabbitMQ
    messages, success = peek_messages_from_rabbitmq(TRADE_QUEUE, requested_user_id)
    
    if success:
        # Group messages by tradeRequestID and keep only the latest status for each
        trade_requests_dict = {}
        for message in messages:
            trade_id = message.get("tradeRequestID")
            if trade_id:
                # If this is a new trade request or a newer message for an existing one
                if trade_id not in trade_requests_dict or (
                    "timestamp" in message and 
                    message["timestamp"] > trade_requests_dict[trade_id].get("timestamp", "")
                ):
                    trade_requests_dict[trade_id] = message
        
        # Filter for only pending trade requests
        pending_requests = [
            req for req in trade_requests_dict.values() 
            if req.get("status") == "pending"
        ]
        
        if pending_requests:
            return jsonify(pending_requests), 200
    
    # If no success with RabbitMQ or no pending requests, try the ticket service
    try:
        response = requests.get(f"{TICKET_SERVICE_URL}/trade-requests/pending/{requested_user_id}")
        if response.status_code == 200:
            return jsonify(response.json()), 200
            
    except Exception as e:
        print(f"Error fetching trade requests from ticket service: {str(e)}")
    
    # Fallback to simulated data if everything else fails
    pending_requests = [
        {
            "tradeRequestID": "example-request-id",
            "ticketID": "user1-ticket-id",
            "requesterID": "user1-id",
            "requestedTicketID": "user2-ticket-id", 
            "requestedUserID": requested_user_id,
            "status": "pending",
            "timestamp": datetime.now().isoformat()
        }
    ]
    return jsonify(pending_requests), 200


# Add a function to find and consume a specific trade request from the queue
# ...existing code...

# Fix the find_and_process_trade_request function
def find_and_process_trade_request(queue_name, trade_request_id, new_status):
    """
    Find a specific trade request in the queue, consume it, and publish an update
    
    Args:
        queue_name (str): The name of the queue to search
        trade_request_id (str): The ID of the trade request to find
        new_status (dict): New status information to publish
        
    Returns:
        tuple: (original_message, success_flag)
    """
    try:
        # First, use peek_messages to find if the trade request exists
        messages, success = peek_messages_from_rabbitmq(queue_name)
        if not success:
            print("Failed to peek messages from RabbitMQ")
            return None, False
            
        # Find the pending trade request with matching ID
        found_message = None
        for message in messages:
            if (message.get("tradeRequestID") == trade_request_id and 
                message.get("status") == "pending"):
                found_message = message
                break
                
        if not found_message:
            print(f"No pending trade request found with ID: {trade_request_id}")
            return None, False
        
        # Establish connection to remove and update the message
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=RABBITMQ_HOST, port=RABBITMQ_PORT)
        )
        channel = connection.channel()
        
        # Declare queue (ensure it exists)
        channel.queue_declare(queue=queue_name, durable=True)
        
        # Get message count
        queue_info = channel.queue_declare(queue=queue_name, durable=True, passive=True)
        message_count = queue_info.method.message_count
        
        # Remove the original message from the queue
        for _ in range(message_count):
            method_frame, header_frame, body = channel.basic_get(queue=queue_name, auto_ack=False)
            if not method_frame:
                break
                
            message = json.loads(body)
            
            if (message.get("tradeRequestID") == trade_request_id and 
                message.get("status") == "pending"):
                # Found the pending trade request - acknowledge and remove from queue
                channel.basic_ack(delivery_tag=method_frame.delivery_tag)
                break
            else:
                # Not the message we're looking for, put it back in the queue
                channel.basic_nack(delivery_tag=method_frame.delivery_tag, requeue=True)
        
        # Merge the original message with the new status information
        updated_message = {**found_message, **new_status}
        
        # Publish the updated status to the queue
        channel.basic_publish(
            exchange='',
            routing_key=queue_name,
            body=json.dumps(updated_message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # make message persistent
                content_type='application/json'
            )
        )
            
        connection.close()
        print(f"Successfully processed trade request: {trade_request_id}")
        return found_message, True
        
    except Exception as e:
        print(f"Error processing trade request from RabbitMQ: {str(e)}")
        return None, False
# Add this function below find_and_process_trade_request

def remove_message_from_queue(queue_name, trade_request_id):
    """
    Remove all messages with the specified trade request ID from the queue
    
    Args:
        queue_name (str): The name of the queue to search
        trade_request_id (str): The ID of the trade request to remove
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Establish connection
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=RABBITMQ_HOST, port=RABBITMQ_PORT)
        )
        channel = connection.channel()
        
        # Declare queue (ensure it exists)
        channel.queue_declare(queue=queue_name, durable=True)
        
        # Get message count
        queue_info = channel.queue_declare(queue=queue_name, durable=True, passive=True)
        message_count = queue_info.method.message_count
        
        messages_removed = 0
        # Remove all messages with the specified trade request ID
        for _ in range(message_count):
            method_frame, header_frame, body = channel.basic_get(queue=queue_name, auto_ack=False)
            if not method_frame:
                break
                
            message = json.loads(body)
            
            if message.get("tradeRequestID") == trade_request_id:
                # Found a matching trade request - acknowledge to remove from queue
                channel.basic_ack(delivery_tag=method_frame.delivery_tag)
                messages_removed += 1
                print(f"Removed message with status: {message.get('status')}")
            else:
                # Not the message we're looking for, put it back in the queue
                channel.basic_nack(delivery_tag=method_frame.delivery_tag, requeue=True)
        
        connection.close()
        print(f"Successfully removed {messages_removed} messages for trade request: {trade_request_id}")
        return True
        
    except Exception as e:
        print(f"Error removing messages from RabbitMQ: {str(e)}")
        return False
# In your accept_trade_request function, modify the ticket service call:

# Update the accept_trade_request function to remove messages after successful processing

@app.route('/trade-request/accept', methods=['PATCH'])
def accept_trade_request():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        trade_request_id = data.get("tradeRequestID")
        accepting_user_id = data.get("acceptingUserID")
        
        if not trade_request_id or not accepting_user_id:
            return jsonify({"error": "Missing required fields: tradeRequestID or acceptingUserID"}), 400

        # Update trade request status to "accepted"
        accepted_status = {
            "status": "accepted",
            "acceptedBy": accepting_user_id,
            "acceptedAt": datetime.now().isoformat()
        }
        
        # Find the original trade request and update its status in the queue
        original_message, success = find_and_process_trade_request(
            TRADE_QUEUE, trade_request_id, accepted_status
        )
        
        if not success:
            return jsonify({
                "error": "Failed to accept trade request. Request may not exist or is not in a pending state."
            }), 404
            
        # If successful, proceed with ticket ownership transfer
        try:
            # Use the trade_ticket_by_request_id endpoint to process the trade
            print(f"Calling ticket service for trade with ID: {trade_request_id}")
            
            response = requests.put(
                f"{TICKET_SERVICE_URL}/ticket/trade/request/{trade_request_id}",
                json={}  # No body needed as trade request ID is in URL path
            )
            
            print(f"Trade endpoint response status: {response.status_code}")
            print(f"Trade endpoint response body: {response.text}")
            
            # Rest of the function remains the same...
            
            if response.status_code == 200:
                # Extract ticket IDs from the original trade request
                ticket1_id = original_message.get("ticketID")
                ticket2_id = original_message.get("requestedTicketID")
                
                # IMPORTANT: Remove the accepted trade request from the queue
                # since the trade has been successfully completed
                remove_success = remove_message_from_queue(TRADE_QUEUE, trade_request_id)
                if remove_success:
                    print(f"Successfully removed trade request {trade_request_id} from queue")
                else:
                    print(f"Warning: Could not remove trade request {trade_request_id} from queue")
                
                return jsonify({
                    "message": "Trade request accepted and ownership transfer completed.",
                    "ticketID": ticket1_id,
                    "requestedTicketID": ticket2_id,
                    "tradeDetails": json.loads(response.text) if response.text else {},
                    "queueCleanup": remove_success
                }), 200
            else:
                return jsonify({
                    "message": "Trade request accepted but ownership transfer failed.",
                    "error": response.text,
                    "status": response.status_code
                }), 500
                
        except Exception as e:
            print(f"Error processing accepted trade: {str(e)}")
            traceback.print_exc()  # Print the full stack trace for better debugging
            return jsonify({
                "message": "Trade request accepted but ownership transfer failed.",
                "error": str(e)
            }), 500
            
    except Exception as e:
        print(f"Unexpected error in accept_trade_request: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500
    
# Add a new endpoint to cancel a trade request - Updated to handle message consumption
@app.route('/trade-request/cancel', methods=['PATCH'])
def cancel_trade_request():
    data = request.json
    trade_request_id = data["tradeRequestID"]
    cancelling_user_id = data["userID"]
    
    # Cancel trade request message
    cancel_status = {
        "status": "cancelled",
        "cancelledBy": cancelling_user_id,
        "cancelledAt": datetime.now().isoformat()
    }
    
    # Find the original trade request and update its status
    original_message, success = find_and_process_trade_request(
        TRADE_QUEUE, trade_request_id, cancel_status
    )
    
    if not success:
        return jsonify({
            "error": "Failed to cancel trade request. Request may not exist or is not in a pending state."
        }), 404
        
    return jsonify({
        "message": "Trade request cancelled successfully.",
        "tradeRequestID": trade_request_id
    }), 200

@app.route('/trade-status/<ticket_id>', methods=['GET'])
def get_ticket_trade_status(ticket_id):
    """Get the trade status of a ticket"""
    try:
        # Call the ticket service to get ticket details
        response = requests.get(f"{TICKET_SERVICE_URL}/ticket/{ticket_id}")
        
        if response.status_code != 200:
            return jsonify({
                "error": "Failed to retrieve ticket information",
                "status": response.status_code
            }), 404
        
            
        ticket_data = response.json()
        
        # Check if ticket has a trade request ID
        trade_request_id = ticket_data.get("tradeRequestID")
        
        if not trade_request_id:
            return jsonify({
                "ticketID": ticket_id,
                "inTrade": False,
                "message": "This ticket is not part of any trade request"
            }), 200
            
        # Get trade request details
        messages, success = peek_messages_from_rabbitmq(TRADE_QUEUE)
        
        if not success:
            return jsonify({
                "ticketID": ticket_id,
                "inTrade": True,
                "tradeRequestID": trade_request_id,
                "message": "Ticket is in a trade, but trade details could not be retrieved"
            }), 200
            
        # Find the latest trade request message
        latest_message = None
        latest_timestamp = None
        
        for message in messages:
            if message.get("tradeRequestID") == trade_request_id:
                message_timestamp = message.get("timestamp")
                
                if not latest_message or (message_timestamp and message_timestamp > latest_timestamp):
                    latest_message = message
                    latest_timestamp = message_timestamp
                    
        if latest_message:
            return jsonify({
                "ticketID": ticket_id,
                "inTrade": True,
                "tradeDetails": latest_message
            }), 200
        else:
            return jsonify({
                "ticketID": ticket_id,
                "inTrade": True,
                "tradeRequestID": trade_request_id,
                "message": "Trade request exists but details could not be found"
            }), 200
            
    except Exception as e:
        print(f"Error getting ticket trade status: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8003, debug=True)