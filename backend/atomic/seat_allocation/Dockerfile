FROM python:3.12

# Set the working directory inside the container
WORKDIR /app

COPY requirements.txt .
# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Expose the application's port
EXPOSE 5000

# Set the command to run the app
CMD ["python", "main.py"]