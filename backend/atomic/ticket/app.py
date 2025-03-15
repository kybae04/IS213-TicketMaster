import logging
import threading
import sys
from flask import Flask
from config import Config
from db import db

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config.from_object(Config) # Load configurations

db.init_app(app) # Initialize the database

# Import routes after app is initialised
import routes

if __name__ == '__main__' and threading.current_thread() == threading.main_thread():
    try:
        with app.app_context(): 
            logger.info("Creating database tables...")
            db.create_all()
            logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {str(e)}")
    
    # Start the Flask application
    app.run(debug=True, use_reloader=False)  # Disable reloader when using threads