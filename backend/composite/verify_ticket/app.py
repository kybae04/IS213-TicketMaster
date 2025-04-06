import datetime
import requests
from flask import Flask, jsonify
from flask_cors import CORS
from functions import fetch_ticket, fetch_event, fetch_seat

app = Flask(__name__)
CORS(app)

EVENT_SERVICE_URL = "https://personal-d3kdunmg.outsystemscloud.com/ESDProject/rest/EventAPI/events"
TICKET_SERVICE_URL = "http://ticket_service:5005"
SEAT_SERVICE_URL = "http://seatalloc_service:5000" 

@app.route("/verify-ticket/<ticket_id>", methods=["GET"])
def verify_ticket(ticket_id):
    """Check if a ticket is tradable based on multiple conditions."""
    try:
        # Fetch ticket details
        ticket = fetch_ticket(ticket_id)
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404
        
        # Fetch event details
        event = fetch_event(ticket["eventID"])
        if not event:
            return jsonify({"error": "Event not found", "tradable": False}), 404
        
        # Fetch seat details
        seat = fetch_seat(ticket["seatID"])
        if not seat:
            return jsonify({"error": "Seat not found", "tradable": False}), 404


        ### CRITERIA 1: Ticket must be confirmed ###

        if ticket["status"] != "confirmed":
            return jsonify({"ticket_id": ticket_id, "tradable": False, "reason": "Ticket is not confirmed"})
        
        ### END OF CRITERIA 1 ###


        ### CRITERIA 2: Event date must be at least one day after today ###

        # event_date = datetime.datetime.strptime(event["EventResponse"]["EventDate"], "%Y-%m-%d").date()
        # if event_date <= datetime.date.today():
        #     return jsonify({"ticket_id": ticket_id, "tradable": False})

        event_date = event["EventResponse"]["EventDate"]  # e.g. "2025-04-08"
        event_time = event["EventResponse"]["EventTime"]  # e.g. "18:00:00"

        event_datetime = datetime.datetime.strptime(f"{event_date} {event_time}", "%Y-%m-%d %H:%M:%S")

        # Get current datetime
        now = datetime.datetime.now()

        # Check if the event is at least 48 hours from now
        if event_datetime <= now + datetime.timedelta(hours=48):
            return jsonify({"ticket_id": ticket_id, "tradable": False, "reason": "Event is less than 48 hours away"})
        
        ### END OF CRITERIA 2 ###


        ### CRITERIA 3: If seat is not valid, ticket is not tradable (Logic from Seat Atomic Service) ###

        # Fetch seat validity from Seat Atomic Service
        seat_response = requests.get(f"{SEAT_SERVICE_URL}/seat/validity/{ticket['seatID']}/{seat['cat_no']}")
        
        if seat_response.status_code != 200:
            return jsonify({"error": "Seat verification failed", "tradable": False}), 404

        seat_data = seat_response.json()
        
        # If seat is not valid, ticket is not tradable
        if not seat_data.get("valid", False):
            return jsonify({"ticket_id": ticket_id, "tradable": False, "reason": "Seat is not valid for trade"})
        
        ### END OF CRITERIA 3 ###


        # If all conditions are met, ticket is tradable
        return jsonify({"ticket_id": ticket_id, "tradable": True})

    except Exception as e:
        return jsonify({"error": f"Failed to verify ticket: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6002, debug=True)