# IS213-TicketMaster
List functions

## Setup
### Prerequisites:
- Github Setup `git clone https://github.com/kybae04/IS213-TicketMaster.git`
    - Or use Github Desktop
 
## Folder Structure
IS213-TicketMaster/
│── backend/                  # Backend microservices
│   ├── atomic/               # Individual microservices
│   │   ├── payment/          # Payment processing
│   │   ├── seat_allocation/  # Seat management
│   │   ├── ticket/           # Ticket management
│   ├── composite/            # Composite services
│── frontend/                 # Frontend UI
│── README.md                 # Documentation

 ## Github Procedures
- Create a branch from `main` for yourself `git checkout -b your-branch-name`
- Keep commits clear and specific `git commit -m "commit-message"`
- Push your branch to Github `git push origin your-branch-name`
- Once done with task, send Pull Request (PR) to `main`. If no conflicts, merge into `main`. Else, resolve conflicts (please ask others if unsure)
