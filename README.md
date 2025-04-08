# IS213 TicketMaster 2.0

## Project Overview

TicketMaster 2.0 is a microservices-based web application that supports the full lifecycle of ticket management, including:

- Ticket Purchasing
- Seat Allocation
- Payment Integration (via Stripe)
- Ticket Refund and Cancellation
- Trade Eligibility Checking
- Ticket Trading between Users

## Setup

### Prerequisites:

Before running the project, ensure you have:

- Node.js (v17 or above)
- Docker Desktop
- Two .env files — one for the frontend and another for the backend
- Github Setup `git clone https://github.com/kybae04/IS213-TicketMaster.git`
  - Or use Github Desktop

## Frontend Setup Instructions

1️⃣ Navigate to frontend folder

```bash
cd frontend
```

2️⃣ Add the `.env` file for frontend

3️⃣ Install dependencies

```bash
npm install
```

4️⃣ Run the frontend

```bash
npm start
```

## Backend Setup Instructions

1️⃣ Navigate to backend folder

```bash
cd backend
```

2️⃣ Add the `.env` file for backend

3️⃣ Build and run all backend services  
Make sure Docker is running first.

```bash
docker compose up --build
```

To stop all services

```bash
docker compose down
```

Important Note on RabbitMQ:
Our ticket trading logic relies on a local RabbitMQ queue, so trade requests are visible only on the same machine. If you open multiple browser tabs on the same device, it will work as expected. However, other devices will not see each other's trade requests since the queue is not externally hosted.

## Test Accounts

For your convenience, here are some ready-made test accounts you can use:

Email: user122@tm.com  
Email: user141@tm.com  
Email: user365@tm.com

Password (for all test accounts): password
