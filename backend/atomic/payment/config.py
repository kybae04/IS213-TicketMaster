# config.py
import os

from dotenv import load_dotenv

load_dotenv(dotenv_path='backend/.env')  # This loads variables from a .env file into os.environ

class Config:
    # Stripe configuration: Replace with your test key or set via environment variables
    STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_your_test_key_here')
    STRIPE_API_VERSION = '2020-08-27'

    # You can add additional configuration variables here (e.g., database settings)
