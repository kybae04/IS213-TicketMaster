import requests
from atomic import TICKET_SERVICE_URL, EVENT_SERVICE_URL, SEAT_SERVICE_URL
import logging

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

# def fetch_event(event_id):
#     """Fetch event details from Event Atomic Service."""
#     try:
#         response = requests.get(f"{EVENT_SERVICE_URL}/{event_id}")
#         if response.status_code == 200:
#             return response.json()
#         return None
#     except requests.exceptions.RequestException as e:
#         print(f"Error fetching event: {e}")
#         return None
    

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
        response = requests.get(f"{SEAT_SERVICE_URL}/seat/{seat_id}")
        if response.status_code == 200:
            return response.json()
        return None
    except requests.exceptions.RequestException as e:
        print(f"Error fetching seat: {e}")
        return None