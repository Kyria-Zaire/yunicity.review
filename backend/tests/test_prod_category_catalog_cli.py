"""CLI guards for production category catalog seed."""

from __future__ import annotations

import asyncio

import pytest
from app.core.config import get_settings
from app.db.seeds.__main__ import run


def test_categories_cli_refuses_demo_combo(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://unused")
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-at-least-32-characters-long!!")
    get_settings.cache_clear()
    with pytest.raises(SystemExit) as exc:
        asyncio.run(run(demo=True, pilot=False, neighborhoods=False, categories=True))
    assert exc.value.code == 2
    get_settings.cache_clear()


def test_categories_cli_refuses_neighborhoods_combo(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://unused")
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-at-least-32-characters-long!!")
    get_settings.cache_clear()
    with pytest.raises(SystemExit) as exc:
        asyncio.run(
            run(
                demo=False,
                pilot=False,
                neighborhoods=True,
                categories=True,
            )
        )
    assert exc.value.code == 2
    get_settings.cache_clear()
