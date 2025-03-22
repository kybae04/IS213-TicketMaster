import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
dotenv_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path)

print("DATABASE_URL:", os.getenv("DATABASE_URL"))

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TRADE_TICKET_SERVICE_URL = os.getenv("TRADE_TICKET_SERVICE_URL", "http://trade-ticket-service")