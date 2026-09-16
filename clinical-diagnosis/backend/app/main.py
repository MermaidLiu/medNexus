from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.diagnosis import router as diagnosis_router
from app.api.patients import router as patients_router
from app.config import settings

app = FastAPI(
    title=settings.app_name,
    description="AI 辅助临床诊断 — 挂号 · 预问诊 · 检验 · 影像 · 指南 · AI 诊断",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(diagnosis_router)


@app.get("/")
async def root() -> dict:
    return {
        "name": settings.app_name,
        "docs": "/docs",
        "diagnosis": "/api/v1/diagnosis/visits",
    }


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
