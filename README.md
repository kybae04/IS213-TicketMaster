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

## How to Set Up Ticket Microservice
1️⃣ Navigate to the Ticket Microservice Directory
```bash
cd backend/atomic/ticket
```

2️⃣ Install all required dependencies:
```bash
pip install -r requirements.txt
```

3️⃣Set Up Environment Variables  
Create a `.env` file and add the following environment variable:
```bash
DATABASE_URL=postgresql://<your-database-url>
```
- Replace `<your-database-url>` with the actual database connection string.
- Ensure this file is not committed to GitHub (it is listed in .gitignore).

4️⃣ Start the microservice:
```bash
python app.py
```
