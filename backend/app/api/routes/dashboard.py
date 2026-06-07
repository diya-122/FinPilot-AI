from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.store import store
from app.schemas import DashboardOverview, UserOut
from app.services.agents import orchestrator
from .auth import get_optional_current_user

router = APIRouter()


@router.get("/overview", response_model=DashboardOverview)
async def overview(current_user: UserOut = Depends(get_optional_current_user)):
    transactions = await store.list_transactions(current_user.id)
    goals = await store.list_goals(current_user.id)
    history = await store.list_history(current_user.id)
    payload = orchestrator.build_overview(transactions, historical_transactions=history if history else None)
    goal_plans = [orchestrator.goal_agent.plan(goal) for goal in goals]
    payload["goals"] = goal_plans
    payload["transactions"] = transactions
    payload["history"] = history
    return DashboardOverview(**payload)
