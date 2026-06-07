from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass, field
from calendar import month_name
from datetime import date, datetime, timedelta
from io import BytesIO
from typing import Any
from uuid import uuid4

import numpy as np
import pandas as pd

try:
    import fitz  # PyMuPDF
except Exception:  # pragma: no cover - optional dependency
    fitz = None

# ML inference layer — falls back gracefully if models not trained yet
from app.ml.inference import categorizer as ml_categorizer
from app.ml.inference import health_scorer as ml_health_scorer
from app.ml.inference import overspending_predictor as ml_overspending_predictor


@dataclass
class TransactionExtractionAgent:
    def extract(self, file_name: str, file_bytes: bytes) -> list[dict[str, Any]]:
        suffix = file_name.lower().split(".")[-1]
        if suffix == "csv":
            return self._extract_csv(file_bytes)
        if suffix == "pdf":
            return self._extract_pdf(file_bytes)
        raise ValueError("Unsupported file type. Upload a CSV or PDF statement.")

    def _extract_csv(self, file_bytes: bytes) -> list[dict[str, Any]]:
        raw_text = file_bytes.decode("utf-8", errors="ignore")

        try:
            structured = pd.read_csv(BytesIO(file_bytes))
        except Exception:
            structured = pd.DataFrame()

        parsed = self._parse_structured_csv(structured)
        if parsed:
            return parsed

        fallback_rows = self._parse_loose_rows(raw_text)
        if fallback_rows:
            return fallback_rows

        raise ValueError("Could not read this CSV format. Please export it as rows with labels and amounts, or upload a PDF statement.")

    def _parse_structured_csv(self, frame: pd.DataFrame) -> list[dict[str, Any]]:
        if frame.empty:
            return []

        normalized_columns = {str(column).strip().lower(): column for column in frame.columns}
        date_column = next((normalized_columns[key] for key in normalized_columns if "date" in key), None)
        merchant_column = next((normalized_columns[key] for key in normalized_columns if any(token in key for token in ["merchant", "description", "narration", "particular", "details", "item", "name"])), None)
        amount_column = next((normalized_columns[key] for key in normalized_columns if any(token in key for token in ["amount", "debit", "credit", "value", "total", "cost", "spend", "expense"])), None)

        rows: list[dict[str, Any]] = []
        for _, row in frame.iterrows():
            merchant_value = self._pick_text_value(row, merchant_column)
            amount_value = self._pick_amount_value(row, amount_column)
            if merchant_value is None or amount_value is None:
                continue

            date_value = self._pick_date_value(row, date_column)
            rows.append({
                "date": date_value,
                "merchant": merchant_value,
                "amount": amount_value,
                "type": self._infer_transaction_type(merchant_value, amount_value),
                "category": "Uncategorized",
                "source": "upload",
            })
        return rows

    def _parse_loose_rows(self, raw_text: str) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        for line in lines:
            tokens = self._split_csv_like_line(line)
            if not tokens:
                continue

            date_value = None
            amount_value = None
            text_parts: list[str] = []

            for token in tokens:
                token_amount = self._coerce_amount(token)
                if token_amount is not None and amount_value is None:
                    amount_value = token_amount
                    continue
                token_date = self._coerce_date(token)
                if token_date != date.today().isoformat() and date_value is None:
                    date_value = token_date
                    continue
                if token:
                    text_parts.append(token)

            merchant_value = " ".join(text_parts).strip()
            if not merchant_value or amount_value is None:
                continue

            lower_line = line.lower()
            if any(keyword in lower_line for keyword in ["spending", "income", "statement", "month", "summary"]):
                if merchant_value.lower() in {"may spendings", "spendings", "summary"} and amount_value is None:
                    continue

            rows.append({
                "date": date_value or date.today().isoformat(),
                "merchant": merchant_value,
                "amount": amount_value,
                "type": self._infer_transaction_type(merchant_value, amount_value),
                "category": "Uncategorized",
                "source": "upload",
            })

        return rows

    def _split_csv_like_line(self, line: str) -> list[str]:
        if "," in line:
            return [part.strip() for part in line.split(",") if part.strip()]
        if "\t" in line:
            return [part.strip() for part in line.split("\t") if part.strip()]
        return [part.strip() for part in line.split() if part.strip()]

    def _pick_text_value(self, row: pd.Series, preferred_column: Any | None = None) -> str | None:
        if preferred_column is not None:
            value = str(row.get(preferred_column, "")).strip()
            if value and not self._coerce_amount(value):
                return value

        for value in row.tolist():
            text = str(value).strip()
            if not text or self._coerce_amount(text) is not None or self._looks_like_date(text):
                continue
            return text
        return None

    def _pick_amount_value(self, row: pd.Series, preferred_column: Any | None = None) -> float | None:
        if preferred_column is not None:
            value = self._coerce_amount(row.get(preferred_column))
            if value is not None:
                return value

        for value in row.tolist():
            amount = self._coerce_amount(value)
            if amount is not None:
                return amount
        return None

    def _pick_date_value(self, row: pd.Series, preferred_column: Any | None = None) -> str:
        if preferred_column is not None:
            text = self._coerce_date(row.get(preferred_column))
            if text != date.today().isoformat():
                return text

        for value in row.tolist():
            if self._coerce_amount(value) is not None:
                continue
            text = self._coerce_date(value)
            if text != date.today().isoformat():
                return text
        return date.today().isoformat()

    def _extract_pdf(self, file_bytes: bytes) -> list[dict[str, Any]]:
        if fitz is None:
            return []
        document = fitz.open(stream=file_bytes, filetype="pdf")
        extracted_text = "\n".join(page.get_text("text") for page in document)
        rows: list[dict[str, Any]] = []
        for line in extracted_text.splitlines():
            parts = [part.strip() for part in line.split() if part.strip()]
            if len(parts) < 3:
                continue
            amount = self._coerce_amount(parts[-1])
            if amount is None:
                continue
            rows.append({
                "date": self._coerce_date(parts[0]),
                "merchant": " ".join(parts[1:-1]),
                "amount": float(amount),
                "category": "Uncategorized",
                "source": "upload",
            })
        return rows

    def _coerce_amount(self, value: Any) -> float | None:
        try:
            text = str(value).replace(",", "").replace("₹", "").replace("$", "").strip()
            if not text:
                return None
            return abs(float(text))
        except Exception:
            return None

    def _coerce_date(self, value: Any) -> str:
        try:
            if value is None:
                return date.today().isoformat()
            if isinstance(value, (int, float)):
                return date.today().isoformat()
            text = str(value).strip()
            if not text or text.isdigit() or self._coerce_amount(text) is not None:
                return date.today().isoformat()
            parsed = pd.to_datetime(value, errors="coerce")
            if pd.isna(parsed):
                return date.today().isoformat()
            return parsed.date().isoformat()
        except Exception:
            return date.today().isoformat()

    def _looks_like_date(self, value: str) -> bool:
        try:
            parsed = pd.to_datetime(value, errors="coerce")
            return not pd.isna(parsed)
        except Exception:
            return False

    def _infer_transaction_type(self, merchant: str, amount: float) -> str:
        merchant_lower = merchant.lower()
        if any(keyword in merchant_lower for keyword in ["income", "salary", "credit", "refund", "deposit"]):
            return "credit"
        if amount < 0:
            return "credit"
        return "debit"


