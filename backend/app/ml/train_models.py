"""
FinPilot AI — Model Training Script
Run once to generate and persist all three ML models:
  1. Expense Categorization  (TF-IDF + Logistic Regression)
  2. Financial Health Score  (Random Forest Regressor)
  3. Overspending Risk       (XGBoost / Gradient Boosting Classifier)

Usage (from backend/ folder):
    python -m app.ml.train_models
"""

from __future__ import annotations

import json
import os
import pickle
import random
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, mean_absolute_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

# ── reproducibility ────────────────────────────────────────────────────────────
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

# ══════════════════════════════════════════════════════════════════════════════
# 1. EXPENSE CATEGORIZATION — TF-IDF + Logistic Regression
# ══════════════════════════════════════════════════════════════════════════════

CATEGORY_SAMPLES: dict[str, list[str]] = {
    "Food": [
        "swiggy order", "zomato delivery", "mcdonalds", "kfc meal", "dominos pizza",
        "subway sandwich", "starbucks coffee", "cafe coffee day", "restaurant dinner",
        "hotel breakfast", "pizza hut", "burger king", "biryani house", "haldirams",
        "barbeque nation", "paradise restaurant", "food delivery", "eat club lunch",
        "fresh menu", "box8 dinner", "rebel foods", "faasos wrap", "behrouz biryani",
        "oven story pizza", "mandarin restaurant", "the grand buffet", "food court mall",
        "dine out booking", "udupi restaurant", "idli dosa place", "chinese takeaway",
        "thai kitchen", "sushi bar", "rolls and wraps", "chai point", "chaayos tea",
        "brewberry cafe", "third wave coffee", "blue tokai roasters", "coffee subscription",
        "grocery store purchase", "supermarket food", "bigbasket order", "grofers cart",
        "nature basket", "metro cash carry", "dmart groceries", "reliance fresh",
    ],
    "Shopping": [
        "amazon purchase", "flipkart order", "myntra fashion", "ajio clothing",
        "nykaa cosmetics", "meesho order", "snapdeal deal", "shopclues buy",
        "jabong shoes", "tata cliq", "reliance digital", "croma electronics",
        "vijay sales appliance", "pantaloons apparel", "westside clothing",
        "lifestyle store", "shoppers stop", "central mall", "max fashion",
        "h&m purchase", "zara india", "marks spencer", "fabindia kurta",
        "online shopping", "mall purchase", "retail store", "department store",
        "lenskart glasses", "pepperfry furniture", "urban ladder sofa",
        "ikea india", "hometown furniture", "nilkamal chair", "godrej interio",
        "crossword books", "flipkart books", "amazon kindle", "decathlon sports",
        "adidas shoes", "nike footwear", "puma apparel", "reebok sports",
        "woodland shoes", "red tape shoes", "bata footwear", "liberty shoes",
    ],
    "Entertainment": [
        "netflix subscription", "amazon prime video", "disney plus hotstar",
        "spotify premium", "apple music", "youtube premium", "zee5 subscription",
        "sonyliv plan", "voot select", "alt balaji", "mxplayer premium",
        "bookmyshow movie", "pvr cinemas ticket", "inox multiplex", "cinepolis booking",
        "steam game purchase", "epic games store", "playstation plus", "xbox game pass",
        "nintendo eshop", "google play games", "apple arcade", "ea sports",
        "gaming subscription", "twitch bits", "discord nitro", "youtube music",
        "gaana music", "jiosaavn plan", "hungama music", "wynk music",
        "multiplex food", "movie snacks", "bowling alley", "escape room game",
        "laser tag arena", "vr gaming zone", "amusement park ticket", "water park entry",
        "concert ticket", "comedy show", "theatre booking", "live performance",
        "sports event ticket", "ipl match", "cricket stadium", "football match",
    ],
    "Bills": [
        "electricity bill payment", "bescom electricity", "tata power bill",
        "adani electricity", "msedcl bill", "water bill payment", "bwssb water",
        "gas bill payment", "indane gas", "bharat gas", "hp gas cylinder",
        "broadband internet bill", "airtel broadband", "jio fiber payment",
        "bsnl landline", "act fibernet", "hathway cable", "tata sky dth",
        "dish tv recharge", "sun direct dth", "mobile bill postpaid",
        "airtel postpaid", "vi postpaid", "jio postpaid", "bsnl mobile",
        "rent payment", "house rent", "flat rent emi", "society maintenance",
        "property tax", "municipal tax", "insurance premium", "lic premium",
        "health insurance", "car insurance", "bike insurance", "term insurance",
        "home loan emi", "car loan emi", "personal loan emi", "credit card bill",
    ],
    "Transport": [
        "uber ride", "ola cab", "rapido bike", "meru taxi", "zoom car rental",
        "drivezy car", "revv car rental", "bounce scooter", "yulu bike",
        "metro card recharge", "dmrc metro", "bmtc bus pass", "ksrtc bus ticket",
        "irctc train ticket", "railway reservation", "railway booking",
        "indigo flight", "spicejet ticket", "air india booking", "go first airline",
        "akasa air ticket", "vistara flight", "redbus ticket", "abhibus booking",
        "fuel petrol pump", "hp petrol", "bharat petroleum", "indian oil fuel",
        "shell fuel station", "parking fee", "toll plaza", "fastag recharge",
        "auto rickshaw", "electric vehicle charge", "tata motors ev", "ather energy",
        "honda bike service", "car service", "maruti suzuki service",
        "hyundai service center", "vehicle repair", "tyre puncture shop",
    ],
    "Health": [
        "apollo hospital", "fortis healthcare", "max hospital", "manipal hospital",
        "aiims consultation", "doctor consultation", "specialist visit",
        "medplus pharmacy", "apollo pharmacy", "netmeds order", "pharmeasy delivery",
        "1mg medicine", "practo consultation", "tata 1mg lab test",
        "thyrocare test", "dr lal pathlabs", "srl diagnostics", "healthians test",
        "gym membership", "cult fit subscription", "gold gym", "anytime fitness",
        "yoga studio", "meditation app", "headspace subscription", "calm app",
        "dental clinic", "eye care hospital", "optician glasses", "lasik surgery",
        "physiotherapy session", "ayurveda clinic", "homeopathy doctor",
        "skincare clinic", "dermatologist", "nutritionist consultation",
        "health checkup", "full body checkup", "blood test", "urine test",
        "covid test", "vaccination center", "mental health counselor",
    ],
    "Education": [
        "udemy course", "coursera certificate", "edx learning", "skillshare plan",
        "linkedin learning", "pluralsight subscription", "codecademy pro",
        "leetcode premium", "hackerrank certification", "upgrad course",
        "byjus subscription", "vedantu live classes", "unacademy plus",
        "toppr subscription", "meritnation", "khan academy donation",
        "school fees payment", "tuition fees", "college fees", "university fees",
        "exam registration", "jee coaching", "neet preparation", "gate coaching",
        "cat preparation", "ielts registration", "gre exam fee", "gmat registration",
        "books stationery", "school books", "college textbooks", "notebooks purchase",
        "coding bootcamp", "data science course", "machine learning certification",
        "aws certification", "google cloud exam", "microsoft azure cert",
        "library membership", "research journal", "educational subscription",
    ],
    "Investments": [
        "sip investment mutual fund", "zerodha trading", "groww investment",
        "upstox stocks", "angel broking", "hdfc securities", "icici direct trading",
        "kotak securities", "motilal oswal", "paytm money sip",
        "public provident fund ppf", "nps contribution", "national pension system",
        "employee provident fund epf", "elss mutual fund tax saving",
        "nifty index fund", "sensex etf", "gold etf purchase", "sovereign gold bond",
        "rbi bonds", "fixed deposit fd booking", "recurring deposit rd",
        "mutual fund redemption", "portfolio rebalancing", "dividend reinvestment",
        "real estate investment", "reit purchase", "property investment",
        "cryptocurrency purchase", "bitcoin investment", "crypto exchange",
        "stock market purchase", "ipo application", "rights issue subscription",
        "demat account charges", "brokerage fee", "depository participant fee",
    ],
}


