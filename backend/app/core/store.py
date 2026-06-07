from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

# Where data is persisted — sits next to this file, gitignored
_DATA_FILE = Path(__file__).parent / "data.json"


def _load_data() -> dict[str, list[Any]]:
    if _DATA_FILE.exists():
        try:
            with open(_DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"users": [], "transactions": [], "goals": [], "history": []}


def _save_data(data: dict[str, list[Any]]) -> None:
    try:
        with open(_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)
    except Exception:
        pass


@dataclass
class MemoryStore:
    users: list[dict[str, Any]] = field(default_factory=list)
    transactions: list[dict[str, Any]] = field(default_factory=list)
    goals: list[dict[str, Any]] = field(default_factory=list)
    history: list[dict[str, Any]] = field(default_factory=list)

    def __post_init__(self) -> None:
        """Load persisted data from disk on startup."""
        saved = _load_data()
        self.users = saved.get("users", [])
        self.transactions = saved.get("transactions", [])
        self.goals = saved.get("goals", [])
        self.history = saved.get("history", [])

    def _persist(self) -> None:
        _save_data({
            "users": self.users,
            "transactions": self.transactions,
            "goals": self.goals,
            "history": self.history,
        })

    # ── users ──────────────────────────────────────────────────────────────────

    async def find_user_by_email(self, email: str) -> dict[str, Any] | None:
        return next((u for u in self.users if u["email"] == email), None)

    async def find_user_by_id(self, user_id: str) -> dict[str, Any] | None:
        return next((u for u in self.users if u["id"] == user_id), None)

    async def create_user(self, payload: dict[str, Any]) -> dict[str, Any]:
        record = {"id": str(uuid4()), **payload, "created_at": datetime.now(timezone.utc).isoformat()}
        self.users.append(record)
        self._persist()
        return record

    # ── transactions ───────────────────────────────────────────────────────────

    async def upsert_transactions(self, user_id: str, items: list[dict[str, Any]]) -> None:
        # Remove previous transactions for this user so we don't accumulate duplicates
        # on repeated uploads — keep only the new batch
        self.transactions = [t for t in self.transactions if t.get("user_id") != user_id]
        for item in items:
            self.transactions.append({"id": str(uuid4()), "user_id": user_id, **item})
        self._persist()

    async def list_transactions(self, user_id: str) -> list[dict[str, Any]]:
        return [t for t in self.transactions if t.get("user_id") == user_id]

    # ── goals ──────────────────────────────────────────────────────────────────

    async def create_goal(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        record = {"id": str(uuid4()), "user_id": user_id, **payload}
        self.goals.append(record)
        self._persist()
        return record

    async def list_goals(self, user_id: str) -> list[dict[str, Any]]:
        return [g for g in self.goals if g.get("user_id") == user_id]

    async def update_goal_progress(self, user_id: str, goal_id: str, current_amount: float) -> dict[str, Any] | None:
        for goal in self.goals:
            if goal.get("user_id") == user_id and goal.get("id") == goal_id:
                goal["current_amount"] = current_amount
                self._persist()
                return goal
        return None

    async def update_goal(self, user_id: str, goal_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        for goal in self.goals:
            if goal.get("user_id") == user_id and goal.get("id") == goal_id:
                # update only the editable fields
                for key in ("name", "target_amount", "current_amount", "monthly_savings_target", "target_date"):
                    if key in payload and payload[key] is not None:
                        goal[key] = payload[key]
                self._persist()
                return goal
        return None

    async def delete_goal(self, user_id: str, goal_id: str) -> bool:
        before = len(self.goals)
        self.goals = [g for g in self.goals if not (g.get("user_id") == user_id and g.get("id") == goal_id)]
        if len(self.goals) < before:
            self._persist()
            return True
        return False

    # ── history ────────────────────────────────────────────────────────────────

    async def upsert_history(self, user_id: str, items: list[dict[str, Any]]) -> None:
        # Replace history for this user on each upload
        self.history = [h for h in self.history if h.get("user_id") != user_id]
        for item in items:
            self.history.append({"id": str(uuid4()), "user_id": user_id, **item})
        self._persist()

    async def list_history(self, user_id: str) -> list[dict[str, Any]]:
        return [h for h in self.history if h.get("user_id") == user_id]


store = MemoryStore()
