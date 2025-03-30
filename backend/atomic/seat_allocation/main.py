from flask_cors import CORS
from flask import Flask, request, jsonify
from supabase import create_client
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv, find_dotenv

# Initialize Flask App
app = Flask(__name__)
CORS(app)
# Supabase Configuration
load_dotenv(find_dotenv())
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print(f"SUPABASE_URL: {SUPABASE_URL}")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


@app.route("/")
def sayhello():
    return "Hello from seat allocation",200

###Get Available seats from an event
@app.route("/availability/<event_id>", methods=["GET"])
def get_seat_availability(event_id):
    response = supabase.table("seat_allocation").select("*").eq("eventid", event_id).eq("status", "available").execute()
    available_seats = response.data
    return jsonify({"available_seats": available_seats}), 200


### Reserve a Seat
@app.route("/reserve/<seat_id>", methods=["POST"])
def reserve_seat(seat_id):

    response = supabase.table("seat_allocation").select("*").eq("seatid", seat_id).execute()
    
    if not response.data:
        return jsonify({"error": "Seat not found"}), 404
    
    seat = response.data[0]

    if seat["status"] != "available":
        return jsonify({"error": "Seat already reserved"}), 409

    update_response = supabase.table("seat_allocation").update({
        "status": "reserved",
    }).eq("seatid", seat_id).execute()

    if update_response.data:
        reservation_response = {
            "message": "Seat reserved successfully",
            "seatid": seat_id
            }.execute()


        return jsonify(reservation_response), 200
    else:
        return jsonify({"error": "Reservation failed"}), 500

# Confirm seat change status from reserved to confirmed
@app.route("/confirm/<seat_id>", methods=["PUT"])
def confirm_seat(seat_id):
    response = supabase.table("seat_allocation").select("*").eq("seatid", seat_id).execute()
    
    if not response.data:
        return jsonify({"error": "Seat not found"}), 404
    
    seat = response.data[0]
    
    if seat["status"] != "reserved":
        return jsonify({"error": "Seat is not reserved"}), 409


    update_response = supabase.table("seat_allocation").update({
        "status": "confirmed"
    }).eq("seatid", seat_id).execute()
    
    return jsonify({"message": "Seat confirmed"}), 200


# change seat status to available
@app.route("/release/<seat_id>", methods=["PUT"])
def release_seat(seat_id):
    response = supabase.table("seat_allocation").select("*").eq("seatid", seat_id).execute()
    
    if not response.data:
        return jsonify({"error": "Seat not found"}), 404

    seat = response.data[0]

    if seat["status"] not in ["reserved","confirmed"]:
        return jsonify({"error": "Seat is not reserved"}), 409

    update_response = supabase.table("seat_allocation").update({
        "status": "available"
    }).eq("seatid", seat_id).execute()

    return jsonify({"message": "Seat released successfully"}), 200
# verify seat
@app.route("/seat/validity/<seat_id>/<cat_no>", methods=["GET"])
def verify_seat(seat_id, cat_no):
    response = supabase.table("seat_allocation").select("*").eq("seatid", seat_id).execute()
    
    if not response.data:
        return jsonify({"error": "Seat not found"}), 404

    seat = response.data[0]

    if str(seat["cat_no"]) == str(cat_no):
        return jsonify({"valid": True}), 200
    else:
        return jsonify({"valid": False}), 200

# Get seat details by seat_id
@app.route("/seat/details/<seat_id>", methods=["GET"])
def get_seat_details(seat_id):
    response = supabase.table("seat_allocation").select("*").eq("seatid", seat_id).execute()
    
    if not response.data:
        return jsonify({"error": "Seat not found"}), 404

    seat = response.data[0]
    return jsonify(seat), 200
   
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)