def _generate_categorization_data() -> tuple[list[str], list[str]]:
    texts: list[str] = []
    labels: list[str] = []
    for category, samples in CATEGORY_SAMPLES.items():
        for sample in samples:
            texts.append(sample)
            labels.append(category)
            # augment: uppercase variant
            texts.append(sample.upper())
            labels.append(category)
            # augment: add amount-like noise
            texts.append(f"{sample} ₹{random.randint(50, 5000)}")
            labels.append(category)
    return texts, labels


def train_expense_categorization() -> None:
    print("Training Expense Categorization Model (TF-IDF + Logistic Regression)...")
    texts, labels = _generate_categorization_data()

    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.15, random_state=SEED, stratify=labels
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),
            min_df=1,
            max_features=8000,
            sublinear_tf=True,
        )),
        ("clf", LogisticRegression(
            C=5.0,
            max_iter=1000,
            random_state=SEED,
            solver="lbfgs",
        )),
    ])
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    print(classification_report(y_test, y_pred, zero_division=0))

    model_path = MODELS_DIR / "expense_categorization.pkl"
    with open(model_path, "wb") as file:
        pickle.dump(pipeline, file)
    print(f"  Saved → {model_path}\n")


# ══════════════════════════════════════════════════════════════════════════════
# 2. FINANCIAL HEALTH SCORE — Random Forest Regressor
# ══════════════════════════════════════════════════════════════════════════════

