from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.services import auth_store

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class RegisterBody(BaseModel):
    email: str
    password: str
    name: str
    department: str = "妇科肿瘤"
    title: str = "医师"


class LoginBody(BaseModel):
    email: str
    password: str


class ProfilePatch(BaseModel):
    department: str | None = None
    title: str | None = None


def _extract_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    if authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return authorization.strip()


@router.post("/register")
async def register(body: RegisterBody) -> dict:
    try:
        doctor, token = auth_store.register_doctor(
            email=body.email,
            password=body.password,
            name=body.name,
            department=body.department,
            title=body.title,
        )
        return {"doctor": doctor, "token": token}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/login")
async def login(body: LoginBody) -> dict:
    try:
        doctor, token = auth_store.login_doctor(email=body.email, password=body.password)
        return {"doctor": doctor, "token": token}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e)) from e


@router.post("/logout")
async def logout(authorization: str | None = Header(default=None)) -> dict:
    token = _extract_token(authorization)
    if token:
        auth_store.logout_doctor(token)
    return {"ok": True}


@router.get("/me")
async def me(authorization: str | None = Header(default=None)) -> dict:
    token = _extract_token(authorization)
    doctor = auth_store.get_doctor_by_token(token)
    if not doctor:
        raise HTTPException(status_code=401, detail="未登录或会话已过期")
    return {"doctor": doctor}


@router.patch("/me")
async def update_me(
    body: ProfilePatch,
    authorization: str | None = Header(default=None),
) -> dict:
    token = _extract_token(authorization)
    doctor = auth_store.get_doctor_by_token(token)
    if not doctor:
        raise HTTPException(status_code=401, detail="未登录或会话已过期")
    updated = auth_store.update_doctor_profile(
        doctor["id"],
        department=body.department,
        title=body.title,
    )
    return {"doctor": updated}
