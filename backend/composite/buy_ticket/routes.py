from flask import Flask, request, jsonify
import requests
import uuid  # For generating idempotency keys

app = Flask(__name__)

SEAT_SERVICE_URL = "http://127.0.0.1:5000" 
PAYMENT_SERVICE_URL = "http://127.0.0.1:5001"
TICKET_SERVICE_URL = "http://127.0.0.1:5005"

@app.route("/view_availability/<event_id>")
def view_availability(event_id):
    seat_check_response = requests.get(f"{SEAT_SERVICE_URL}/availability/{event_id}")
    if seat_check_response.status_code != 200:
        return(jsonify({"error":"No available seats"}))
    
    available_seats = seat_check_response.json().get("available_seats", [])
    if not available_seats:
        return(jsonify({"error":"No available seats"}))
    return jsonify({"available_seats": available_seats}),200
    
@app.route("/purchase/<event_id>/<seat_id>", methods=["POST"])
def purchase(event_id, seat_id):
    user_id = "user_123"
    idempotency_key = str(uuid.uuid4())  # Generate unique key per request

    # Step 1: Check Seat Availability
    seat_check_response = requests.get(f"{SEAT_SERVICE_URL}/availability/{event_id}")
    
    if seat_check_response.status_code != 200:
        return(jsonify({"error":"No available seats"}))
    
    available_seats = seat_check_response.json().get("available_seats", [])
    
    if not any(seat["seatid"] == seat_id for seat in available_seats):
        return jsonify({"error": "Seat not available"}), 409
    

    # Step 2: Reserve the Seat
    reserve_response = requests.post(f"{SEAT_SERVICE_URL}/reserve/{event_id}/{seat_id}/{idempotency_key}")
    
    if reserve_response.status_code == 404:
        return jsonify({"error": "Seat not found"}), 500
    
    elif reserve_response.status_code == 409:
        return jsonify({"error": "Seat already reserved"}),409
    
    elif reserve_response.status_code != 200:
        return jsonify({"error":"Reservation failed."}),500

    #print(jsonify({"message": "Ticket successfully reserved", "seat_id": seat_id}), 200)

    # Step 3: Create pending ticket

    ticket_data = {'eventID':event_id, 'seatID':seat_id, 'userID':"user387", 'idempotencyKey':idempotency_key}
    pending_ticket_response = requests.post(f"{TICKET_SERVICE_URL}/ticket", json=ticket_data)

    ticket_id = pending_ticket_response.json().get('ticketID')
    if pending_ticket_response.status_code not in [200,201]:
        return(jsonify({"error":"Failed to create ticket."}), 402)

    #print(jsonify({"message":"Ticket creation successful."}), 200)

    # Step 4: Process Payment

    #amount should be extracted from event? currency should be all be SGD, source retrieve from UI
    payment_data = {"amount": 10000, "currency": "SGD", "source": "tok_visa", "idempotency_key":idempotency_key}
    payment_response = requests.post(f"{PAYMENT_SERVICE_URL}/payment", json=payment_data)
    #return(payment_response.json())
    if payment_response.status_code != 200:
        # Step 4: Release Seat if Payment Fails
        #requests.put(f"{SEAT_SERVICE_URL}/release/{seat_id}/{idempotency_key}")
        return jsonify({"error": "Payment failed"}), 402

    # jsonify({"message": "Payment successful."}), 200

    # Step 5: Confirm Ticket
    
    #payment service does not assign transactionID 
    transaction_data = {"transactionID": payment_response.json().get("stripeID")}
    
    confirm_ticket_response = requests.put(f"{TICKET_SERVICE_URL}/ticket/confirm/{ticket_id}", json=transaction_data)
    
    if confirm_ticket_response.status_code == 200:
        return jsonify({"message": "Ticket purchase successful", "ticket": confirm_ticket_response.json()}),200
    elif confirm_ticket_response.status_code == 409:
        return {"error": "Ticket already confirmed with a different transaction"}
    elif confirm_ticket_response.status_code == 400:
        return {"error": "Cannot confirm ticket due to invalid status"}
    elif confirm_ticket_response.status_code == 404:
        return {"error": "Ticket not found"}
    else:
        return {"error": "Failed to confirm ticket"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8002, debug=True)