def _generate_health_data(n: int = 3000) -> pd.DataFrame:
    rows = []
    for _ in range(n):
        income = random.uniform(15000, 200000)
        savings_rate = random.uniform(0, 0.55)
        savings = income * savings_rate
        expenses = income - savings
        subscription_count = random.randint(0, 10)
        subscription_cost = subscription_count * random.uniform(100, 800)
        food_ratio = random.uniform(0.05, 0.45)
        shopping_ratio = random.uniform(0.05, 0.35)
        bills_ratio = random.uniform(0.05, 0.40)
        entertainment_ratio = random.uniform(0.01, 0.20)
        budget_utilization = min(100, (expenses / income) * 100)

        # score components (0-100)
        score_savings = min(35, savings_rate * 70)
        score_subscription = max(0, 20 - subscription_count * 2)
        score_discipline = max(0, 25 - max(0, food_ratio - 0.25) * 50 - max(0, shopping_ratio - 0.20) * 40)
        score_budget = max(0, 20 - max(0, budget_utilization - 60) * 0.5)

        # add noise to make it a realistic regression target
        score = min(100, max(0, score_savings + score_subscription + score_discipline + score_budget + random.gauss(0, 3)))

        rows.append({
            "income": income,
            "total_expenses": expenses,
            "savings": savings,
            "savings_rate": savings_rate,
            "subscription_count": subscription_count,
            "subscription_cost": subscription_cost,
            "food_ratio": food_ratio,
            "shopping_ratio": shopping_ratio,
            "bills_ratio": bills_ratio,
            "entertainment_ratio": entertainment_ratio,
            "budget_utilization": budget_utilization,
            "health_score": score,
        })
    return pd.DataFrame(rows)


HEALTH_FEATURES = [
    "income", "total_expenses", "savings", "savings_rate",
    "subscription_count", "subscription_cost",
    "food_ratio", "shopping_ratio", "bills_ratio", "entertainment_ratio",
    "budget_utilization",
]


