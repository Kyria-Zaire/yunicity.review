"""Alembic migration tests for organizations foundation."""

from __future__ import annotations

import asyncio
import os
from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from app.core.config import get_settings
from app.db.session import dispose_db, get_engine, init_db
from sqlalchemy import text

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BACKEND_ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
def migration_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip organization migration tests")
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-at-least-32-characters-long!!")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


async def _reset_to_revision_0002() -> None:
    engine = get_engine()
    assert engine is not None
    async with engine.begin() as connection:
        await connection.execute(text("DROP TABLE IF EXISTS organization_verifications CASCADE"))
        await connection.execute(text("DROP TABLE IF EXISTS organization_members CASCADE"))
        await connection.execute(text("DROP TABLE IF EXISTS organizations CASCADE"))
        await connection.execute(text("DELETE FROM alembic_version"))
        await connection.execute(
            text("INSERT INTO alembic_version (version_num) VALUES ('20260518_0002')")
        )


async def _assert_org_tables_exist() -> None:
    engine = get_engine()
    assert engine is not None
    async with engine.connect() as connection:
        result = await connection.execute(
            text(
                """
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name IN (
                    'organizations',
                    'organization_members',
                    'organization_verifications'
                  )
                ORDER BY table_name
                """
            )
        )
        names = [row[0] for row in result.fetchall()]
        assert names == [
            "organization_members",
            "organization_verifications",
            "organizations",
        ]


async def _assert_org_tables_dropped() -> None:
    engine = get_engine()
    assert engine is not None
    async with engine.connect() as connection:
        result = await connection.execute(
            text(
                """
                SELECT COUNT(*) FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'organizations'
                """
            )
        )
        assert result.scalar_one() == 0


@pytest.mark.asyncio
async def test_migration_upgrade_and_downgrade(migration_env: None) -> None:
    settings = get_settings()
    init_db(settings)

    cfg = Config(str(BACKEND_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))

    await asyncio.to_thread(command.upgrade, cfg, "20260518_0002")
    await _reset_to_revision_0002()
    await asyncio.to_thread(command.upgrade, cfg, "20260518_0003")
    await _assert_org_tables_exist()

    await asyncio.to_thread(command.downgrade, cfg, "20260518_0002")
    await _assert_org_tables_dropped()

    await dispose_db()
