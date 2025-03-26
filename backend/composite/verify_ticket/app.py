import logging
import datetime
import requests
from flask import Flask, jsonify
from flask_cors import CORS
from services import fetch_ticket, fetch_event, fetch_seat
from atomic import TICKET_SERVICE_URL, EVENT_SERVICE_URL, SEAT_SERVICE_URL

app = Flask(__name__)
CORS(app)

# Configure logging
logger = logging.getLogger(__name__)

@app.route("/ticket/verify/<ticket_id>", methods=["GET"])
def verify_ticket(ticket_id):
    """Check if a ticket is tradable based on multiple conditions."""
    
    ticket = fetch_ticket(ticket_id)
    if not ticket:
        return jsonify({"error": "Ticket not found", "tradable": False})

    # Ticket must be confirmed
    if ticket["status"] != "confirmed":
        return jsonify({"ticket_id": ticket_id, "tradable": False})

    event = fetch_event(ticket["eventID"])
    if not event:
        return jsonify({"error": "Event not found", "tradable": False})

    # Event date must be at least one day after today
    event_date = datetime.datetime.strptime(event["EventResponse"]["EventDate"], "%Y-%m-%d").date()
    if event_date <= datetime.date.today():
        return jsonify({"ticket_id": ticket_id, "tradable": False})

    seat = fetch_seat(ticket["seatID"])
    if not seat:
        return jsonify({"error": "Seat not found", "tradable": False})

    # Fetch seat details from Seat Atomic Service
    seat_response = requests.get(f"{SEAT_SERVICE_URL}/seat/validity/{ticket['seat_id']}/{seat['cat_no']}")
    
    if seat_response.status_code != 200:
        return jsonify({"error": "Seat verification failed", "tradable": False})

    seat_data = seat_response.json()
    
    # If seat is not valid, ticket is not tradable
    if not seat_data.get("valid", False):
        return jsonify({"ticket_id": ticket_id, "tradable": False})

    # If all conditions are met, ticket is tradable
    return jsonify({"ticket_id": ticket_id, "tradable": True})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)