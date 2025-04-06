from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import uuid  # For generating idempotency keys
import random # For randomly assigning seats

app = Flask(__name__)
CORS(app)

SEAT_SERVICE_URL = "http://seatalloc_service:5000" 
PAYMENT_SERVICE_URL = "http://payment_service:5001"
TICKET_SERVICE_URL = "http://ticket_service:5005"

@app.route("/view_availability/<event_id>")
def view_availability(event_id):
    seat_check_response = requests.get(f"{SEAT_SERVICE_URL}/availability/{event_id}")
    if seat_check_response.status_code != 200:
        return(jsonify({"error":"No available seats"}))
    
    available_seats = seat_check_response.json().get("available_seats", [])
    if not available_seats:
        return(jsonify({"error":"No available seats"}))
    return jsonify({"available_seats": available_seats}),200

@app.route("/availability/<event_id>/<category>")
def check_category_availability(event_id, category):
    # Step 1: Call Seat Allocation Service to get all available seats for the event
    seat_check_response = requests.get(f"{SEAT_SERVICE_URL}/availability/{event_id}")

    if seat_check_response.status_code != 200:
        return jsonify({"error": "Unable to fetch seat availability"}), seat_check_response.status_code
    
    # Step 2: Filter seats based on selected category
    available_seats = seat_check_response.json().get("available_seats", [])
    filtered = [seat for seat in available_seats if seat["cat_no"] == category]

    return jsonify({
        "available_seats": filtered,
        "count": len(filtered)
    }), 200

# Get all tickets for user and event with pending_payment status
@app.route('/tickets/pending/<event_id>/<category>/<user_id>', methods=['GET'])
def get_pending_tickets(event_id, category, user_id):
    try:
        # Step 1: Fetch ALL tickets from Ticket Service
        ticket_response = requests.get(f"{TICKET_SERVICE_URL}/tickets/user/{user_id}")
        if ticket_response.status_code != 200:
            return jsonify({"error": "Failed to retrieve user tickets"}), 500
        
        user_tickets = ticket_response.json()  # [{ticketID, eventID, seatID, userID, status}, ...]

        # Step 2: Filter for pending tickets for the given event
        pending_tickets = [
            t for t in user_tickets
            if t.get("eventID") == event_id and t.get("status") == "pending_payment"
        ]

        if not pending_tickets:
            return jsonify({"ticket_ids": [], "seat_ids": []}), 404

        filtered = []
        for ticket in pending_tickets:
            seat_id = ticket["seatID"]
            seat_response = requests.get(f"{SEAT_SERVICE_URL}/seat/details/{seat_id}")
            if seat_response.status_code == 200:
                seat_data = seat_response.json()
                if seat_data.get("cat_no") == category:
                    filtered.append({
                        "ticketID": ticket["ticketID"],
                        "seatID": ticket["seatID"]
                    })

        if not filtered:
            return jsonify({"ticket_ids": [], "seat_ids": []}), 404
        
        return jsonify({
            "ticket_ids": [t["ticketID"] for t in filtered],
            "seat_ids": [t["seatID"] for t in filtered]
        }), 200

    except Exception as e:
        print(f"Error retrieving pending tickets: {str(e)}")
        return jsonify({"error": "Failed to retrieve pending tickets"}), 500

# Reserve seat and creates pending ticket (no payment yet)
@app.route("/lock/<event_id>/<category>", methods=["POST"])
def lock(event_id, category):
    data = request.json
    user_id = data.get("userID")
    quantity = data.get("quantity", 1) # Use 1 as default

    if not category:
        return jsonify({"error": "Missing seat category"}), 400
    
    # Step 0: Check for existing pending tickets
    check_url = f"http://localhost:8002/tickets/pending/{event_id}/{category}/{user_id}"
    pending_response = requests.get(check_url)

    ticket_ids = []
    seat_ids = []

    if pending_response.status_code == 200:
        pending = pending_response.json()
        if len(pending["ticket_ids"]) >= quantity:
            ticket_ids = pending["ticket_ids"][:quantity]
            seat_ids = pending["seat_ids"][:quantity]
    
    if not ticket_ids or len(ticket_ids) < quantity:
        # Step 1: Check Seat Availability
        seat_check_response = requests.get(f"{SEAT_SERVICE_URL}/availability/{event_id}")
        if seat_check_response.status_code != 200:
            return jsonify({"error":"No available seats"}), 500
        
        available_seats = seat_check_response.json().get("available_seats", [])
        
        # 2. Filter by category
        seats_in_category = [s for s in available_seats if s["cat_no"] == category]
        
        # 3. Auto-pick seat(s)
        if len(seats_in_category) < quantity:
            return jsonify({"error": f"Only {len(seats_in_category)} seats available in {category}"}), 409
        
        selected_seats = random.sample(seats_in_category, quantity)
        
        # Step 2: Reserve the Seat
        for seat in selected_seats:
            seat_id = seat["seatid"]
        
            reserve_response = requests.post(f"{SEAT_SERVICE_URL}/reserve/{seat_id}")
            if reserve_response.status_code != 200:
                return jsonify({"error": f"Failed to reserve seat {seat_id}"}), 500
            
            # Step 3: Create pending ticket
            ticket_data = {'eventID':event_id, 'seatID':seat_id, 'userID':user_id}
            pending_ticket_response = requests.post(f"{TICKET_SERVICE_URL}/ticket", json=ticket_data)
            if pending_ticket_response.status_code not in [200,201]:
                return jsonify({"error":"Failed to create ticket."}), 500
            
            ticket_id = pending_ticket_response.json().get('ticketID')
            ticket_ids.append(ticket_id)
            seat_ids.append(seat_id)
    
    return jsonify({
        "message": f"Locked {quantity} seat(s)",
        "ticket_ids": ticket_ids,
        "seat_ids": seat_ids
    }), 200
    
