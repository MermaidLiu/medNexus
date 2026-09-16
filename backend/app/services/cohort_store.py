"""91 例队列 — 本地 JSON 持久化."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "cohort"
DB_FILE = DATA_DIR / "cohort_db.json"


def _ensure_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _load() -> dict[str, Any]:
    _ensure_dir()
    if not DB_FILE.exists():
        return {
            "version": 1,
            "name": "91例卵巢癌队列",
            "importedAt": None,
            "sourceFile": None,
            "columns_raw": [],
            "columns_mapped": {},
            "patients": [],
        }
    return json.loads(DB_FILE.read_text(encoding="utf-8"))


def _save(data: dict[str, Any]) -> None:
    _ensure_dir()
    DB_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def get_meta() -> dict[str, Any]:
    db = _load()
    return {
        "name": db.get("name"),
        "importedAt": db.get("importedAt"),
        "sourceFile": db.get("sourceFile"),
        "columns_raw": db.get("columns_raw", []),
        "columns_mapped": db.get("columns_mapped", {}),
        "patient_count": len(db.get("patients", [])),
    }


def list_patients() -> list[dict[str, Any]]:
    return _load().get("patients", [])


def get_patient(patient_id: str) -> dict[str, Any] | None:
    for p in list_patients():
        if p.get("id") == patient_id:
            return p
    return None


def import_patients(
    patients: list[dict[str, Any]],
    *,
    columns_raw: list[str],
    columns_mapped: dict[str, str],
    source_file: str,
    mode: str = "replace",
) -> dict[str, Any]:
    db = _load()
    now = datetime.now(timezone.utc).isoformat()

    if mode == "append":
        existing = db.get("patients", [])
        db["patients"] = existing + patients
    else:
        db["patients"] = patients

    db["importedAt"] = now
    db["sourceFile"] = source_file
    db["columns_raw"] = columns_raw
    db["columns_mapped"] = columns_mapped
    _save(db)

    return {
        "imported": len(patients),
        "total": len(db["patients"]),
        "mode": mode,
        "importedAt": now,
    }


def update_patient(patient_id: str, patch: dict[str, Any]) -> dict[str, Any] | None:
    db = _load()
    updated = None
    for i, p in enumerate(db.get("patients", [])):
        if p.get("id") != patient_id:
            continue
        merged = {**p, **patch, "id": patient_id}
        merged["updatedAt"] = datetime.now(timezone.utc).isoformat()
        db["patients"][i] = merged
        updated = merged
        break
    if updated is None:
        return None
    _save(db)
    return updated


def delete_all() -> None:
    db = _load()
    db["patients"] = []
    db["importedAt"] = None
    db["sourceFile"] = None
    _save(db)
