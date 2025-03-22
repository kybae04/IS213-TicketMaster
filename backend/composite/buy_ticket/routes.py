from flask import Flask, request, jsonify
import requests
import uuid  # For generating idempotency keys

app = Flask(__name__)

SEAT_SERVICE_URL = "http://127.0.0.1:5000" 
PAYMENT_SERVICE_URL = "http://payment:5001"

@app.route("/view_availability/<event_id>")
def view_availability(event_id):
    seat_check_response = requests.get(f"{SEAT_SERVICE_URL}/availability/{event_id}")
    if seat_check_response.status_code != 200:
        return(jsonify({"error":"No available seats"}))
    
    available_seats = seat_check_response.json().get("available_seats", [])
    if not available_seats:
        return(jsonify({"error":"No available seats"}))
    return jsonify({"available_seats": available_seats}),200
    
@app.route("/buy_ticket/<event_id>/<seat_id>", methods=["POST"])
def buy_ticket(event_id, seat_id):
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

    return(jsonify({"message": "Ticket successfully reserved", "seat_id": seat_id}), 200)
    
    # Step 3: Process Payment
    payment_data = {"amount": 100, "currency": "USD"}  # Example payment data
    payment_response = requests.post(f"{PAYMENT_SERVICE_URL}/pay", json=payment_data)

    if payment_response.status_code != 200:
        # Step 4: Release Seat if Payment Fails
        requests.put(f"{SEAT_SERVICE_URL}/release/{seat_id}/{idempotency_key}")
        return jsonify({"error": "Payment failed"}), 402

    # Step 5: Confirm Seat Reservation
    confirm_response = requests.put(f"{SEAT_SERVICE_URL}/confirm/{seat_id}")

    if confirm_response.status_code != 200:
        return jsonify({"error": "Failed to confirm seat"}), 500

    return jsonify({"message": "Ticket purchase successful"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8002, debug=True)