"""临床诊断就诊记录 — 本地持久化（Web + 小程序同步）."""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# 本地：clinical-diagnosis/data/diagnosis；Docker：挂载 DATA_ROOT=/data
_DEFAULT_ROOT = Path(__file__).resolve().parents[3]
DATA_ROOT = Path(os.environ.get("DATA_ROOT", str(_DEFAULT_ROOT)))
DATA_DIR = DATA_ROOT / "data" / "diagnosis"
DB_FILE = DATA_DIR / "visits.json"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _load() -> dict[str, Any]:
    _ensure()
    if not DB_FILE.exists():
        return {"visits": {}}
    return json.loads(DB_FILE.read_text(encoding="utf-8"))


def _save(data: dict[str, Any]) -> None:
    _ensure()
    DB_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def empty_visit(
    visit_id: str | None = None,
    *,
    doctor_id: str | None = None,
    patient_id: str | None = None,
    department: str = "妇科肿瘤",
) -> dict[str, Any]:
    vid = visit_id or str(uuid.uuid4())
    now = _now()
    return {
        "id": vid,
        "doctorId": doctor_id,
        "patientId": patient_id,
        "createdAt": now,
        "updatedAt": now,
        "currentStep": "registration",
        "completedSteps": [],
        "registration": {
            "patientName": "",
            "gender": "女",
            "department": department,
            "chiefComplaint": "",
        },
        "preconsult": {"symptoms": "", "history": "", "chatMessages": []},
        "labs": {"blood": {}, "urine": {}, "notes": ""},
        "imaging": {"uploaded": False, "images": []},
        "guidelines": {"selected": [], "notes": ""},
        "aiDiagnosis": None,
    }


def create_visit(
    *,
    doctor_id: str | None = None,
    patient_id: str | None = None,
    department: str = "妇科肿瘤",
    registration: dict[str, Any] | None = None,
) -> dict[str, Any]:
    visit = empty_visit(doctor_id=doctor_id, patient_id=patient_id, department=department)
    if registration:
        visit["registration"] = {**visit["registration"], **registration}
    db = _load()
    db.setdefault("visits", {})[visit["id"]] = visit
    _save(db)
    return visit


def list_visits(limit: int = 50, doctor_id: str | None = None) -> list[dict[str, Any]]:
    db = _load()
    visits = list(db.get("visits", {}).values())
    if doctor_id:
        visits = [v for v in visits if v.get("doctorId") == doctor_id]
    visits.sort(key=lambda v: v.get("updatedAt", ""), reverse=True)
    return visits[:limit]


def get_visit(visit_id: str) -> dict[str, Any] | None:
    db = _load()
    return db.get("visits", {}).get(visit_id)


def upsert_visit(visit: dict[str, Any]) -> dict[str, Any]:
    vid = visit.get("id")
    if not vid:
        raise ValueError("visit.id required")
    db = _load()
    existing = db.get("visits", {}).get(vid)
    if existing:
        visit.setdefault("createdAt", existing.get("createdAt"))
    else:
        visit.setdefault("createdAt", _now())
    visit["updatedAt"] = _now()
    db.setdefault("visits", {})[vid] = visit
    _save(db)
    return visit


def patch_visit(visit_id: str, patch: dict[str, Any]) -> dict[str, Any] | None:
    visit = get_visit(visit_id)
    if not visit:
        return None
    for key, val in patch.items():
        if key in ("id", "createdAt"):
            continue
        if isinstance(val, dict) and isinstance(visit.get(key), dict):
            visit[key] = {**visit[key], **val}
        else:
            visit[key] = val
    visit["updatedAt"] = _now()
    return upsert_visit(visit)
