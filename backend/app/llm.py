"""OpenAI-compatible LLM client (supports relay/proxy base URL)."""

from __future__ import annotations

from openai import OpenAI

from app.config import settings


def get_llm_client() -> OpenAI:
    kwargs: dict = {"api_key": settings.openai_api_key}
    if settings.openai_base_url:
        kwargs["base_url"] = settings.openai_base_url.rstrip("/")
    return OpenAI(**kwargs)
