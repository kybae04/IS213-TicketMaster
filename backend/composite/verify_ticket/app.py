import datetime
import requests
from flask import Flask, jsonify
from flask_cors import CORS
from services import fetch_ticket, fetch_event, fetch_seat
from atomic import TICKET_SERVICE_URL, EVENT_SERVICE_URL, SEAT_SERVICE_URL

app = Flask(__name__)
CORS(app)

@app.route("/ticket/verify/<ticket_id>", methods=["GET"])
def verify_ticket(ticket_id):
    """Check if a ticket is tradable based on multiple conditions."""
    
    ticket = fetch_ticket(ticket_id)
    if not ticket:
        return jsonify({"error": "Ticket not found", "tradable": False})
    
    event = fetch_event(ticket["eventID"])
    if not event:
        return jsonify({"error": "Event not found", "tradable": False})
    
    seat = fetch_seat(ticket["seatID"])
    if not seat:
        return jsonify({"error": "Seat not found", "tradable": False})


    ### CRITERIA 1: Ticket must be confirmed ###

    if ticket["status"] != "confirmed":
        return jsonify({"ticket_id": ticket_id, "tradable": False})
    
    ### END OF CRITERIA 1 ###


    ### CRITERIA 2: Event date must be at least one day after today ###

    event_date = datetime.datetime.strptime(event["EventResponse"]["EventDate"], "%Y-%m-%d").date()
    if event_date <= datetime.date.today():
        return jsonify({"ticket_id": ticket_id, "tradable": False})
    
    ### END OF CRITERIA 2 ###


    ### CRITERIA 3: If seat is not valid, ticket is not tradable (Logic from Seat Atomic Service) ###

    # Fetch seat validity from Seat Atomic Service
    seat_response = requests.get(f"{SEAT_SERVICE_URL}/seat/validity/{ticket['seatID']}/{seat['cat_no']}")
    
    if seat_response.status_code != 200:
        return jsonify({"error": "Seat verification failed", "tradable": False})

    seat_data = seat_response.json()
    
    # If seat is not valid, ticket is not tradable
    if not seat_data.get("valid", False):
        return jsonify({"ticket_id": ticket_id, "tradable": False})
    
    ### END OF CRITERIA 3 ###


    # If all conditions are met, ticket is tradable
    return jsonify({"ticket_id": ticket_id, "tradable": True})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6002, debug=True)