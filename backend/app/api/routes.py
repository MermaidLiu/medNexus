from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.research import ApproveStepRequest, CreateStudyRequest, StepId, Study
from app.orchestrator.pipeline import store

router = APIRouter(prefix="/api/v1", tags=["studies"])


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "mednexus-backend", "milestone": "M2"}


@router.get("/studies")
async def list_studies() -> list:
    return store.list_studies()


@router.post("/studies", response_model=Study)
async def create_study(req: CreateStudyRequest) -> Study:
    return store.create_study(req)


@router.get("/studies/{study_id}", response_model=Study)
async def get_study(study_id: str) -> Study:
    study = store.get_study(study_id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    return study


@router.post("/studies/{study_id}/run", response_model=Study)
async def run_pipeline(study_id: str) -> Study:
    try:
        return await store.run_pipeline(study_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Study not found") from None


@router.post("/studies/{study_id}/steps/{step_id}/run", response_model=Study)
async def run_step(study_id: str, step_id: StepId) -> Study:
    try:
        return await store.run_step(study_id, step_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Study not found") from None
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/studies/{study_id}/steps/{step_id}/approve", response_model=Study)
async def approve_step(
    study_id: str, step_id: StepId, req: ApproveStepRequest
) -> Study:
    try:
        return store.approve_step(study_id, step_id, req)
    except KeyError:
        raise HTTPException(status_code=404, detail="Study not found") from None
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
