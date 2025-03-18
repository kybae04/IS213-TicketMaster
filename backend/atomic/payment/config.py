# config.py
import os

from dotenv import load_dotenv

# load_dotenv(dotenv_path='backend/atomic/payment/.env') # This loads variables from a .env file into os.environ
load_dotenv()

class Config:
    # Stripe configuration: Replace with your test key or set via environment variables
    STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_your_test_key_here')
    STRIPE_API_VERSION = '2020-08-27'

    # database config
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_ECHO = True
    SQLALCHEMY_TRACK_MODIFICATIONS = False
