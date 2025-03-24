FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app code
COPY . .

# Expose the Flask port (matches app.py → port 8002)
EXPOSE 6001

# Start the Flask app
CMD ["python", "routes.py"]