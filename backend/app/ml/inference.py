"""
FinPilot AI — ML Inference Layer

Loads the three trained models and exposes clean inference classes.
Falls back to rule-based logic gracefully if models can't be loaded.

Model files expected in app/ml/models/:
  - expense_classifier.pkl         → Pipeline(TfidfVectorizer, LogisticRegression)
  - financial_health_model.pkl     → XGBRegressor
  - overspending_model.pkl         → XGBClassifier
"""

from __future__ import annotations

import warnings
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any

import joblib

warnings.filterwarnings("ignore", category=UserWarning)

MODELS_DIR = Path(__file__).parent / "models"

# ── lazy model cache ───────────────────────────────────────────────────────────
_cache: dict[str, Any] = {}


def _load(name: str) -> Any | None:
    if name in _cache:
        return _cache[name]
    path = MODELS_DIR / name
    if not path.exists():
        return None
    try:
        model = joblib.load(path)
        _cache[name] = model
        return model
    except Exception:
        return None


# ══════════════════════════════════════════════════════════════════════════════
# 1. Expense Categorization
#    Model: Pipeline(tfidf → LogisticRegression)
#    Input: transaction description string
#    Output: category label + confidence
#    Classes: Bills, Education, Entertainment, Food, Healthcare, Shopping, Transport
# ══════════════════════════════════════════════════════════════════════════════

# Keyword fallback (used if model not loaded)
_KEYWORD_FALLBACK: dict[str, list[str]] = {
    "Food": ["swiggy", "zomato", "restaurant", "cafe", "food", "eat", "delivery", "pizza", "burger", "kfc", "mcdonalds", "starbucks"],
    "Shopping": ["amazon", "flipkart", "myntra", "shopping", "mall", "store", "ajio", "nykaa", "meesho"],
    "Entertainment": ["netflix", "spotify", "prime", "disney", "movie", "theatre", "steam", "hotstar", "zee5", "gaming"],
    "Bills": ["electric", "electricity", "water", "gas", "bill", "rent", "mobile", "internet", "broadband", "dth", "insurance", "emi"],
    "Education": ["course", "udemy", "coursera", "school", "college", "education", "book", "byjus", "unacademy"],
    "Healthcare": ["hospital", "clinic", "pharmacy", "medicine", "health", "doctor", "gym", "cult", "fitness", "diagnostic"],
    "Transport": ["uber", "ola", "metro", "fuel", "petrol", "transport", "cab", "rapido", "flight", "train", "bus", "toll"],
}

# Map model's "Healthcare" label to internal "Health" used elsewhere in the app
_LABEL_MAP = {"Healthcare": "Health"}


def _keyword_categorize(merchant: str) -> tuple[str, float]:
    merchant_lower = merchant.lower()
    for category, keywords in _KEYWORD_FALLBACK.items():
        if any(kw in merchant_lower for kw in keywords):
            return _LABEL_MAP.get(category, category), 0.82
    return "Shopping", 0.45


