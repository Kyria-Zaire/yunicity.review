"""PASSPORT-PRESENCE-01 (01A) — 20261126_0068 removes legacy server defaults.

Historical scenario: ``users.is_system_account`` and ``users.force_password_reset``
already exist, with ``DEFAULT false``, before 20260608_0040 and 20260614_0052 run
(columns created by ``create_all`` from the former model). Both migrations then return
early and leave the defaults in place. This test proves the drift is real at 0067, then
that 0068 removes it without touching any value, that the downgrade keeps the canonical
state, that the upgrade is replayable, and that a fresh database ends in the same state.
"""

from __future__ import annotations

import asyncio
import uuid
from collections.abc import Awaitable, Callable
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from app.core.config import get_settings
from app.db.session import dispose_db, get_engine, init_db
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

pytestmark = pytest.mark.integration

BACKEND_ROOT = Path(__file__).resolve().parents[1]
BEFORE_0040 = "20260607_0039"
PRESENCE = "20261126_0067"
CORRECTIVE = "20261126_0068"
FLAGS = ("is_system_account", "force_password_reset")

_DEFAULTS_SQL = (
    "SELECT column_name, column_default FROM information_schema.columns "
    "WHERE table_schema = 'public' AND table_name = 'users' "
    "AND column_name = ANY(:names)"
)


def _config() -> Config:
    cfg = Config(str(BACKEND_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    return cfg


def _run(coro_factory: Callable[[], Awaitable[object]]) -> object:
    async def _phase() -> object:
        init_db(get_settings())
        try:
            return await coro_factory()
        finally:
            await dispose_db()

    return asyncio.run(_phase())


async def _execute(sql: str, params: dict[str, object] | None = None) -> None:
    engine = get_engine()
    assert engine is not None
    async with engine.begin() as connection:
        await connection.execute(text(sql), params or {})


async def _scalar(sql: str, params: dict[str, object] | None = None) -> object:
    engine = get_engine()
    assert engine is not None
    async with engine.connect() as connection:
        return (await connection.execute(text(sql), params or {})).scalar_one()


async def _defaults() -> dict[str, str | None]:
    engine = get_engine()
    assert engine is not None
    async with engine.connect() as connection:
        rows = await connection.execute(text(_DEFAULTS_SQL), {"names": list(FLAGS)})
        return {row[0]: row[1] for row in rows.fetchall()}


async def _insert_user(user_id: uuid.UUID, *, omit: str | None = None) -> None:
    """``omit`` relies on the server default for that flag (legacy behaviour)."""
    columns = ["id", "email", "hashed_password", "full_name", *FLAGS]
    values = [":id", ":email", "'hashed'", "'Legacy User'", "false", "false"]
    if omit is not None:
        index = columns.index(omit)
        del columns[index]
        del values[index]
    await _execute(
        f"INSERT INTO users ({', '.join(columns)}) VALUES ({', '.join(values)})",
        {"id": user_id, "email": f"legacy-{user_id.hex[:12]}@example.com"},
    )


def test_0068_removes_defaults_left_by_columns_predating_their_migration(
    migration_env: None,
) -> None:
    cfg = _config()
    legacy_user = uuid.uuid4()
    command.upgrade(cfg, BEFORE_0040)

    async def _simulate_history() -> None:
        # Both columns exist before 0040 / 0052, with the former model's server default.
        for column in FLAGS:
            await _execute(f"ALTER TABLE users ADD COLUMN {column} BOOLEAN NOT NULL DEFAULT false")
        await _execute(
            "INSERT INTO users (id, email, hashed_password, full_name) "
            "VALUES (:id, 'legacy-history@example.com', 'hashed', 'Legacy User')",
            {"id": legacy_user},
        )

    _run(_simulate_history)

    command.upgrade(cfg, PRESENCE)

    async def _drift_is_real() -> None:
        # 0040 and 0052 returned early: the legacy defaults survived. This is the drift.
        assert await _defaults() == {column: "false" for column in FLAGS}

    _run(_drift_is_real)

    command.upgrade(cfg, CORRECTIVE)

    async def _defaults_removed() -> None:
        assert await _defaults() == {column: None for column in FLAGS}
        # No value touched.
        for column in FLAGS:
            assert (
                await _scalar(f"SELECT {column} FROM users WHERE id = :id", {"id": legacy_user})
                is False
            )
        assert await _scalar("SELECT count(*) FROM users") == 1
        # Without a default, a raw insert must now provide each column.
        for column in FLAGS:
            with pytest.raises(IntegrityError):
                await _insert_user(uuid.uuid4(), omit=column)
        await _insert_user(uuid.uuid4())

    _run(_defaults_removed)

    async def _canonical_after_downgrade() -> None:
        assert await _defaults() == {column: None for column in FLAGS}
        assert await _scalar("SELECT count(*) FROM users") == 2

    # Downgrade is a documented no-op: the canonical 0067 schema has no default either.
    command.downgrade(cfg, PRESENCE)
    _run(_canonical_after_downgrade)
    # Re-applying is idempotent (DROP DEFAULT without a default is a no-op).
    command.upgrade(cfg, CORRECTIVE)
    _run(_canonical_after_downgrade)


def test_fresh_database_reaches_the_same_state(migration_env: None) -> None:
    command.upgrade(_config(), "head")

    async def _no_defaults() -> None:
        assert await _defaults() == {column: None for column in FLAGS}

    _run(_no_defaults)
