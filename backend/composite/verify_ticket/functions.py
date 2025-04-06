import requests
import logging

EVENT_SERVICE_URL = "https://personal-d3kdunmg.outsystemscloud.com/ESDProject/rest/EventAPI/events"
TICKET_SERVICE_URL = "http://ticket_service:5005"
SEAT_SERVICE_URL = "http://seatalloc_service:5000" 

def fetch_ticket(ticket_id):
    """Fetch ticket details from Ticket Atomic Service."""
    try:
        response = requests.get(f"{TICKET_SERVICE_URL}/ticket/{ticket_id}")
        if response.status_code == 200:
            return response.json()
        return None
    except requests.exceptions.RequestException as e:
        print(f"Error fetching ticket: {e}")
        return None

def fetch_event(event_id):
    """Fetch event details from the Event atomic microservice."""
    url = f"{EVENT_SERVICE_URL}/{event_id}"
    logging.info(f"Fetching event from: {url}")  # Log the request URL
    print(f"Fetching event from: {url}")  # Debug print

    try:
        response = requests.get(url)
        print(f"Response Status Code: {response.status_code}")
        print(f"Response Content: {response.text}")

        if response.status_code == 200:
            event_data = response.json()
            print("Event Data:", event_data)  # Debugging event data
            return event_data
        else:
            logging.error(f"Failed to fetch event. Status code: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error fetching event: {e}")
        return None

def fetch_seat(seat_id):
    """Fetch seat details from Seat Atomic Service."""
    try:
        print(f"Fetching seat details for seat_id: {seat_id}")
        
        # Sending the GET request to the Seat Atomic Service
        response = requests.get(f"{SEAT_SERVICE_URL}/seat/details/{seat_id}")
        
        # Log the status code and response
        print(f"Response Status Code: {response.status_code}")
        
        if response.status_code == 200:
            seat_data = response.json()
            print(f"Fetched seat data: {seat_data}")
            return seat_data
        else:
            print(f"Failed to fetch seat. Status Code: {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        # Log the error if the request fails
        print(f"Error fetching seat: {e}")
        return None