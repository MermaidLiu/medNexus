from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel

from app.services import auth_store, diagnosis_store
from app.services.diagnosis_ai import ai_diagnose
from app.services import patient_store

router = APIRouter(prefix="/api/v1/diagnosis", tags=["diagnosis"])


class VisitPatch(BaseModel):
    currentStep: str | None = None
    completedSteps: list[str] | None = None
    registration: dict | None = None
    preconsult: dict | None = None
    labs: dict | None = None
    imaging: dict | None = None
    guidelines: dict | None = None
    doctorId: str | None = None
    patientId: str | None = None


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
    doctorId: str | None = None
    patientId: str | None = None


class CreateVisitBody(BaseModel):
    doctorId: str | None = None
    patientId: str | None = None
    department: str | None = None


def _extract_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    if authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return authorization.strip()


@router.get("/visits")
async def list_visits(
    authorization: str | None = Header(default=None),
    doctorId: str | None = Query(default=None),
) -> dict:
    token = _extract_token(authorization)
    doctor = auth_store.get_doctor_by_token(token)
    filter_id = doctorId or (doctor["id"] if doctor else None)
    visits = diagnosis_store.list_visits(doctor_id=filter_id)
    return {"visits": visits, "count": len(visits)}


@router.post("/visits")
async def create_visit(
    body: CreateVisitBody | None = None,
    authorization: str | None = Header(default=None),
) -> dict:
    body = body or CreateVisitBody()
    token = _extract_token(authorization)
    doctor = auth_store.get_doctor_by_token(token)

    doctor_id = body.doctorId or (doctor["id"] if doctor else None)
    department = body.department or (doctor.get("department") if doctor else None) or "妇科肿瘤"

    registration = None
    patient_id = body.patientId
    if patient_id and doctor_id:
        patient = patient_store.get_patient(patient_id)
        if not patient or patient.get("doctorId") != doctor_id:
            raise HTTPException(status_code=404, detail="患者不存在")
        registration = {
            "patientName": patient.get("name", ""),
            "gender": patient.get("gender", "女"),
            "age": patient.get("age"),
            "phone": patient.get("phone", ""),
            "department": patient.get("department", department),
        }

    visit = diagnosis_store.create_visit(
        doctor_id=doctor_id,
        patient_id=patient_id,
        department=department,
        registration=registration,
    )
    if doctor_id:
        visit["currentStep"] = "structured_record"
        diagnosis_store.upsert_visit(visit)

    if patient_id and doctor_id:
        patient_store.bind_visit_to_patient(patient_id, visit["id"], doctor_id=doctor_id)
        visit = diagnosis_store.get_visit(visit["id"]) or visit

    return visit


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
    steps.update(
        ["structured_record", "registration", "preconsult", "labs", "imaging", "guidelines", "ai_diagnosis"]
    )
    visit["completedSteps"] = list(steps)
    diagnosis_store.upsert_visit(visit)
    return {"visit": visit, "aiDiagnosis": result}
