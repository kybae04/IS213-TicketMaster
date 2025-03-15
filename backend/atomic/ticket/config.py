import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TRADE_TICKET_SERVICE_URL = os.getenv("TRADE_TICKET_SERVICE_URL", "http://trade-ticket-service")