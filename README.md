# IS213-TicketMaster

List functions

## Setup

### Prerequisites:

- Github Setup `git clone https://github.com/kybae04/IS213-TicketMaster.git`
  - Or use Github Desktop

### Github Procedures

- Create a branch from `main` for yourself `git checkout -b your-branch-name`
- Keep commits clear and specific `git commit -m "commit-message"`
- Push your branch to Github `git push origin your-branch-name`
- Once done with task, send Pull Request (PR) to `main`. If no conflicts, merge into `main`. Else, resolve conflicts (please ask others if unsure)

## Backend Setup Instructions

1️⃣ Navigate to backend folder

```bash
cd backend
```

2️⃣ Create a `.env` file inside the backend folder. Paste the following into your `.env` file and fill in the values. (or refer to the copy sent in our ESD chat)

```bash
# Ticket Microservice DB
TICKET_DB_URL=postgresql://<user>:<pass>@<host>:<port>/<db_name>

# Seat Allocation Microservice (Supabase example)
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_KEY=<your-secret-key>

# Payment Microservice DB
PAYMENT_DB_URL=postgresql://<user>:<pass>@<host>:<port>/<db_name>
STRIPE_SECRET_KEY=
```

- Ensure this file is not committed to GitHub (it is listed in .gitignore).

3️⃣ Build and run all backend services  
Make sure Docker is running first.

```bash
docker compose up --build
```

## 🧭 API Gateway (Kong)

Kong is set up as our API Gateway, exposing all microservice endpoints under a single gateway at:

```bash
http://localhost:8000
```

You can view and manage Kong services/routes via the Kong Manager GUI:

```bash
http://localhost:8202
```

🚀 Please refer to the [Google Sheets](https://docs.google.com/spreadsheets/d/14c1HN3iYUs-AQFFWOx4uZSJtxk_BLn3yysNoMiGVnwI/edit?usp=sharing) for available gateway routes

To stop all services

```bash
docker compose down
```

‼️DO NOT run `docker compose down --volumes` (please don't delete all my Kong 🦍)
