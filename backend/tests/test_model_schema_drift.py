"""Model / migrated-schema parity (PASSPORT-PRESENCE-01, 01A).

The suite builds its schema with ``Base.metadata.create_all``; deployments build theirs
with Alembic. Any difference between the two is invisible to the rest of the suite. This
test migrates an empty database to ``head`` and runs Alembic's own comparison
(autogenerate) against the ORM metadata — columns, types, nullability, server defaults,
indexes and unique constraints — for the tables this lot owns or changes.

Scope is deliberately limited to ``users`` and the ``presence_*`` tables: other tables
carry known, unrelated differences (e.g. PostGIS types) that belong to their own tickets.
"""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import dispose_db, get_engine, init_db
from sqlalchemy import Connection, text

pytestmark = pytest.mark.integration

BACKEND_ROOT = Path(__file__).resolve().parents[1]
PRESENCE_REVISION = "20261126_0067"
FLAGS = ("is_system_account", "force_password_reset")
CHECKED_TABLES = frozenset(
    {
        "users",
        "presence_admin_actions",
        "presence_agent_assignments",
        "presence_campaigns",
        "presence_operations",
        "presence_records",
        "presence_registrations",
        "presence_sessions",
    }
)


def _config() -> Config:
    cfg = Config(str(BACKEND_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    return cfg


def _include_object(
    obj: Any, name: str | None, type_: str, reflected: bool, compare_to: Any
) -> bool:
    _ = (name, reflected, compare_to)
    if type_ == "table":
        return name in CHECKED_TABLES
    table = getattr(obj, "table", None)
    return table is None or table.name in CHECKED_TABLES


def _diff(connection: Connection) -> list[Any]:
    context = MigrationContext.configure(
        connection,
        opts={
            "compare_type": True,
            "compare_server_default": True,
            "include_object": _include_object,
        },
    )
    return list(compare_metadata(context, Base.metadata))


def test_users_and_presence_tables_match_the_models(migration_env: None) -> None:
    command.upgrade(_config(), "head")

    async def _compare() -> list[Any]:
        init_db(get_settings())
        try:
            engine = get_engine()
            assert engine is not None
            async with engine.connect() as connection:
                return await connection.run_sync(_diff)
        finally:
            await dispose_db()

    differences = asyncio.run(_compare())
    assert differences == [], "\n".join(repr(item) for item in differences)


UsersSnapshot = dict[str, Any]


async def _users_snapshot() -> UsersSnapshot:
    engine = get_engine()
    assert engine is not None
    async with engine.connect() as connection:
        indexes = await connection.execute(
            text(
                "SELECT indexname, indexdef FROM pg_indexes "
                "WHERE schemaname = 'public' AND tablename = 'users' ORDER BY indexname"
            )
        )
        constraints = await connection.execute(
            text(
                # ``contype`` is PostgreSQL's one-byte "char": asyncpg returns it as bytes.
                "SELECT conname, contype::text, pg_get_constraintdef(oid) FROM pg_constraint "
                "WHERE conrelid = 'public.users'::regclass ORDER BY conname"
            )
        )
        defaults = await connection.execute(
            text(
                "SELECT column_name, column_default FROM information_schema.columns "
                "WHERE table_schema = 'public' AND table_name = 'users' "
                "AND column_name = ANY(:names) ORDER BY column_name"
            ),
            {"names": list(FLAGS)},
        )
        return {
            "indexes": [tuple(row) for row in indexes.fetchall()],
            "constraints": [tuple(row) for row in constraints.fetchall()],
            "defaults": dict(tuple(row) for row in defaults.fetchall()),
        }


def _snapshot() -> UsersSnapshot:
    async def _phase() -> UsersSnapshot:
        init_db(get_settings())
        try:
            return await _users_snapshot()
        finally:
            await dispose_db()

    return asyncio.run(_phase())


def _create_all_snapshot() -> UsersSnapshot:
    """Fresh schema built by the ORM models only (what the test suite uses)."""

    async def _phase() -> UsersSnapshot:
        init_db(get_settings())
        try:
            engine = get_engine()
            assert engine is not None
            async with engine.begin() as connection:
                await connection.execute(text("DROP SCHEMA public CASCADE"))
                await connection.execute(text("CREATE SCHEMA public"))
                await connection.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
                await connection.run_sync(Base.metadata.create_all)
            return await _users_snapshot()
        finally:
            await dispose_db()

    return asyncio.run(_phase())


def test_users_converges_without_creating_anything(migration_env: None) -> None:
    """The four 01A convergence points, each proven on the real schemas.

    - ``is_system_account`` and ``force_password_reset``: no server default;
    - ``ix_users_deletion_requested_at`` (partial) and ``uq_users_email``: present exactly
      once, already created by their historical migrations — 0068 creates nothing, and the
      model, now declaring them, makes ``create_all`` create nothing more either.
    """
    cfg = _config()
    command.upgrade(cfg, PRESENCE_REVISION)
    at_0067 = _snapshot()
    command.upgrade(cfg, "head")
    at_head = _snapshot()

    # 0068 creates and drops no index or constraint.
    assert at_head["indexes"] == at_0067["indexes"]
    assert at_head["constraints"] == at_0067["constraints"]

    assert at_head["defaults"] == {flag: None for flag in FLAGS}

    deletion_indexes = [i for i in at_head["indexes"] if i[0] == "ix_users_deletion_requested_at"]
    assert len(deletion_indexes) == 1
    assert "WHERE (deletion_requested_at IS NOT NULL)" in deletion_indexes[0][1]

    email_constraints = [c for c in at_head["constraints"] if c[0] == "uq_users_email"]
    assert email_constraints == [("uq_users_email", "u", "UNIQUE (email)")]
    email_indexes = [i for i in at_head["indexes"] if "(email)" in i[1]]
    # The unique constraint's own index plus the historical unique index ix_users_email.
    assert sorted(i[0] for i in email_indexes) == ["ix_users_email", "uq_users_email"]

    # The model reproduces exactly the migrated table: nothing missing, nothing extra.
    assert _create_all_snapshot() == at_head