def train_health_score() -> None:
    print("Training Financial Health Score Model (Random Forest Regressor)...")
    df = _generate_health_data()

    X = df[HEALTH_FEATURES]
    y = df["health_score"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=SEED)

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=3,
        random_state=SEED,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    mae = mean_absolute_error(y_test, model.predict(X_test))
    print(f"  MAE on test set: {mae:.2f} score points")

    model_path = MODELS_DIR / "health_score.pkl"
    meta_path = MODELS_DIR / "health_score_features.json"
    with open(model_path, "wb") as file:
        pickle.dump(model, file)
    with open(meta_path, "w") as file:
        json.dump(HEALTH_FEATURES, file)
    print(f"  Saved → {model_path}\n")


# ══════════════════════════════════════════════════════════════════════════════
# 3. OVERSPENDING RISK PREDICTOR — Gradient Boosting Classifier (XGBoost-style)
# ══════════════════════════════════════════════════════════════════════════════

def _generate_overspending_data(n: int = 3000) -> pd.DataFrame:
    rows = []
    for _ in range(n):
        income = random.uniform(15000, 200000)
        current_spend = random.uniform(5000, income * 1.3)
        historical_avg = random.uniform(5000, income)
        food_spend = random.uniform(0, current_spend * 0.5)
        shopping_spend = random.uniform(0, current_spend * 0.4)
        entertainment_spend = random.uniform(0, current_spend * 0.3)
        bills_spend = random.uniform(0, current_spend * 0.5)
        day_of_month = random.randint(1, 28)
        days_remaining = 30 - day_of_month
        subscription_cost = random.uniform(0, 5000)

        # derive spend ratios
        spend_vs_income = current_spend / max(income, 1)
        spend_vs_history = current_spend / max(historical_avg, 1)

        # over-budget if current spend is on track to exceed income
        projected_monthly = (current_spend / max(day_of_month, 1)) * 30
        overspending = 1 if projected_monthly > income * 0.95 else 0

        rows.append({
            "income": income,
            "current_spend": current_spend,
            "historical_avg_spend": historical_avg,
            "food_spend": food_spend,
            "shopping_spend": shopping_spend,
            "entertainment_spend": entertainment_spend,
            "bills_spend": bills_spend,
            "day_of_month": day_of_month,
            "days_remaining": days_remaining,
            "subscription_cost": subscription_cost,
            "spend_vs_income": spend_vs_income,
            "spend_vs_history": spend_vs_history,
            "overspending": overspending,
        })
    return pd.DataFrame(rows)


OVERSPEND_FEATURES = [
    "income", "current_spend", "historical_avg_spend",
    "food_spend", "shopping_spend", "entertainment_spend", "bills_spend",
    "day_of_month", "days_remaining", "subscription_cost",
    "spend_vs_income", "spend_vs_history",
]


def train_overspending_risk() -> None:
    print("Training Overspending Risk Model (Gradient Boosting Classifier)...")
    df = _generate_overspending_data()

    X = df[OVERSPEND_FEATURES]
    y = df["overspending"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=SEED, stratify=y)

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", GradientBoostingClassifier(
            n_estimators=200,
            learning_rate=0.08,
            max_depth=5,
            subsample=0.85,
            random_state=SEED,
        )),
    ])
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    print(classification_report(y_test, y_pred, zero_division=0))

    model_path = MODELS_DIR / "overspending_risk.pkl"
    meta_path = MODELS_DIR / "overspending_risk_features.json"
    with open(model_path, "wb") as file:
        pickle.dump(pipeline, file)
    with open(meta_path, "w") as file:
        json.dump(OVERSPEND_FEATURES, file)
    print(f"  Saved → {model_path}\n")


# ══════════════════════════════════════════════════════════════════════════════
# Entry point
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    train_expense_categorization()
    train_health_score()
    train_overspending_risk()
    print("All models trained and saved to", MODELS_DIR)
