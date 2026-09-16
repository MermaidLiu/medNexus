from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.services import auth_store, patient_store

router = APIRouter(prefix="/api/v1/doctors", tags=["patients"])


class PatientCreate(BaseModel):
    name: str
    gender: str = "女"
    age: int | None = None
    phone: str = ""
    department: str = "妇科肿瘤"
    notes: str = ""


class PatientPatch(BaseModel):
    name: str | None = None
    gender: str | None = None
    age: int | None = None
    phone: str | None = None
    department: str | None = None
    notes: str | None = None


class BindVisitBody(BaseModel):
    visitId: str


def _extract_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    if authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return authorization.strip()


def _require_doctor(authorization: str | None) -> dict:
    token = _extract_token(authorization)
    doctor = auth_store.get_doctor_by_token(token)
    if not doctor:
        raise HTTPException(status_code=401, detail="请先登录")
    return doctor


@router.get("/me/patients")
async def list_my_patients(authorization: str | None = Header(default=None)) -> dict:
    doctor = _require_doctor(authorization)
    patients = patient_store.list_patients_for_doctor(doctor["id"])
    return {"patients": patients, "count": len(patients)}


@router.post("/me/patients")
async def create_patient(
    body: PatientCreate,
    authorization: str | None = Header(default=None),
) -> dict:
    doctor = _require_doctor(authorization)
    try:
        patient = patient_store.create_patient(
            doctor_id=doctor["id"],
            name=body.name,
            gender=body.gender,
            age=body.age,
            phone=body.phone,
            department=body.department or doctor.get("department", "妇科肿瘤"),
            notes=body.notes,
        )
        return patient
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.patch("/me/patients/{patient_id}")
async def patch_patient(
    patient_id: str,
    body: PatientPatch,
    authorization: str | None = Header(default=None),
) -> dict:
    doctor = _require_doctor(authorization)
    try:
        return patient_store.update_patient(
            patient_id,
            doctor_id=doctor["id"],
            patch=body.model_dump(exclude_unset=True),
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.post("/me/patients/{patient_id}/bind-visit")
async def bind_visit(
    patient_id: str,
    body: BindVisitBody,
    authorization: str | None = Header(default=None),
) -> dict:
    doctor = _require_doctor(authorization)
    try:
        patient = patient_store.bind_visit_to_patient(
            patient_id,
            body.visitId,
            doctor_id=doctor["id"],
        )
        return patient
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
