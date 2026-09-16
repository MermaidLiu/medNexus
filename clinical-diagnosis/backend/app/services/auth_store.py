"""医生注册 / 登录 — JSON 持久化（MVP）."""

from __future__ import annotations

import hashlib
import json
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from app.services.diagnosis_store import DATA_DIR

AUTH_FILE = DATA_DIR / "doctors.json"
SESSION_DAYS = 30


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _load() -> dict[str, Any]:
    _ensure()
    if not AUTH_FILE.exists():
        return {"doctors": {}, "sessions": {}}
    return json.loads(AUTH_FILE.read_text(encoding="utf-8"))


def _save(data: dict[str, Any]) -> None:
    _ensure()
    AUTH_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return f"{salt}${digest.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    try:
        salt, hexhash = stored.split("$", 1)
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return digest.hex() == hexhash


def _public_doctor(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": doc["id"],
        "email": doc["email"],
        "name": doc["name"],
        "department": doc.get("department", "妇科肿瘤"),
        "title": doc.get("title", "医师"),
        "createdAt": doc.get("createdAt"),
    }


def register_doctor(
    *,
    email: str,
    password: str,
    name: str,
    department: str,
    title: str = "医师",
) -> tuple[dict[str, Any], str]:
    email = email.strip().lower()
    if len(password) < 6:
        raise ValueError("密码至少 6 位")
    if not email or "@" not in email:
        raise ValueError("请输入有效邮箱")
    if not name.strip():
        raise ValueError("请输入姓名")

    db = _load()
    for doc in db.get("doctors", {}).values():
        if doc.get("email") == email:
            raise ValueError("该邮箱已注册")

    doc_id = str(uuid.uuid4())
    doctor = {
        "id": doc_id,
        "email": email,
        "passwordHash": _hash_password(password),
        "name": name.strip(),
        "department": department.strip() or "妇科肿瘤",
        "title": title.strip() or "医师",
        "createdAt": _now(),
    }
    db.setdefault("doctors", {})[doc_id] = doctor
    token = _create_session(db, doc_id)
    _save(db)
    return _public_doctor(doctor), token


def login_doctor(*, email: str, password: str) -> tuple[dict[str, Any], str]:
    email = email.strip().lower()
    db = _load()
    doctor = None
    for doc in db.get("doctors", {}).values():
        if doc.get("email") == email:
            doctor = doc
            break
    if not doctor or not _verify_password(password, doctor.get("passwordHash", "")):
        raise ValueError("邮箱或密码错误")
    token = _create_session(db, doctor["id"])
    _save(db)
    return _public_doctor(doctor), token


def _create_session(db: dict[str, Any], doctor_id: str) -> str:
    token = secrets.token_urlsafe(32)
    expires = (datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)).isoformat()
    db.setdefault("sessions", {})[token] = {"doctorId": doctor_id, "expiresAt": expires}
    return token


def logout_doctor(token: str) -> None:
    db = _load()
    db.get("sessions", {}).pop(token, None)
    _save(db)


def get_doctor_by_token(token: str | None) -> dict[str, Any] | None:
    if not token:
        return None
    db = _load()
    session = db.get("sessions", {}).get(token)
    if not session:
        return None
    expires = session.get("expiresAt")
    if expires and expires < _now():
        db.get("sessions", {}).pop(token, None)
        _save(db)
        return None
    doctor = db.get("doctors", {}).get(session.get("doctorId", ""))
    if not doctor:
        return None
    return _public_doctor(doctor)


def update_doctor_profile(doctor_id: str, *, department: str | None = None, title: str | None = None) -> dict[str, Any]:
    db = _load()
    doctor = db.get("doctors", {}).get(doctor_id)
    if not doctor:
        raise ValueError("医生不存在")
    if department is not None:
        doctor["department"] = department.strip() or doctor.get("department", "妇科肿瘤")
    if title is not None:
        doctor["title"] = title.strip() or doctor.get("title", "医师")
    _save(db)
    return _public_doctor(doctor)