@app.route("/purchase/<event_id>/<category>", methods=["POST"])
def purchase(event_id, category):
    data = request.json
    user_id = data.get("userID")
    quantity = data.get("quantity", 1)
    source = data.get("source")  # e.g. "tok_visa"
    idempotency_key = str(uuid.uuid4())

    if not category:
        return jsonify({"error": "Missing seat category"}), 400
    
    # Fetch pending tickets
    pending_url = f"http://localhost:8002/tickets/pending/{event_id}/{category}/{user_id}"
    pending_response = requests.get(pending_url)

    if pending_response.status_code != 200:
        return jsonify({"error": "No pending tickets found. Please select and reserve seats first."}), 400
    
    pending_data = pending_response.json()
    ticket_ids = pending_data.get("ticket_ids", [])
    seat_ids = pending_data.get("seat_ids", [])

    if len(ticket_ids) != len(seat_ids) or len(ticket_ids) != quantity:
        return jsonify({"error": "Pending ticket-seat mismatch or quantity mismatch"}), 400

    # Step 1: Calculate price
    category_prices = {
        "vip": 399.00,
        "cat_1": 299.00,
        "cat_2": 199.00,
        "cat_3": 99.00
    }

    price = category_prices.get(category.lower())
    if price is None:
        return jsonify({"error": f"Invalid category '{category}'"}), 400
    
    # Convert to cents
    total_amount = int(price * quantity)

    # Step 2: Call Payment API
    payment_data = {
        "amount": total_amount, 
        "currency": "SGD", 
        "source": source, 
        "idempotency_key":idempotency_key
    }
    payment_response = requests.post(f"{PAYMENT_SERVICE_URL}/payment", json=payment_data)

    if payment_response.status_code != 200:
        return jsonify({
            "error": "Payment failed", 
            "ticket_ids": ticket_ids, 
            "retry_possible": True
        }), 402

    # Step 3: Confirm all seats + tickets
    transaction_id = payment_response.json().get("transactionID")
    transaction_data = {"transactionID": transaction_id}

    for ticket_id, seat_id in zip(ticket_ids, seat_ids):
        confirm_seat_response = requests.put(f"{SEAT_SERVICE_URL}/confirm/{seat_id}", json={'seat_id':seat_id})
        if confirm_seat_response.status_code != 200:
            return jsonify({"error": f"Failed to confirm seat {seat_id}"}), 500
    
        confirm_ticket_response = requests.put(f"{TICKET_SERVICE_URL}/ticket/confirm/{ticket_id}", json=transaction_data)
        if confirm_ticket_response.status_code != 200:
            return jsonify({"error": f"Failed to confirm ticket {ticket_id}"}), 500
    
    return jsonify({
        "message": f"Successfully purchased {quantity} ticket(s)",
        "transactionID": transaction_id,
        "tickets": ticket_ids
    }), 200

@app.route("/timeout/<event_id>/<category>", methods=["POST"])
def timeout(event_id, category):
    data = request.json
    user_id = data.get("userID")

    if not user_id or not category:
        return jsonify({"error": "Missing required fields"}), 400
    
    # Fetch pending tickets from Ticket service
    check_url = f"http://localhost:8002/tickets/pending/{event_id}/{category}/{user_id}"
    pending_response = requests.get(check_url)

    if pending_response.status_code != 200:
        return jsonify({"message": "No pending tickets to void"}), 200
    
    pending = pending_response.json()
    ticket_ids = pending.get("ticket_ids", [])
    seat_ids = pending.get("seat_ids", [])

    if not ticket_ids or not seat_ids or len(ticket_ids) != len(seat_ids):
        return jsonify({"error": "Invalid or mismatched ticket-seat data"}), 400
    
    errors = []

    for ticket_id, seat_id in zip(ticket_ids, seat_ids):
        # Step 1: release seat
        release_seat_response = requests.put(f"{SEAT_SERVICE_URL}/release/{seat_id}", json={'seat_id':seat_id})
        if release_seat_response.status_code != 200:
            errors.append(f"Seat {seat_id}: {release_seat_response.json().get('error')}")

        # Step 2: Void pending ticket
        void_ticket_response = requests.put(f"{TICKET_SERVICE_URL}/ticket/void/{ticket_id}", json={"ticket_id":ticket_id})
        if void_ticket_response.status_code != 200:
            errors.append(f"Ticket {ticket_id}: {void_ticket_response.json().get('error')}")
    
    if errors:
        return jsonify({"message": "Timeout handled with some issues", "errors": errors}), 207
    
    return jsonify({"message": "All tickets and seats voided after timeout"}), 200
    
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8002, debug=True)