"""PASSPORT-PRESENCE-01 (01A) — migration 20261126_0067 played for real with Alembic.

The rest of the suite builds its schema with ``Base.metadata.create_all``: this test runs
the migration on an empty database (``migration_env``) and checks, on the MIGRATED schema:

- existing users receive ``is_test = false`` without backfill;
- the database itself enforces statuses, the explicit window, uniqueness, the rejected
  reason and the ``RESTRICT`` foreign keys;
- index and constraint names match the ORM models (no drift between the two);
- the downgrade removes the seven tables and the column without losing a user.
"""

from __future__ import annotations

import asyncio
import uuid
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import dispose_db, get_engine, init_db
from sqlalchemy import CheckConstraint, Index, UniqueConstraint, text
from sqlalchemy.exc import IntegrityError

pytestmark = pytest.mark.integration

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REVISION_BEFORE = "20261103_0066"
REVISION = "20261126_0067"
OPENS = datetime(2026, 12, 1, 9, 0, tzinfo=UTC)
CLOSES = datetime(2026, 12, 1, 11, 0, tzinfo=UTC)
PRESENCE_TABLES = (
    "presence_admin_actions",
    "presence_agent_assignments",
    "presence_campaigns",
    "presence_operations",
    "presence_records",
    "presence_registrations",
    "presence_sessions",
)


