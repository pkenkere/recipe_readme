# Recipe README Pantry App

This workspace contains a simple pantry inventory service with:
- a Python FastAPI backend
- a React frontend

## Project structure

- `backend/` - Python API for pantry inventory
- `frontend/` - React app for inventory management

## Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend setup

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

The frontend expects the backend at `http://localhost:8000`.
