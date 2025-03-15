FROM python:3.12

# Set the working directory inside the container
WORKDIR /app

# Copy application files
COPY . .

COPY .env .env

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the application's port
EXPOSE 5000

# Set the command to run the app
CMD ["python", "main.py"]