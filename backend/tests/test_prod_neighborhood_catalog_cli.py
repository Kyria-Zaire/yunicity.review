"""CLI guards for production neighborhood catalog seed."""

from __future__ import annotations

import asyncio

import pytest
from app.core.config import get_settings
from app.db.seeds.__main__ import run


def test_neighborhoods_cli_refuses_demo_combo(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://unused")
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-at-least-32-characters-long!!")
    get_settings.cache_clear()
    with pytest.raises(SystemExit) as exc:
        asyncio.run(run(demo=True, pilot=False, neighborhoods=True, categories=False, cultural_places=False))
    assert exc.value.code == 2
    get_settings.cache_clear()
