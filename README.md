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

2️⃣ Create a `.env` file inside the backend folder. Paste the following into your `.env` file and fill in the values.

```bash
# Ticket Microservice DB
TICKET_DB_URL=postgresql://<user>:<pass>@<host>:<port>/<db_name>

# Seat Allocation Microservice (Supabase example)
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_KEY=<your-secret-key>

# Payment Microservice DB
PAYMENT_DB_URL=postgresql://<user>:<pass>@<host>:<port>/<db_name>
```

- Ensure this file is not committed to GitHub (it is listed in .gitignore).

🔁 Note:
If your microservice was previously loading a local `.env` file (inside its own folder),
you may need to update the `config.py` file inside that microservice to load the shared env file from the `backend/` folder.
EXAMPLE:

```bash
from dotenv import load_dotenv
from pathlib import Path

# Go up two levels from /atomic/<service>/config.py to reach /backend/.env
dotenv_path = Path(__file__).resolve().parents[2] / '.env'
load_dotenv(dotenv_path)
```

3️⃣ Build and run all backend services
Make sure Docker is running.

```bash
docker compose up --build
```
