from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import uuid
import logging
from datetime import datetime
from datetime import timedelta

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3001"}}, supports_credentials=True)

# URLs for the atomic services (change to docker compose names/kong routes later on when not testing locally)
PAYMENT_SERVICE_URL = "http://payment_service:5001"
SEAT_SERVICE_URL = "http://seatalloc_service:5000"
TICKET_SERVICE_URL = "http://ticket_service:5005"
EVENT_SERVICE_URL = "https://personal-d3kdunmg.outsystemscloud.com/ESDProject/rest/"



@app.route('/refund-eligibility/<transaction_id>', methods=['GET'])
def refund_eligibility(transaction_id):
    # Step 1: Get all tickets for this transaction
    ticket_response = requests.get(f"{TICKET_SERVICE_URL}/tickets/transaction/{transaction_id}")

    if ticket_response.status_code != 200:
        return jsonify({"error": "Failed to retrieve tickets"}), 500
    
    tickets = ticket_response.json()
    event_id = tickets[0]["eventID"]
    # event_id = 5 ### HARDCODED, CHANGE LATER
    logging.debug("Event ID:", event_id)

    # Step 2: Get event date
    event_response = requests.get(f"{EVENT_SERVICE_URL}EventAPI/events/{event_id}")
    if event_response.status_code != 200:
        return jsonify({"error": "Failed to retrieve event details"}), 500
    event_data = event_response.json()
    event_date = event_data["EventResponse"]["EventDate"]
    logging.debug("Event Date:", event_date)

    # Check if refund is possible
    current_date = datetime.now()
    event_date = datetime.strptime(event_date, "%Y-%m-%d")
    one_week_before_event = event_date - timedelta(weeks=1)

    if current_date.date() < one_week_before_event.date():
        return jsonify({"message": "Full refund is possible", "refund_eligibility": True}), 200
    else:
        return jsonify({"message": "Refund not possible", "refund_eligibility": False}), 200


# Confirm transaction cancellation after checking refund validity
'''
Expected JSON payload:
{
    "refund_eligibility": true/false (boolean value)
}
'''
@app.route('/cancel/<transaction_id>', methods=['POST'])
def cancel_transaction(transaction_id):
    data = request.get_json()
    refund_eligibility = data.get("refund_eligibility")
    idempotency_key = str(uuid.uuid4())

    if refund_eligibility is None:
        return jsonify({"error": "Refund eligibility is missing"}), 400

    # Step 1: Get all tickets for this transaction
    ticket_response = requests.get(f"{TICKET_SERVICE_URL}/tickets/transaction/{transaction_id}")

    if ticket_response.status_code != 200:
        return jsonify({"error": "Failed to retrieve tickets", "statuscode": ticket_response.status_code}), 500
    
    tickets = ticket_response.json()

    # Step 3,4: Void ticket and get response
    for ticket in tickets:
        ticket_id = ticket["ticketID"]
        void_response = requests.put(f"{TICKET_SERVICE_URL}/ticket/void/{ticket_id}")
        if void_response.status_code != 200:
            return jsonify({"error": "Failed to void ticket", "statuscode": void_response.status_code}), 500

    # Step 5: Release seat
    for ticket in tickets:
        # seat_id = "db634fd3-57a8-4f3a-a53d-9243f8381345" ###HARDCODED CHANGE LATER, currently only one ticket in transaction, later on use code below
        seat_id = ticket["seatID"]
        release_response = requests.put(f"{SEAT_SERVICE_URL}/release/{seat_id}")
        if release_response.status_code != 200:
            return jsonify({"error": "Failed to release seat", "statuscode": release_response.status_code}), 500

    if refund_eligibility is True:
        # Step 6: Refund payment
        payment_response = requests.get(f"{PAYMENT_SERVICE_URL}/payment/{transaction_id}")
        # payment_response = requests.get(f"{PAYMENT_SERVICE_URL}/payment/txn-433849") ### HARDCODED TRANSACTIONID, CHANGE LATER to the code above

        if payment_response.status_code != 200:
            return jsonify({"error": "Failed to retrieve stripeID"}), 500
        stripe_id = payment_response.json().get("stripeID")
        logging.debug("Stripe ID:", stripe_id)
    
        refund_data = {
            "stripeID": stripe_id,
            "idempotency_key": idempotency_key
        }

        refund_response = requests.post(f"{PAYMENT_SERVICE_URL}/refund", json=refund_data)

        if refund_response.status_code != 201:
            return jsonify({"error": "Failed to refund payment", "statuscode": refund_response.status_code}), 500

        refund_record = refund_response.json()
        amount_refunded = refund_record.get("amount")

    elif refund_eligibility is False:
        return jsonify({"message": "Transaction cancelled successfully without refund", "cancelled_tickets": tickets}), 200

    return jsonify({"message": "Transaction cancelled successfully with full refund", "amount_refunded": amount_refunded, "cancelled_tickets": tickets}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6001, debug=True)