from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import diagnosis_store
from app.services.diagnosis_ai import ai_diagnose

router = APIRouter(prefix="/api/v1/diagnosis", tags=["diagnosis"])


class VisitPatch(BaseModel):
    currentStep: str | None = None
    completedSteps: list[str] | None = None
    registration: dict | None = None
    preconsult: dict | None = None
    labs: dict | None = None
    imaging: dict | None = None
    guidelines: dict | None = None


class VisitUpsert(BaseModel):
    id: str
    currentStep: str | None = None
    completedSteps: list[str] | None = None
    registration: dict | None = None
    preconsult: dict | None = None
    labs: dict | None = None
    imaging: dict | None = None
    guidelines: dict | None = None
    aiDiagnosis: dict | None = None


@router.get("/visits")
async def list_visits() -> dict:
    visits = diagnosis_store.list_visits()
    return {"visits": visits, "count": len(visits)}


@router.post("/visits")
async def create_visit() -> dict:
    return diagnosis_store.create_visit()


@router.get("/visits/{visit_id}")
async def get_visit(visit_id: str) -> dict:
    visit = diagnosis_store.get_visit(visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="就诊记录不存在")
    return visit


@router.put("/visits/{visit_id}")
async def sync_visit(visit_id: str, body: VisitUpsert) -> dict:
    if body.id != visit_id:
        raise HTTPException(status_code=400, detail="visit id 不一致")
    return diagnosis_store.upsert_visit(body.model_dump(exclude_unset=False))


@router.patch("/visits/{visit_id}")
async def patch_visit(visit_id: str, body: VisitPatch) -> dict:
    updated = diagnosis_store.patch_visit(visit_id, body.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="就诊记录不存在")
    return updated


@router.post("/visits/{visit_id}/ai-diagnose")
async def run_ai_diagnose(visit_id: str) -> dict:
    visit = diagnosis_store.get_visit(visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="就诊记录不存在")
    result = ai_diagnose(visit)
    visit["aiDiagnosis"] = result
    visit["currentStep"] = "ai_diagnosis"
    steps = set(visit.get("completedSteps") or [])
    steps.update(["registration", "preconsult", "labs", "imaging", "guidelines", "ai_diagnosis"])
    visit["completedSteps"] = list(steps)
    diagnosis_store.upsert_visit(visit)
    return {"visit": visit, "aiDiagnosis": result}
