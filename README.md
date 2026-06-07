# FinPilot AI - Agentic Personal Finance Assistant

FinPilot AI is a futuristic full-stack hackathon project that demonstrates an autonomous multi-agent finance system. It combines a React + Vite frontend, a FastAPI backend, MongoDB-ready persistence, upload parsing for CSV/PDF statements, and simulated AI agents for budgeting, subscriptions, savings, goals, and financial health scoring.

## Architecture

- Frontend: React, Vite, TailwindCSS, Framer Motion, Recharts, Zustand
- Backend: FastAPI, Python, MongoDB adapter, JWT auth
- AI Layer: Simulated multi-agent orchestration with optional OpenAI hooks
- Uploads: CSV and PDF statement ingestion

## Run Locally

### Backend

1. Create a virtual environment.
2. Install dependencies from `backend/requirements.txt`.
3. Set `backend/.env` from `backend/.env.example`.
4. Run `uvicorn app.main:app --reload` from the `backend` folder.

### Frontend

1. Install dependencies from `frontend/package.json`.
2. Set `frontend/.env` from `frontend/.env.example`.
3. Run `npm run dev` from the `frontend` folder.

## Demo Flow

- Open the landing page and scroll through the storytelling sections.
- Register or sign in.
- Upload a CSV or PDF bank statement.
- Review the autonomous insights, health score, bill predictions, subscriptions, and goal planning.

## Notes

- The backend supports MongoDB through `MONGO_URI` and can fall back to an in-memory store for demo mode.
- The AI recommendations are deterministic by default so the project works without external API keys.
- You can wire OpenAI or Gemini later through the service layer in `backend/app/services/agents.py`.