def _config() -> Config:
    cfg = Config(str(BACKEND_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    return cfg


def _run(coro_factory: Callable[[], Awaitable[object]]) -> object:
    """Open the engine, run, dispose: Alembic runs between two phases."""

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


async def _names(sql: str) -> set[str]:
    engine = get_engine()
    assert engine is not None
    async with engine.connect() as connection:
        rows = await connection.execute(text(sql), {"tables": list(PRESENCE_TABLES)})
        return {row[0] for row in rows.fetchall()}


async def _insert_user(user_id: uuid.UUID) -> None:
    await _execute(
        # is_system_account / force_password_reset are explicit: in the MIGRATED schema
        # is_system_account has no server default (pre-existing drift vs. the model).
        "INSERT INTO users (id, email, hashed_password, full_name, is_system_account, "
        "force_password_reset) VALUES (:id, :email, 'hashed', 'Migration User', false, false)",
        {"id": user_id, "email": f"migration-{user_id.hex[:12]}@example.com"},
    )


def _model_names() -> tuple[set[str], set[str]]:
    indexes: set[str] = set()
    constraints: set[str] = set()
    for name in PRESENCE_TABLES:
        table = Base.metadata.tables[name]
        indexes.update(str(index.name) for index in table.indexes if isinstance(index, Index))
        constraints.update(
            str(c.name)
            for c in table.constraints
            if isinstance(c, UniqueConstraint | CheckConstraint)
        )
    return indexes, constraints


def test_migration_0067_upgrade_downgrade_on_real_schema(migration_env: None) -> None:
    cfg = _config()
    existing_user = uuid.uuid4()
    other_user = uuid.uuid4()
    organization_id = uuid.uuid4()

    command.upgrade(cfg, REVISION_BEFORE)

    async def _existing_rows() -> None:
        await _insert_user(existing_user)
        await _insert_user(other_user)

    _run(_existing_rows)

    command.upgrade(cfg, REVISION)

    async def _check_upgrade() -> None:
        tables = await _names(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' AND table_name = ANY(:tables)"
        )
        assert tables == set(PRESENCE_TABLES)
        assert await _scalar("SELECT count(*) FROM users WHERE is_test IS FALSE") == 2

        # Index and constraint names: the migration matches the models exactly.
        model_indexes, model_constraints = _model_names()
        db_indexes = await _names(
            "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' "
            "AND tablename = ANY(:tables) AND indexname LIKE 'ix_%'"
        )
        db_constraints = await _names(
            "SELECT conname FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid "
            "WHERE t.relname = ANY(:tables) AND c.contype IN ('u', 'c')"
        )
        assert db_indexes == model_indexes
        assert db_constraints == model_constraints

        await _execute(
            "INSERT INTO organizations (id, slug, name, type, city) "
            "VALUES (:id, :slug, 'Org migration', 'commerce', 'Reims')",
            {"id": organization_id, "slug": f"org-{organization_id.hex[:8]}"},
        )

        campaign_sql = (
            "INSERT INTO presence_campaigns (id, organization_id, city, title, status, "
            "presence_opens_at, presence_closes_at) VALUES (:id, :org, 'Reims', 'T', :status, "
            ":opens, :closes)"
        )
        campaign_id = uuid.uuid4()
        await _execute(
            campaign_sql,
            {
                "id": campaign_id,
                "org": organization_id,
                "status": "draft",
                "opens": OPENS,
                "closes": CLOSES,
            },
        )
        assert (
            await _scalar(
                "SELECT is_test FROM presence_campaigns WHERE id = :id", {"id": campaign_id}
            )
            is False
        )
        for status, closes in (("draft", OPENS), ("live", CLOSES)):
            with pytest.raises(IntegrityError):
                await _execute(
                    campaign_sql,
                    {
                        "id": uuid.uuid4(),
                        "org": organization_id,
                        "status": status,
                        "opens": OPENS,
                        "closes": closes,
                    },
                )

        registration_sql = (
            "INSERT INTO presence_registrations (id, campaign_id, user_id, status) "
            "VALUES (:id, :campaign, :user, :status)"
        )
        registration_id = uuid.uuid4()
        await _execute(
            registration_sql,
            {
                "id": registration_id,
                "campaign": campaign_id,
                "user": existing_user,
                "status": "confirmed",
            },
        )
        for status in ("confirmed", "pending"):
            with pytest.raises(IntegrityError):  # duplicate pair, then unknown status
                await _execute(
                    registration_sql,
                    {
                        "id": uuid.uuid4(),
                        "campaign": campaign_id,
                        "user": existing_user if status == "confirmed" else other_user,
                        "status": status,
                    },
                )

        record_sql = (
            "INSERT INTO presence_records (id, campaign_id, participant_user_id, "
            "registration_id, agent_user_id, source) "
            "VALUES (:id, :campaign, :user, :registration, :agent, 'scan')"
        )
        record_params: dict[str, object] = {
            "campaign": campaign_id,
            "user": existing_user,
            "registration": registration_id,
            "agent": other_user,
        }
        await _execute(record_sql, {"id": uuid.uuid4(), **record_params})
        with pytest.raises(IntegrityError):  # one presence per (campaign, participant)
            await _execute(record_sql, {"id": uuid.uuid4(), **record_params})

        operation_sql = (
            "INSERT INTO presence_operations (id, campaign_id, agent_user_id, "
            "client_operation_id, request_fingerprint, source, result, reason_code) "
            "VALUES (:id, :campaign, :agent, :op, :fp, 'scan', :result, :reason)"
        )
        client_operation_id = uuid.uuid4()
        await _execute(
            operation_sql,
            {
                "id": uuid.uuid4(),
                "campaign": campaign_id,
                "agent": other_user,
                "op": client_operation_id,
                "fp": "a" * 64,
                "result": "rejected",
                "reason": "PRESENCE_CREDENTIAL_EXPIRED",
            },
        )
        bad_operations: list[dict[str, object]] = [
            {"op": client_operation_id, "result": "posted", "reason": None},  # same key
            {"op": uuid.uuid4(), "result": "rejected", "reason": None},  # reason required
            {"op": uuid.uuid4(), "result": "uncertain", "reason": None},  # client-only state
        ]
        for bad in bad_operations:
            with pytest.raises(IntegrityError):
                await _execute(
                    operation_sql,
                    {
                        "id": uuid.uuid4(),
                        "campaign": campaign_id,
                        "agent": other_user,
                        "fp": "b" * 64,
                        **bad,
                    },
                )

        # RESTRICT: an organization or a campaign holding presences cannot vanish.
        with pytest.raises(IntegrityError):
            await _execute("DELETE FROM organizations WHERE id = :id", {"id": organization_id})
        with pytest.raises(IntegrityError):
            await _execute("DELETE FROM presence_campaigns WHERE id = :id", {"id": campaign_id})

        # Deleting the agent keeps the audit row (SET NULL), never erases it.
        await _execute("DELETE FROM users WHERE id = :id", {"id": other_user})
        assert (
            await _scalar("SELECT count(*) FROM presence_operations WHERE agent_user_id IS NULL")
            == 1
        )

    _run(_check_upgrade)

    command.downgrade(cfg, REVISION_BEFORE)

    async def _check_downgrade() -> None:
        remaining = await _names(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' AND table_name = ANY(:tables)"
        )
        assert remaining == set()
        assert (
            await _scalar(
                "SELECT count(*) FROM information_schema.columns "
                "WHERE table_name = 'users' AND column_name = 'is_test'"
            )
            == 0
        )
        assert await _scalar("SELECT count(*) FROM users") == 1

    _run(_check_downgrade)

    # Re-upgrade after downgrade: the migration is replayable.
    command.upgrade(cfg, REVISION)
