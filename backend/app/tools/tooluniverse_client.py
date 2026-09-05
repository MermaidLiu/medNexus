"""ToolUniverse adapter with graceful fallback to mock mode."""

from __future__ import annotations

import logging
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


class ToolUniverseClient:
    """Wraps ToolUniverse Find/Call protocol; mock when unavailable."""

    def __init__(self) -> None:
        self._tu: Any = None
        self._available = False
        if settings.tooluniverse_enabled:
            self._try_load()

    def _try_load(self) -> None:
        try:
            from tooluniverse import ToolUniverse  # type: ignore[import-untyped]

            self._tu = ToolUniverse()
            self._tu.load_tools()
            self._available = True
            logger.info("ToolUniverse loaded successfully")
        except Exception as exc:
            logger.warning("ToolUniverse unavailable, using mock: %s", exc)
            self._available = False

    @property
    def is_available(self) -> bool:
        return self._available

    def find_tools(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        if not self._available or self._tu is None:
            return [
                {
                    "name": "conduct_literature_review_and_summarize",
                    "description": "Literature review (mock)",
                },
                {"name": "SemanticScholar_search", "description": "Semantic Scholar (mock)"},
            ]
        try:
            if hasattr(self._tu, "find_tools"):
                return self._tu.find_tools(query, limit=limit)  # type: ignore[no-any-return]
            return []
        except Exception as exc:
            logger.error("ToolUniverse find_tools failed: %s", exc)
            return []

    def run(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        if not self._available or self._tu is None:
            return {"status": "mock", "name": name, "arguments": arguments}
        try:
            result = self._tu.run({"name": name, "arguments": arguments})
            return result if isinstance(result, dict) else {"result": result}
        except Exception as exc:
            logger.error("ToolUniverse run failed for %s: %s", name, exc)
            return {"status": "error", "message": str(exc)}


# Singleton used across the app
tu_client = ToolUniverseClient()
