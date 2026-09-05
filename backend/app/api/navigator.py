from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.tools.navigator import get_navigator_config, navigator_search

router = APIRouter(prefix="/api/v1/navigator", tags=["navigator"])


class NavigatorSearchRequest(BaseModel):
    query: str = Field(..., min_length=5, max_length=2000)


@router.get("/config")
async def config() -> dict:
    return get_navigator_config()


@router.post("/search")
async def search(req: NavigatorSearchRequest) -> dict:
    return navigator_search(req.query)