class ExpenseCategorizationInference:
    """TF-IDF + Logistic Regression expense categorizer."""

    def predict(self, merchant: str, amount: float) -> tuple[str, float]:
        model = _load("expense_classifier.pkl")
        if model is None:
            return _keyword_categorize(merchant)
        try:
            label: str = model.predict([merchant])[0]
            proba = model.predict_proba([merchant])[0]
            confidence = float(max(proba))
            return _LABEL_MAP.get(label, label), round(confidence, 4)
        except Exception:
            return _keyword_categorize(merchant)

    def predict_batch(self, transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Enrich a list of transaction dicts in-place with category + confidence."""
        model = _load("expense_classifier.pkl")
        if model is None:
            for txn in transactions:
                cat, conf = _keyword_categorize(txn.get("merchant", ""))
                txn["category"] = cat
                txn["confidence"] = conf
            return transactions
        try:
            texts = [txn.get("merchant", "") for txn in transactions]
            labels = model.predict(texts)
            probas = model.predict_proba(texts)
            for txn, label, proba in zip(transactions, labels, probas):
                txn["category"] = _LABEL_MAP.get(label, label)
                txn["confidence"] = round(float(max(proba)), 4)
        except Exception:
            for txn in transactions:
                cat, conf = _keyword_categorize(txn.get("merchant", ""))
                txn["category"] = cat
                txn["confidence"] = conf
        return transactions


# ══════════════════════════════════════════════════════════════════════════════
# 2. Financial Health Score
#    Model: XGBRegressor
#    Features: income, expenses, savings_rate, subscriptions,
#              food_percent, shopping_percent, bills_percent
#    Output: health score 0–100
# ══════════════════════════════════════════════════════════════════════════════

class HealthScoreInference:
    """XGBoost financial health score predictor (0–100)."""

    def predict(
        self,
        transactions: list[dict[str, Any]],
        subscriptions: list[dict[str, Any]],
    ) -> dict[str, Any]:
        import pandas as pd

        income = sum(abs(t["amount"]) for t in transactions if t.get("type") == "credit")
        expenses = sum(abs(t["amount"]) for t in transactions if t.get("type", "debit") == "debit")

        cat_totals: dict[str, float] = defaultdict(float)
        for t in transactions:
            if t.get("type", "debit") == "debit":
                cat_totals[t.get("category", "Shopping")] += abs(t["amount"])

        total_exp = max(expenses, 1.0)
        savings_rate = max(income - expenses, 0.0) / max(income, 1.0)
        subscription_count = len(subscriptions)
        food_pct = cat_totals.get("Food", 0) / total_exp * 100
        shopping_pct = cat_totals.get("Shopping", 0) / total_exp * 100
        bills_pct = cat_totals.get("Bills", 0) / total_exp * 100

        model = _load("financial_health_model.pkl")
        if model is None:
            # fallback formula
            score = int(min(100, max(0,
                savings_rate * 60
                + max(0, 20 - subscription_count * 2)
                + max(0, 10 - max(0, (expenses / max(income, 1)) * 100 - 60) * 0.25)
            )))
        else:
            try:
                features = pd.DataFrame([{
                    "income": income,
                    "expenses": expenses,
                    "savings_rate": savings_rate,
                    "subscriptions": subscription_count,
                    "food_percent": food_pct,
                    "shopping_percent": shopping_pct,
                    "bills_percent": bills_pct,
                }])
                raw = float(model.predict(features)[0])
                score = max(0, min(100, int(round(raw))))
            except Exception:
                score = int(min(100, max(0, savings_rate * 60 + max(0, 20 - subscription_count * 2))))

        breakdown = {
            "savings_ratio": round(savings_rate * 35, 1),
            "subscription_burden": round(max(0.0, 20 - subscription_count * 2), 1),
            "spending_discipline": round(max(0.0, 25 - food_pct * 0.3), 1),
            "emergency_reserve": 10.0 if expenses < 15000 else 6.0,
            "budget_adherence": round(max(0.0, 20 - max(0, (expenses / max(income, 1)) * 100 - 60) * 0.5), 1),
        }

        if score >= 70:
            summary = "Healthy trajectory with room to reduce subscriptions and improve savings consistency."
        elif score >= 55:
            summary = "You're on a moderate path. Focus on savings consistency and trimming discretionary spend."
        else:
            summary = "Your finances need attention — overspending and subscription load are dragging down resilience."

        return {"score": score, "breakdown": breakdown, "summary": summary}


# ══════════════════════════════════════════════════════════════════════════════
# 3. Overspending Risk Predictor
#    Model: XGBClassifier
#    Features: monthly_budget, current_spending, day_of_month,
#              food_spending, shopping_spending, subscriptions
#    Output: risk probability → percentage + label
# ══════════════════════════════════════════════════════════════════════════════

class OverspendingRiskInference:
    """XGBoost overspending risk predictor."""

    def predict(
        self,
        transactions: list[dict[str, Any]],
        subscriptions: list[dict[str, Any]],
        historical_transactions: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        import pandas as pd

        income = sum(abs(t["amount"]) for t in transactions if t.get("type") == "credit")
        current_spending = sum(abs(t["amount"]) for t in transactions if t.get("type", "debit") == "debit")

        cat_totals: dict[str, float] = defaultdict(float)
        for t in transactions:
            if t.get("type", "debit") == "debit":
                cat_totals[t.get("category", "Shopping")] += abs(t["amount"])

        today = date.today()
        day_of_month = today.day
        subscription_count = len(subscriptions)

        # monthly_budget: use income if available, else estimate from historical or current
        monthly_budget = income if income > 0 else (
            sum(abs(t["amount"]) for t in (historical_transactions or []) if t.get("type") == "credit")
            or current_spending * 1.2
        )

        spend_vs_income = current_spending / max(monthly_budget, 1)
        projected_monthly = (current_spending / max(day_of_month, 1)) * 30

        model = _load("overspending_model.pkl")
        if model is None:
            risk_pct = min(100, int(round(spend_vs_income * 100)))
            risk_label = "High" if risk_pct > 80 else "Medium" if risk_pct > 50 else "Low"
        else:
            try:
                features = pd.DataFrame([{
                    "monthly_budget": monthly_budget,
                    "current_spending": current_spending,
                    "day_of_month": day_of_month,
                    "food_spending": cat_totals.get("Food", 0),
                    "shopping_spending": cat_totals.get("Shopping", 0),
                    "subscriptions": subscription_count,
                }])
                proba = model.predict_proba(features)[0]
                risk_pct = int(round(float(proba[1]) * 100))
                risk_label = "High" if risk_pct > 70 else "Medium" if risk_pct > 40 else "Low"
            except Exception:
                risk_pct = min(100, int(round(spend_vs_income * 100)))
                risk_label = "High" if risk_pct > 80 else "Medium" if risk_pct > 50 else "Low"

        return {
            "risk_percentage": risk_pct,
            "risk_label": risk_label,
            "spend_vs_income_pct": round(spend_vs_income * 100, 1),
            "projected_monthly_spend": round(projected_monthly, 2),
        }


# ── singleton instances ────────────────────────────────────────────────────────
categorizer = ExpenseCategorizationInference()
health_scorer = HealthScoreInference()
overspending_predictor = OverspendingRiskInference()
