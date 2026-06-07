from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.store import store
from app.schemas import UploadResponse, UserOut
from uuid import uuid4
from app.services.agents import orchestrator
from .auth import get_optional_current_user

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_statement(file: UploadFile = File(...), current_user: UserOut = Depends(get_optional_current_user)):
    content = await file.read()
    try:
        extracted = orchestrator.extraction_agent.extract(file.filename, content)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    enriched = orchestrator.enrich_transactions(extracted)
    for t in enriched:
        if not t.get("id"):
            t["id"] = str(uuid4())

    # fetch existing history before building overview so overspending model has historical context
    historical = await store.list_transactions(current_user.id)
    await store.upsert_transactions(current_user.id, enriched)
    await store.upsert_history(current_user.id, orchestrator.build_history_records(extracted))

    overview = orchestrator.build_overview(enriched, historical_transactions=historical if historical else None)
    overview["transactions"] = enriched
    # preserve existing goals — don't wipe them on re-upload
    existing_goals = await store.list_goals(current_user.id)
    overview["goals"] = [orchestrator.goal_agent.plan(g) | {"id": g["id"]} for g in existing_goals]
    overview["history"] = await store.list_history(current_user.id)
    return UploadResponse(file_name=file.filename, processed_transactions=len(enriched), overview=overview, transactions=enriched)


@router.get("", response_model=dict)
async def list_transactions(current_user: UserOut = Depends(get_optional_current_user)):
    transactions = await store.list_transactions(current_user.id)
    return {"transactions": transactions}
