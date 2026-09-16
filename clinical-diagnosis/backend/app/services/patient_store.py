"""医生绑定患者 — JSON 持久化（MVP）."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.services.diagnosis_store import DATA_DIR, get_visit, upsert_visit

PATIENTS_FILE = DATA_DIR / "patients.json"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _load() -> dict[str, Any]:
    _ensure()
    if not PATIENTS_FILE.exists():
        return {"patients": {}}
    return json.loads(PATIENTS_FILE.read_text(encoding="utf-8"))


def _save(data: dict[str, Any]) -> None:
    _ensure()
    PATIENTS_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def list_patients_for_doctor(doctor_id: str) -> list[dict[str, Any]]:
    db = _load()
    patients = [p for p in db.get("patients", {}).values() if p.get("doctorId") == doctor_id]
    patients.sort(key=lambda p: p.get("updatedAt", ""), reverse=True)
    return patients


def get_patient(patient_id: str) -> dict[str, Any] | None:
    db = _load()
    return db.get("patients", {}).get(patient_id)


def create_patient(
    *,
    doctor_id: str,
    name: str,
    gender: str = "女",
    age: int | None = None,
    phone: str = "",
    department: str = "妇科肿瘤",
    notes: str = "",
) -> dict[str, Any]:
    if not name.strip():
        raise ValueError("请输入患者姓名")
    db = _load()
    now = _now()
    patient_id = str(uuid.uuid4())
    patient = {
        "id": patient_id,
        "doctorId": doctor_id,
        "name": name.strip(),
        "gender": gender or "女",
        "age": age,
        "phone": phone.strip(),
        "department": department.strip() or "妇科肿瘤",
        "notes": notes.strip(),
        "visitIds": [],
        "createdAt": now,
        "updatedAt": now,
    }
    db.setdefault("patients", {})[patient_id] = patient
    _save(db)
    return patient


def bind_visit_to_patient(patient_id: str, visit_id: str, *, doctor_id: str) -> dict[str, Any]:
    db = _load()
    patient = db.get("patients", {}).get(patient_id)
    if not patient or patient.get("doctorId") != doctor_id:
        raise ValueError("患者不存在或无权访问")
    visit = get_visit(visit_id)
    if not visit:
        raise ValueError("就诊记录不存在")

    visit_ids = list(patient.get("visitIds") or [])
    if visit_id not in visit_ids:
        visit_ids.append(visit_id)
    patient["visitIds"] = visit_ids
    patient["updatedAt"] = _now()

    visit["doctorId"] = doctor_id
    visit["patientId"] = patient_id
    visit.setdefault("registration", {})
    visit["registration"]["patientName"] = patient.get("name", "")
    visit["registration"]["gender"] = patient.get("gender", "女")
    if patient.get("age") is not None:
        visit["registration"]["age"] = patient.get("age")
    if patient.get("phone"):
        visit["registration"]["phone"] = patient.get("phone")
    visit["registration"]["department"] = patient.get("department", "妇科肿瘤")

    upsert_visit(visit)
    db.setdefault("patients", {})[patient_id] = patient
    _save(db)
    return patient


def update_patient(patient_id: str, *, doctor_id: str, patch: dict[str, Any]) -> dict[str, Any]:
    db = _load()
    patient = db.get("patients", {}).get(patient_id)
    if not patient or patient.get("doctorId") != doctor_id:
        raise ValueError("患者不存在或无权访问")
    for key in ("name", "gender", "age", "phone", "department", "notes"):
        if key in patch and patch[key] is not None:
            patient[key] = patch[key]
    patient["updatedAt"] = _now()
    db.setdefault("patients", {})[patient_id] = patient
    _save(db)
    return patient
