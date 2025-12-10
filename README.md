# Dashboard Individuel de Suivi TRE

A full-stack application for tracking job applications, recruiter interactions, and LinkedIn activities.

## Features

- **Dashboard**: Overview of KPIs, performance trends, and recent activity.
- **Job Offers**: Track job offers, status, and application dates.
- **Recruiters**: Manage recruiter connections and messages.
- **LinkedIn Activities**: Log daily LinkedIn interactions (comments, posts).
- **Applications**: Track job applications and follow-ups.
- **PDF Export**: Generate individual performance reports.
- **Authentication**: Secure login for users.

## Tech Stack

- **Backend**: FastAPI (Python), SQLite, SQLAlchemy, Pydantic.
- **Frontend**: Next.js (React), TypeScript, CSS Modules (Vanilla-like), Recharts.
- **Tools**: Pandas (Excel Import), ReportLab (PDF Generation).

## Setup

### Prerequisites

- Python 3.8+
- Node.js 16+

### Backend

1. Navigate to the project root.
2. Create a virtual environment:
   ```bash
   python -m venv backend/venv
   ```
3. Activate the virtual environment:
   - Windows: `backend\venv\Scripts\activate`
   - Linux/Mac: `source backend/venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy pydantic python-multipart python-jose[cryptography] passlib[bcrypt] python-dotenv pandas openpyxl reportlab pytest httpx
   ```
5. Import data from Excel (optional, if you have the file):
   ```bash
   python -m backend.import_data
   ```
6. Run the server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```

### Frontend

1. Navigate to `frontend_app`:
   ```bash
   cd frontend_app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- **Login**: Use `admin@example.com` / `password` (created by import script).
- **Dashboard**: View stats and charts.
- **Export**: Click "Export PDF" on the dashboard to download a report.