@dataclass
class ExpenseCategorizationAgent:
    """Uses TF-IDF + Logistic Regression ML model (falls back to keyword rules)."""

    def categorize(self, merchant: str, amount: float) -> tuple[str, float]:
        return ml_categorizer.predict(merchant, amount)

    def categorize_batch(self, transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return ml_categorizer.predict_batch(transactions)


@dataclass
class SubscriptionDetectionAgent:
    def detect(self, transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for transaction in transactions:
            grouped[transaction["merchant"].lower()].append(transaction)

        subscriptions: list[dict[str, Any]] = []
        for merchant, items in grouped.items():
            if len(items) < 2:
                continue
            amounts = [abs(item["amount"]) for item in items]
            avg_amount = float(np.mean(amounts))
            latest = max(items, key=lambda item: item["date"])
            subscriptions.append({
                "merchant": latest["merchant"],
                "monthly_cost": round(avg_amount, 2),
                "last_seen": latest["date"],
                "status": "active" if len(items) >= 3 else "watch",
            })
        subscriptions.sort(key=lambda item: item["monthly_cost"], reverse=True)
        return subscriptions[:6]


@dataclass
class BudgetMonitoringAgent:
    def analyze(self, transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not transactions:
            return []
        by_month: dict[str, list[float]] = defaultdict(list)
        for transaction in transactions:
            if transaction.get("type", "debit") != "debit":
                continue
            month = transaction["date"][:7]
            by_month[month].append(abs(transaction["amount"]))

        ordered_months = sorted(by_month)
        if len(ordered_months) < 2:
            return []
        previous_total = sum(by_month[ordered_months[-2]])
        current_total = sum(by_month[ordered_months[-1]])
        change = ((current_total - previous_total) / previous_total * 100) if previous_total else 0
        if change > 15:
            return [{"title": "Overspending spike detected", "detail": f"Monthly spend rose by {round(change, 1)}% compared to the previous month.", "severity": "warning"}]
        return []


@dataclass
class SavingsRecommendationAgent:
    def recommend(self, transactions: list[dict[str, Any]], subscriptions: list[dict[str, Any]]) -> list[str]:
        insights: list[str] = []
        category_totals: Counter[str] = Counter(transaction["category"] for transaction in transactions if transaction.get("type", "debit") == "debit")
        if category_totals.get("Food", 0) > category_totals.get("Bills", 0):
            insights.append("Reduce delivery frequency and cook 2-3 more meals at home to save up to ₹2,500/month.")
        if subscriptions:
            expensive = max(subscriptions, key=lambda item: item["monthly_cost"])
            insights.append(f"Review {expensive['merchant']} subscription. Trimming it could save ₹{round(expensive['monthly_cost'])}/month.")
        if not insights:
            insights.append("Automate a 10% transfer into savings right after salary credit.")
        return insights[:3]


@dataclass
class BillPredictionAgent:
    def predict(self, transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        bill_like = [transaction for transaction in transactions if transaction["category"] == "Bills" and transaction.get("type", "debit") == "debit"]
        if not bill_like:
            return []
        predictions: list[dict[str, Any]] = []
        merchants = Counter(transaction["merchant"] for transaction in bill_like).most_common(3)
        for merchant, _ in merchants:
            amounts = [transaction["amount"] for transaction in bill_like if transaction["merchant"] == merchant]
            last_seen = max(transaction["date"] for transaction in bill_like if transaction["merchant"] == merchant)
            due_date = (datetime.fromisoformat(last_seen) + timedelta(days=2)).date().isoformat()
            predictions.append({
                "merchant": merchant,
                "expected_amount": round(float(np.mean(amounts)), 2),
                "due_in_days": 2,
                "due_date": due_date,
            })
        return predictions


@dataclass
class GoalPlanningAgent:
    def plan(self, goal: dict[str, Any]) -> dict[str, Any]:
        target_amount = float(goal["target_amount"])
        current_amount = float(goal.get("current_amount", 0))
        monthly_savings_target = float(goal.get("monthly_savings_target") or max(1, (target_amount - current_amount) / 12))
        remaining = max(0.0, target_amount - current_amount)
        months_left = max(1, int(np.ceil(remaining / monthly_savings_target)))
        completion_date = (datetime.now().date() + timedelta(days=months_left * 30)).isoformat()
        progress = min(100.0, round((current_amount / target_amount) * 100, 2)) if target_amount else 0.0
        return {
            **goal,
            "monthly_savings_target": round(monthly_savings_target, 2),
            "progress": progress,
            "estimated_completion": completion_date,
        }


@dataclass
class FinancialHealthScoringAgent:
    """Uses Random Forest ML model (falls back to formula)."""

    def score(self, transactions: list[dict[str, Any]], subscriptions: list[dict[str, Any]]) -> dict[str, Any]:
        if not transactions:
            return {
                "score": 72,
                "breakdown": {"savings_ratio": 16, "subscription_burden": 14, "spending_discipline": 15, "emergency_reserve": 12, "budget_adherence": 15},
                "summary": "Add transactions to generate a live health score.",
            }
        return ml_health_scorer.predict(transactions, subscriptions)


@dataclass
class OverspendingRiskAgent:
    """Uses Gradient Boosting ML model to predict overspending risk percentage."""

    def predict(
        self,
        transactions: list[dict[str, Any]],
        subscriptions: list[dict[str, Any]],
        historical_transactions: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        if not transactions:
            return {"risk_percentage": 0, "risk_label": "Low", "spend_vs_income_pct": 0.0, "projected_monthly_spend": 0.0}
        return ml_overspending_predictor.predict(transactions, subscriptions, historical_transactions)


@dataclass
class RecommendationAgent:
    """Generates personalized financial advice driven by ML model outputs."""

    def recommend(
        self,
        transactions: list[dict[str, Any]],
        subscriptions: list[dict[str, Any]],
        health_score: int,
        overspending_risk: dict[str, Any],
    ) -> list[str]:
        recommendations: list[str] = []
        risk_pct = overspending_risk.get("risk_percentage", 0)
        risk_label = overspending_risk.get("risk_label", "Low")

        cat_totals: dict[str, float] = defaultdict(float)
        for t in transactions:
            if t.get("type", "debit") == "debit":
                cat_totals[t.get("category", "Shopping")] += abs(t["amount"])

        # Overspending risk-driven recommendation
        if risk_label == "High":
            recommendations.append(
                f"Overspending risk is {risk_pct}%. Your projected monthly spend may exceed income — freeze discretionary purchases until month-end."
            )
        elif risk_label == "Medium":
            recommendations.append(
                f"Overspending risk is at {risk_pct}%. Monitor your trajectory — {overspending_risk.get('spend_vs_income_pct', 0):.0f}% of income already spent."
            )

        # Health score-driven recommendation
        if health_score < 55:
            recommendations.append("Financial health score below 55. Prioritize cutting subscriptions and increasing monthly savings transfers.")
        elif health_score < 70:
            recommendations.append("Health score has room to grow. Automate a fixed savings transfer right after salary credit.")

        # Subscription recommendation
        if subscriptions:
            expensive = max(subscriptions, key=lambda s: s.get("monthly_cost", 0))
            recommendations.append(
                f"Review your {expensive['merchant']} subscription (₹{round(expensive['monthly_cost'])}/month) — trimming it frees up savings immediately."
            )

        # Category-specific
        food = cat_totals.get("Food", 0)
        shopping = cat_totals.get("Shopping", 0)
        if food > shopping and food > 3000:
            recommendations.append("Delivery and dining dominate your spending. Cooking 3 extra meals at home saves ₹2,000–₹3,000/month.")
        elif shopping > 5000:
            recommendations.append("Shopping spend is elevated. Apply a 48-hour rule before non-essential purchases to curb impulse buys.")

        if not recommendations:
            recommendations.append("Your finances look stable. Automate 10% of income into an index fund or FD each month.")

        return recommendations[:4]


@dataclass
class SmartChallengeAgent:
    def generate(self, transactions: list[dict[str, Any]], subscriptions: list[dict[str, Any]]) -> str:
        food_spend = sum(abs(transaction["amount"]) for transaction in transactions if transaction["category"] == "Food" and transaction.get("type", "debit") == "debit")
        if food_spend > 5000:
            return "No Swiggy Week: cap delivery spend at ₹0 for 7 days and redirect the savings to your emergency fund."
        if subscriptions:
            return "Coffee Reduction Challenge: cut one recurring premium habit and move that amount into savings."
        return "Weekend Spending Limit: set a soft ₹1,500 cap on discretionary weekend spend."


@dataclass
class FinancialOrchestrator:
    extraction_agent: TransactionExtractionAgent = field(default_factory=TransactionExtractionAgent)
    categorization_agent: ExpenseCategorizationAgent = field(default_factory=ExpenseCategorizationAgent)
    subscription_agent: SubscriptionDetectionAgent = field(default_factory=SubscriptionDetectionAgent)
    budget_agent: BudgetMonitoringAgent = field(default_factory=BudgetMonitoringAgent)
    bill_agent: BillPredictionAgent = field(default_factory=BillPredictionAgent)
    goal_agent: GoalPlanningAgent = field(default_factory=GoalPlanningAgent)
    health_agent: FinancialHealthScoringAgent = field(default_factory=FinancialHealthScoringAgent)
    challenge_agent: SmartChallengeAgent = field(default_factory=SmartChallengeAgent)
    overspending_agent: OverspendingRiskAgent = field(default_factory=OverspendingRiskAgent)
    recommendation_agent: RecommendationAgent = field(default_factory=RecommendationAgent)

    def enrich_transactions(self, transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        # Use batch prediction for efficiency when model is available
        items = [{**t} for t in transactions]
        return self.categorization_agent.categorize_batch(items)

    def build_overview(self, transactions: list[dict[str, Any]], historical_transactions: list[dict[str, Any]] | None = None) -> dict[str, Any]:
        enriched = self.enrich_transactions(transactions)
        # ensure every transaction has an id for downstream schemas/UI
        for t in enriched:
            if not t.get("id"):
                t["id"] = str(uuid4())
        subscriptions = self.subscription_agent.detect(enriched)
        health = self.health_agent.score(enriched, subscriptions)
        overspending_risk = self.overspending_agent.predict(enriched, subscriptions, historical_transactions)
        ml_recommendations = self.recommendation_agent.recommend(enriched, subscriptions, health["score"], overspending_risk)
        bills = self.bill_agent.predict(enriched)
        alerts = self.budget_agent.analyze(enriched)

        monthly_spend = round(sum(abs(transaction["amount"]) for transaction in enriched if transaction.get("type", "debit") == "debit"), 2)
        monthly_income = round(sum(abs(transaction["amount"]) for transaction in enriched if transaction.get("type") == "credit"), 2)
        monthly_savings = round(max(monthly_income - monthly_spend, 0.0), 2)
        category_totals = defaultdict(float)
        for transaction in enriched:
            if transaction.get("type", "debit") != "debit":
                continue
            category_totals[transaction["category"]] += abs(transaction["amount"])

        insights: list[dict[str, Any]] = []

        # Budget alerts from BudgetMonitoringAgent
        for idx, alert in enumerate(alerts):
            insights.append({"id": f"insight-alert-{idx}", "title": alert["title"], "detail": alert["detail"], "severity": alert.get("severity", "warning")})

        # Overspending risk insight from ML model
        risk_label = overspending_risk.get("risk_label", "Low")
        risk_pct = overspending_risk.get("risk_percentage", 0)
        if risk_label in ("High", "Medium"):
            severity = "critical" if risk_label == "High" else "warning"
            insights.append({
                "id": "insight-overspend",
                "title": f"Overspending Risk: {risk_label} ({risk_pct}%)",
                "detail": f"Projected monthly spend is ₹{overspending_risk.get('projected_monthly_spend', 0):,.0f}. You've used {overspending_risk.get('spend_vs_income_pct', 0):.0f}% of income already.",
                "severity": severity,
            })

        # ML-driven recommendations from RecommendationAgent
        for idx, rec in enumerate(ml_recommendations):
            insights.append({"id": f"insight-rec-{idx}", "title": "AI Recommendation", "detail": rec, "severity": "info"})

        # Subscription cluster
        if subscriptions:
            insights.append({
                "id": "insight-subs",
                "title": "Subscription cluster detected",
                "detail": f"Detected {len(subscriptions)} recurring subscription-style payments totalling ₹{round(sum(s['monthly_cost'] for s in subscriptions)):,}/month.",
                "severity": "info",
            })

        heatmap = self._build_heatmap(enriched)
        trend = self._build_monthly_trend(enriched)
        return {
            "monthly_spend": monthly_spend,
            "monthly_savings": monthly_savings,
            "financial_health_score": health["score"],
            "subscription_costs": round(sum(item["monthly_cost"] for item in subscriptions), 2),
            "budget_utilization": min(100.0, round((monthly_spend / max(monthly_income, 1)) * 100, 2)) if monthly_income else min(100.0, round(monthly_spend / 25000 * 100, 2)),
            "upcoming_bills": bills,
            "insights": insights[:6],
            "subscriptions": subscriptions,
            "health_breakdown": health["breakdown"],
            "challenge": self.challenge_agent.generate(enriched, subscriptions),
            "monthly_trend": trend,
            "category_breakdown": [{"name": category, "value": round(amount, 2)} for category, amount in category_totals.items()],
            "heatmap": heatmap,
            "health_summary": health["summary"],
            "overspending_risk": overspending_risk,
        }

    def build_history_records(self, transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        enriched = self.enrich_transactions(transactions)
        for t in enriched:
            if not t.get("id"):
                t["id"] = str(uuid4())

        by_month: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for transaction in enriched:
            month = transaction["date"][:7]
            by_month[month].append(transaction)

        records: list[dict[str, Any]] = []
        for month, month_transactions in sorted(by_month.items()):
            month_overview = self.build_overview(month_transactions)
            debit_transactions = [item for item in month_transactions if item.get("type", "debit") == "debit"]
            credit_transactions = [item for item in month_transactions if item.get("type", "debit") == "credit"]
            category_totals = defaultdict(float)
            for item in debit_transactions:
                category_totals[item["category"]] += abs(item["amount"])

            overspending_alerts = [insight["detail"] for insight in month_overview["insights"] if insight.get("severity") in {"warning", "critical"}]
            month_date = datetime.strptime(f"{month}-01", "%Y-%m-%d")
            records.append({
                "id": str(uuid4()),
                "month": month,
                "month_label": f"{month_name[month_date.month]} {month_date.year}",
                "total_income": round(sum(abs(item["amount"]) for item in credit_transactions), 2),
                "total_expenses": round(sum(abs(item["amount"]) for item in debit_transactions), 2),
                "total_savings": round(max(sum(abs(item["amount"]) for item in credit_transactions) - sum(abs(item["amount"]) for item in debit_transactions), 0.0), 2),
                "savings_percentage": round((max(sum(abs(item["amount"]) for item in credit_transactions) - sum(abs(item["amount"]) for item in debit_transactions), 0.0) / max(sum(abs(item["amount"]) for item in credit_transactions), 1)) * 100, 2),
                "food_expenses": round(category_totals.get("Food", 0.0), 2),
                "shopping_expenses": round(category_totals.get("Shopping", 0.0), 2),
                "entertainment_expenses": round(category_totals.get("Entertainment", 0.0), 2),
                "bills_expenses": round(category_totals.get("Bills", 0.0), 2),
                "transport_expenses": round(category_totals.get("Transport", 0.0), 2),
                "education_expenses": round(category_totals.get("Education", 0.0), 2),
                "health_expenses": round(category_totals.get("Health", 0.0), 2),
                "investments": round(category_totals.get("Investments", 0.0), 2),
                "subscription_costs": round(sum(item["monthly_cost"] for item in self.subscription_agent.detect(month_transactions)), 2),
                "financial_health_score": self.health_agent.score(month_transactions, self.subscription_agent.detect(month_transactions))["score"],
                "budget_status": "On track" if month_overview["budget_utilization"] < 70 else "Watch" if month_overview["budget_utilization"] < 90 else "Risk",
                "overspending_alerts": overspending_alerts,
                "ai_recommendation_summary": month_overview["insights"][0]["detail"] if month_overview["insights"] else month_overview.get("health_summary", "No insights available."),
                "goal_progress": min(100.0, round((month_overview["monthly_savings"] / max(month_overview["monthly_spend"], 1)) * 100, 2)) if month_overview["monthly_spend"] else 0.0,
                "risk_indicator": "High" if month_overview["financial_health_score"] < 60 else "Medium" if month_overview["financial_health_score"] < 80 else "Low",
                "category_breakdown": month_overview["category_breakdown"],
                "insights": month_overview["insights"],
                "subscriptions": month_overview["subscriptions"],
                "trend": month_overview["monthly_trend"],
            })
        return records

    def _build_monthly_trend(self, transactions: list[dict[str, Any]]) -> list[dict[str, float]]:
        buckets: dict[str, float] = defaultdict(float)
        for transaction in transactions:
            if transaction.get("type", "debit") != "debit":
                continue
            buckets[transaction["date"][:7]] += abs(transaction["amount"])
        ordered = sorted(buckets.items())[-6:]
        return [{"month": month, "spend": round(amount, 2)} for month, amount in ordered]

    def _build_heatmap(self, transactions: list[dict[str, Any]]) -> list[dict[str, int | float]]:
        heat: list[dict[str, int | float]] = []
        for transaction in transactions[-28:]:
            if transaction.get("type", "debit") != "debit":
                continue
            try:
                dt = datetime.fromisoformat(transaction["date"])
                heat.append({"day": dt.weekday(), "week": dt.day // 7, "value": round(abs(transaction["amount"]), 2)})
            except Exception:
                continue
        return heat


orchestrator = FinancialOrchestrator()
