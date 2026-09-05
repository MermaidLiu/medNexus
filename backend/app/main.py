from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.imaging import router as imaging_router
from app.api.navigator import router as navigator_router
from app.api.routes import router
from app.config import settings

app = FastAPI(
    title=settings.app_name,
    description="MedNexus Research Copilot — M2: Full 9-step clinical research pipeline",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(navigator_router)
app.include_router(imaging_router)


@app.get("/")
async def root() -> dict:
    return {
        "name": settings.app_name,
        "milestone": "M2",
        "docs": "/docs",
        "imaging": "/api/v1/imaging/health",
    }
