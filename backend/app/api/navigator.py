from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.config import settings
from app.tools.navigator import get_navigator_config, navigator_search

router = APIRouter(prefix="/api/v1/navigator", tags=["navigator"])


class NavigatorSearchRequest(BaseModel):
    query: str = Field(..., min_length=5, max_length=2000)


@router.get("/config")
async def config() -> dict:
    cfg = get_navigator_config()
    edition = settings.agent_edition.strip().lower()
    if edition in ("research", "pharma"):
        cfg["agentEdition"] = edition
    return cfg


@router.post("/search")
async def search(req: NavigatorSearchRequest) -> dict:
    return navigator_search(req.query)
