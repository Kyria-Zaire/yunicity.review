"""Alembic migration tests for passport foundation."""

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

PASSPORT_TABLES = (
    "passport_offer_redemptions",
    "partner_offers",
    "passport_stamps",
    "passports",
    "passport_tiers",
)


@pytest.fixture
def migration_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip passport migration tests")
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-at-least-32-characters-long!!")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


async def _reset_to_revision_0004() -> None:
    engine = get_engine()
    assert engine is not None
    async with engine.begin() as connection:
        for table in PASSPORT_TABLES:
            await connection.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
        await connection.execute(text("DELETE FROM alembic_version"))
        await connection.execute(
            text("INSERT INTO alembic_version (version_num) VALUES ('20260518_0004')")
        )


async def _assert_passport_tables_exist() -> None:
    engine = get_engine()
    assert engine is not None
    async with engine.connect() as connection:
        result = await connection.execute(
            text(
                """
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = ANY(:names)
                ORDER BY table_name
                """
            ),
            {"names": list(PASSPORT_TABLES)},
        )
        names = [row[0] for row in result.fetchall()]
        assert names == sorted(PASSPORT_TABLES)


async def _assert_passport_tables_dropped() -> None:
    engine = get_engine()
    assert engine is not None
    async with engine.connect() as connection:
        result = await connection.execute(
            text(
                """
                SELECT COUNT(*) FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = 'passports'
                """
            )
        )
        assert result.scalar_one() == 0


async def _assert_tier_seed_present() -> None:
    engine = get_engine()
    assert engine is not None
    async with engine.connect() as connection:
        result = await connection.execute(
            text("SELECT code FROM passport_tiers ORDER BY display_order")
        )
        codes = [row[0] for row in result.fetchall()]
        assert codes == [
            "basic",
            "silver",
            "gold",
            "neo_arrivant",
            "press_creator",
            "business",
        ]


@pytest.mark.asyncio
async def test_migration_upgrade_and_downgrade(migration_env: None) -> None:
    settings = get_settings()
    init_db(settings)

    cfg = Config(str(BACKEND_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))

    await _reset_to_revision_0004()
    await asyncio.to_thread(command.upgrade, cfg, "20260519_0005")
    await _assert_passport_tables_exist()
    await _assert_tier_seed_present()

    await asyncio.to_thread(command.downgrade, cfg, "20260518_0004")
    await _assert_passport_tables_dropped()

    await dispose_db()
