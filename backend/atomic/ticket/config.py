import os
from dotenv import load_dotenv, find_dotenv

# Load environment variables from .env file
load_dotenv(find_dotenv())

print("DATABASE_URL:", os.getenv("TICKET_DB_URL"))

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("TICKET_DB_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SEAT_ALLOC_SERVICE_URL = os.getenv("SEAT_ALLOC_SERVICE_URL", "http://seatalloc_service:5000")
    TRADE_TICKET_SERVICE_URL = os.getenv("TRADE_TICKET_SERVICE_URL", "http://trade-ticket-service")