from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.store import store
from app.schemas import GoalCreate, GoalOut, UserOut
from app.services.agents import orchestrator
from .auth import get_optional_current_user

router = APIRouter()


@router.get("", response_model=dict)
async def list_goals(current_user: UserOut = Depends(get_optional_current_user)):
    goals = await store.list_goals(current_user.id)
    planned = [orchestrator.goal_agent.plan(goal) | {"id": goal["id"]} for goal in goals]
    return {"goals": planned}


@router.post("", response_model=dict)
async def create_goal(payload: GoalCreate, current_user: UserOut = Depends(get_optional_current_user)):
    created = await store.create_goal(current_user.id, payload.model_dump())
    planned = orchestrator.goal_agent.plan(created) | {"id": created["id"]}
    return {"goal": planned}


@router.patch("/{goal_id}", response_model=dict)
async def update_goal(goal_id: str, payload: GoalCreate, current_user: UserOut = Depends(get_optional_current_user)):
    updated = await store.update_goal(current_user.id, goal_id, payload.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="Goal not found")
    planned = orchestrator.goal_agent.plan(updated) | {"id": updated["id"]}
    return {"goal": planned}


@router.delete("/{goal_id}", response_model=dict)
async def delete_goal(goal_id: str, current_user: UserOut = Depends(get_optional_current_user)):
    deleted = await store.delete_goal(current_user.id, goal_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"deleted": True, "id": goal_id}
