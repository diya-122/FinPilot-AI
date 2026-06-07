<div align="center">

# FinPilot AI

### An autonomous multi-agent personal finance operating system

*Upload a bank statement. Watch 9 AI agents take over.*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0-orange?style=flat-square)](https://xgboost.readthedocs.io)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.5-F7931E?style=flat-square&logo=scikit-learn)](https://scikit-learn.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)

</div>

---

## What is FinPilot AI?

FinPilot AI is a full-stack agentic finance assistant that processes raw bank statements and runs them through a coordinated pipeline of 9 specialized AI agents. It doesn't just categorize your transactions — it scores your financial health using a trained XGBoost model, predicts your overspending risk, detects recurring subscriptions, forecasts upcoming bills, and surfaces personalized recommendations driven by real model outputs.

The entire system works locally with zero external API dependencies. No OpenAI key required.

---

## Architecture

```
Bank Statement (CSV / PDF)
        │
        ▼
┌─────────────────────────────────────────────────────┐
│              FinancialOrchestrator                  │
│                                                     │
│  1. TransactionExtractionAgent   (pandas + PyMuPDF) │
│  2. ExpenseCategorizationAgent   (TF-IDF + LogReg)  │  ← ML Model
│  3. SubscriptionDetectionAgent   (recurrence rules) │
│  4. BudgetMonitoringAgent        (MoM spike detect) │
│  5. BillPredictionAgent          (pattern matching) │
│  6. GoalPlanningAgent            (savings math)     │
│  7. FinancialHealthScoringAgent  (XGBRegressor)     │  ← ML Model
│  8. OverspendingRiskAgent        (XGBClassifier)    │  ← ML Model
│  9. RecommendationAgent          (model-driven)     │
│ 10. SmartChallengeAgent          (behavioral)       │
└─────────────────────────────────────────────────────┘
        │
        ▼
   FastAPI REST API  →  React Dashboard
```

---

## ML Models

Three trained models power the core intelligence layer:

| Model | Algorithm | Input Features | Output |
|-------|-----------|---------------|--------|
| **Expense Categorizer** | TF-IDF + Logistic Regression | Transaction description text | Category + confidence score |
| **Financial Health Predictor** | XGBoost Regressor | Income, expenses, savings rate, subscription count, category percentages | Health score 0–100 |
| **Overspending Risk Predictor** | XGBoost Classifier | Monthly budget, current spend, day of month, category totals, subscription count | Risk % + label (Low / Medium / High) |

All models fall back to rule-based logic gracefully if not loaded — the app always stays runnable.

---

## Tech Stack

### Backend
- **FastAPI** + **Uvicorn** — async REST API
- **XGBoost** + **scikit-learn** — trained ML models
- **pandas** + **PyMuPDF** — CSV and PDF statement parsing
- **python-jose** + **bcrypt** — JWT auth and password hashing
- **JSON file store** — persistent data that survives server restarts (MongoDB-ready via motor)

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **TailwindCSS** — utility-first styling
- **Framer Motion** — spring animations throughout
- **Recharts** — area charts, bar charts, pie charts, radar chart
- **Zustand** — global state management
- **Lucide React** — icon system

---

## Features

### Dashboard
- **5-metric stat bar** — total spend, savings, health score, subscription cost, overspending risk gauge
- **Circular SVG risk gauge** — animated arc that turns green → amber → red as risk increases
- **Spending categories** — donut chart with legend and ₹ tooltip
- **Monthly trend** — area chart across last 6 months
- **Spending heatmap** — daily intensity bar chart
- **AI Insights panel** — live feed of model-generated alerts and recommendations

### Health Score Breakdown
- **Radar/spider chart** — 5-dimensional visualization of the XGBoost model output
- **Horizontal bar breakdown** — savings ratio, subscription burden, spending discipline, emergency reserve, budget adherence — each with animated fill
- **AI summary** — one-line model interpretation

### Goal Tracker
- Create goals with name, target amount, current savings, monthly target
- Goal Planning Agent computes progress % and ETA automatically
- Animated progress bars on mount
- Inline edit and delete per goal
- Goals persist across uploads and server restarts

### Financial History Tab
- Per-month breakdown: income, expenses, savings, health score
- Category deep-dive per month (food, shopping, bills, transport, education, health, investments)
- Sortable by month, income, expenses, savings, score
- Searchable by keyword
- Expandable rows with full insights, subscriptions, and trend

### Upload System
- Drag or select CSV / PDF bank statements
- Toast notification on completion: "Analyzed 60 transactions across 2 months · All 9 agents executed"
- Empty state CTA with agent badges when no data has been uploaded yet

### Auth
- Register / sign in with email + password
- JWT sessions persisted to localStorage
- Accounts and data survive backend restarts

---

## Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy and configure env
copy .env.example .env

# Start the server
uvicorn app.main:app --reload
```

The API will be at `http://127.0.0.1:8000`. Swagger docs at `http://127.0.0.1:8000/docs`.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy env
copy .env.example .env

# Start dev server
npm run dev
```

The app will be at `http://localhost:5173`.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Sign in, receive JWT |
| `GET` | `/api/dashboard/overview` | Full dashboard data |
| `POST` | `/api/transactions/upload` | Upload CSV/PDF, run agent pipeline |
| `GET` | `/api/transactions` | List stored transactions |
| `POST` | `/api/goals` | Create a goal |
| `PATCH` | `/api/goals/{id}` | Edit a goal |
| `DELETE` | `/api/goals/{id}` | Delete a goal |
| `GET` | `/api/health` | Health check |

---

## Sample Data

Three synthetic CSV files are included for testing:

| File | Profile | Monthly Income | What it demonstrates |
|------|---------|---------------|---------------------|
| `synthetic_transactions.csv` | Working professional | ₹55,000 | Balanced spend, two months of data |
| `synthetic_student.csv` | College student | ₹18,000 + ₹8,000 stipend | Low income, food-heavy, education spend |
| `synthetic_highspend.csv` | High earner | ₹1,20,000 + bonus | Heavy subscriptions, triggers High risk |

---

## Project Structure

```
agenticWeb/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/         # auth, dashboard, goals, transactions
│   │   ├── core/
│   │   │   ├── config.py       # pydantic-settings
│   │   │   ├── security.py     # JWT + bcrypt
│   │   │   └── store.py        # persistent JSON store
│   │   ├── ml/
│   │   │   ├── inference.py    # model loading + inference classes
│   │   │   ├── train_models.py # training script
│   │   │   └── models/         # .pkl files
│   │   ├── services/
│   │   │   └── agents.py       # all 10 agents + orchestrator
│   │   ├── schemas.py          # pydantic models
│   │   └── main.py
│   ├── requirements.txt
│   └── synthetic_*.csv
│
└── frontend/
    └── src/
        ├── App.tsx             # entire UI (single-file SPA)
        ├── store/
        │   └── useAppStore.ts  # zustand global state
        ├── lib/
        │   └── api.ts          # fetch wrappers for all endpoints
        └── types.ts            # TypeScript type definitions
```

---

## Configuration

Copy `backend/.env.example` to `backend/.env`:

```env
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:5173
USE_MOCK_DB=true
```

`USE_MOCK_DB=true` uses the local JSON file store. Set `MONGO_URI` and `USE_MOCK_DB=false` to switch to MongoDB.

---

<div align="center">

Built for a hackathon. Designed to feel like a product.

</div>
