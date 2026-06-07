from datetime import datetime
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=2)
    email: str
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    name: str
    email: str


class TransactionOut(BaseModel):
    id: str
    date: str
    merchant: str
    amount: float
    category: str
    source: str = "manual"
    confidence: float = 0.9
    type: str = "debit"


class GoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0.0
    monthly_savings_target: float | None = None
    target_date: str | None = None


class GoalOut(BaseModel):
    id: str
    name: str
    target_amount: float
    current_amount: float
    monthly_savings_target: float
    target_date: str | None = None
    progress: float
    estimated_completion: str | None = None


class InsightItem(BaseModel):
    id: str
    title: str
    detail: str
    severity: str = "info"
    action_label: str | None = None


class SubscriptionItem(BaseModel):
    merchant: str
    monthly_cost: float
    last_seen: str | None = None
    status: str = "active"


class BillForecast(BaseModel):
    merchant: str
    expected_amount: float
    due_in_days: int
    due_date: str


class HealthScore(BaseModel):
    score: int
    breakdown: dict[str, float]
    summary: str


class DashboardOverview(BaseModel):
    monthly_spend: float
    monthly_savings: float
    financial_health_score: int
    subscription_costs: float
    budget_utilization: float
    upcoming_bills: list[BillForecast]
    insights: list[InsightItem]
    subscriptions: list[SubscriptionItem]
    health_breakdown: dict[str, float]
    challenge: str
    monthly_trend: list[dict[str, float | str]]
    category_breakdown: list[dict[str, float | str]]
    heatmap: list[dict[str, int | float | str]]
    transactions: list[TransactionOut] = Field(default_factory=list)
    goals: list[GoalOut] = Field(default_factory=list)
    history: list[dict[str, object]] = Field(default_factory=list)
    health_summary: str | None = None
    overspending_risk: dict[str, float | str | int] = Field(default_factory=lambda: {"risk_percentage": 0, "risk_label": "Low", "spend_vs_income_pct": 0.0, "projected_monthly_spend": 0.0})


class UploadResponse(BaseModel):
    file_name: str
    processed_transactions: int
    overview: DashboardOverview
    transactions: list[TransactionOut]


class HistoryRecord(BaseModel):
    id: str
    month: str
    month_label: str
    total_income: float
    total_expenses: float
    total_savings: float
    savings_percentage: float
    food_expenses: float
    shopping_expenses: float
    entertainment_expenses: float
    bills_expenses: float
    transport_expenses: float
    education_expenses: float
    health_expenses: float
    investments: float
    subscription_costs: float
    financial_health_score: int
    budget_status: str
    overspending_alerts: list[str] = Field(default_factory=list)
    ai_recommendation_summary: str
    goal_progress: float
    risk_indicator: str
    category_breakdown: list[dict[str, float | str]] = Field(default_factory=list)
    insights: list[InsightItem] = Field(default_factory=list)
    subscriptions: list[SubscriptionItem] = Field(default_factory=list)
    trend: list[dict[str, float | str]] = Field(default_factory=list)


class MonthlyReport(BaseModel):
    generated_at: datetime
    headline: str
    summary: str
    insights: list[InsightItem]
    actions: list[str]
