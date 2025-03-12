/backend/atomic/ticket
│── app.py # Main entry point
│── config.py # Configuration settings (DB, RabbitMQ, etc.)
│── models.py # Ticket database schema
│── routes.py # Flask routes for ticket operations
│── services.py # Business logic for ticket creation, confirmation, etc.
│── producer.py # RabbitMQ producer (sending messages)
│── consumer.py # RabbitMQ consumer (listening for payment status updates)
│── db.py # Database connection (Supabase/PostgreSQL)
│── Dockerfile # For containerization
│── requirements.txt # Dependencies
│── tests/ # Unit tests
└── README.md # Documentation
