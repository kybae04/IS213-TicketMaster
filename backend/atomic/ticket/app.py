import logging
import threading
import sys
import os
from flask import Flask
from config import Config
from db import db

# Ensure current directory is in Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config) # Load configurations
    db.init_app(app) # Initialise the database
    SEAT_ALLOC_URL = app.config["SEAT_ALLOC_SERVICE_URL"]
    
    # Import routes after app is initialised
    from routes import register_routes
    register_routes(app)

    return app

app = create_app()

if __name__ == '__main__' and threading.current_thread() == threading.main_thread():
    try:
        with app.app_context(): 
            logger.info("Creating database tables...")
            db.create_all()
            logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {str(e)}")
    
    # Start the Flask application
    app.run(host="0.0.0.0", port=5005, debug=True, use_reloader=False)  # Disable reloader when using threads