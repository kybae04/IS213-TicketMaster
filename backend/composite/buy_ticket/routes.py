from flask import Flask, request, jsonify
import requests
import uuid  # For generating idempotency keys
import random # For randomly assigning seats

app = Flask(__name__)

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
    
@app.route("/purchase/<event_id>/<category>", methods=["POST"])
def purchase(event_id, category):
    data = request.json
    user_id = data.get("userID")
    category = data.get("category")
    quantity = data.get("quantity", 1) # Use 1 as default
    idempotency_key = str(uuid.uuid4())  # Generate unique key per request

    if not category:
        return jsonify({"error": "Missing seat category"}), 400
    
    # Step 0: Check for existing pending tickets
    check_url = f"{TICKET_SERVICE_URL}/tickets/pending/{event_id}/{category}/{user_id}"
    pending_response = requests.get(check_url)

    ticket_ids = []
    if pending_response.status_code == 200:
        pending = pending_response.json()
        if len(pending["ticket_ids"]) >= quantity:
            ticket_ids = list(zip(pending["ticket_ids"][:quantity], pending["seat_ids"][:quantity]))
        
    if not ticket_ids:

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
            ticket_ids.append((ticket_id, seat_id))

    # Step 4: Process Payment (shared for all)
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
    total_amount = int(price * quantity * 100)  # cents

    #input retrieved from UI
    payment_data = {"amount": total_amount, "currency": "SGD", "source": data.get("source"), "idempotency_key":idempotency_key}
    payment_response = requests.post(f"{PAYMENT_SERVICE_URL}/payment", json=payment_data)
    #return(payment_response.json())
    if payment_response.status_code != 200:
        # Step 4: Release Seat if Payment Fails
        #requests.put(f"{SEAT_SERVICE_URL}/release/{seat_id}/{idempotency_key}")
        return jsonify({"error": "Payment failed", "ticket_ids": [tid for tid, _ in ticket_ids], "retry_possible": True}), 402

    # jsonify({"message": "Payment successful."}), 200

    # Step 5: Confirm all seats + tickets
    transaction_id = payment_response.json().get("transactionID")
    transaction_data = {"transactionID": transaction_id}

    for ticket_id, seat_id in ticket_ids:
        confirm_seat_response = requests.put(f"{SEAT_SERVICE_URL}/confirm/{seat_id}", json={'seat_id':seat_id})
        if confirm_seat_response.status_code != 200:
            return jsonify({"error": f"Failed to confirm seat {seat_id}"}), 500
    
        confirm_ticket_response = requests.put(f"{TICKET_SERVICE_URL}/ticket/confirm/{ticket_id}", json=transaction_data)
        if confirm_ticket_response.status_code != 200:
            return jsonify({"error": f"Failed to confirm ticket {ticket_id}"}), 500
    
    return jsonify({
        "message": f"Successfully purchased {quantity} ticket(s)",
        "transactionID": transaction_id,
        "tickets": [tid for tid, _ in ticket_ids]
    }), 200

@app.route("/timeout/<seat_id>/<ticket_id>", methods=["POST"])
def timeout(ticket_id, seat_id):
    
    # Step 1: release seat
    release_seat_response = requests.put(f"{SEAT_SERVICE_URL}/release/{seat_id}", json={'seat_id':seat_id})
    if release_seat_response.status_code != 200:
        return (release_seat_response.json().get("error")), 404
    print(release_seat_response.json().get('message'),200)

    # Step 2: Void pending ticket
    void_ticket_response = requests.put(f"{TICKET_SERVICE_URL}/ticket/void/{ticket_id}", json={"ticket_id":ticket_id})

    if void_ticket_response.status_code != 200:
        return(void_ticket_response.json().get('error'))
    return jsonify({"message": "Timeout. Please select tickets again."})
    
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8002, debug=True)