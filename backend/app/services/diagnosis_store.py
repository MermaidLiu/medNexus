"""临床诊断就诊记录 — 本地持久化（Web + 小程序同步）."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "diagnosis"
DB_FILE = DATA_DIR / "visits.json"

STEPS = [
    "registration",
    "preconsult",
    "labs",
    "imaging",
    "guidelines",
    "ai_diagnosis",
]


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


def empty_visit(visit_id: str | None = None) -> dict[str, Any]:
    vid = visit_id or str(uuid.uuid4())
    now = _now()
    return {
        "id": vid,
        "createdAt": now,
        "updatedAt": now,
        "currentStep": "registration",
        "completedSteps": [],
        "registration": {
            "patientName": "",
            "gender": "女",
            "department": "妇科肿瘤",
            "chiefComplaint": "",
        },
        "preconsult": {"symptoms": "", "history": ""},
        "labs": {"blood": {}, "urine": {}, "notes": ""},
        "imaging": {"uploaded": False},
        "guidelines": {"selected": [], "notes": ""},
        "aiDiagnosis": None,
    }


def list_visits(limit: int = 50) -> list[dict[str, Any]]:
    db = _load()
    visits = list(db.get("visits", {}).values())
    visits.sort(key=lambda v: v.get("updatedAt", ""), reverse=True)
    return visits[:limit]


def get_visit(visit_id: str) -> dict[str, Any] | None:
    db = _load()
    return db.get("visits", {}).get(visit_id)


def create_visit() -> dict[str, Any]:
    visit = empty_visit()
    db = _load()
    db.setdefault("visits", {})[visit["id"]] = visit
    _save(db)
    return visit


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
