"""Alembic migration tests for user_profiles backfill."""

from __future__ import annotations

import asyncio
import os
import uuid
from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import dispose_db, get_engine, get_session_factory, init_db
from sqlalchemy import text

pytestmark = pytest.mark.integration

BACKEND_ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
def migration_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip migration tests")
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-at-least-32-characters-long!!")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


async def _rewind_to_revision_0001() -> None:
    engine = get_engine()
    assert engine is not None
    async with engine.begin() as connection:
        await connection.execute(text("DROP TABLE IF EXISTS user_profiles CASCADE"))
        await connection.execute(text("DELETE FROM alembic_version"))
        await connection.execute(
            text("INSERT INTO alembic_version (version_num) VALUES ('20260517_0001')")
        )


async def _insert_legacy_user(user_id: uuid.UUID, email: str) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        await session.execute(
            text(
                """
                INSERT INTO users (
                    id, email, hashed_password, full_name, city,
                    is_active, is_verified, created_at, updated_at
                ) VALUES (
                    :id, :email, :hashed_password, :full_name, :city,
                    true, false, now(), now()
                )
                """
            ),
            {
                "id": user_id,
                "email": email,
                "hashed_password": hash_password("StrongPassword1!"),
                "full_name": "Legacy User",
                "city": "Reims",
            },
        )
        await session.commit()


async def _assert_profile(user_id: uuid.UUID) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        result = await session.execute(
            text(
                "SELECT username, display_name, city FROM user_profiles WHERE user_id = :uid"
            ),
            {"uid": user_id},
        )
        row = result.one()
        assert row.username
        assert row.display_name == "Legacy User"
        assert row.city == "Reims"


def test_migration_backfill_creates_profiles(migration_env: None) -> None:
    settings = get_settings()
    init_db(settings)

    cfg = Config(str(BACKEND_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))

    command.upgrade(cfg, "20260517_0001")

    user_id = uuid.uuid4()
    email = f"legacy.{user_id.hex[:8]}@example.com"

    async def _prepare() -> None:
        await _rewind_to_revision_0001()
        await _insert_legacy_user(user_id, email)
        await dispose_db()

    asyncio.run(_prepare())

    command.upgrade(cfg, "20260518_0002")

    async def _verify() -> None:
        init_db(get_settings())
        await _assert_profile(user_id)
        await dispose_db()

    asyncio.run(_verify())
