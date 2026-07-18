import asyncio
import logging
from logging.config import fileConfig

import app.models  # noqa: F401 — register models on Base.metadata
from alembic import context
from app.core.config import get_settings
from app.db.base import Base
from sqlalchemy import pool, text
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncConnection, async_engine_from_config

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

logger = logging.getLogger("alembic.env")

# Serialises concurrent `alembic upgrade head` runs: several replicas booting at once, or
# a manual run racing a deployment. Alembic takes no lock of its own, so two upgrades race
# on alembic_version — Postgres keeps the data consistent but one side fails the deploy,
# and a multi-revision chain fails halfway through.
#
# Session-scoped (not pg_advisory_xact_lock) so it spans every revision whatever
# transaction strategy Alembic uses. It therefore survives the commit below, and must be
# released explicitly — Postgres also drops it if the connection dies.
#
# TODO(debt): session-level advisory locks need a real session. They are unreliable
# through a transaction-pooling proxy; revisit if PgBouncer lands (documented infra debt).
#
# The value is arbitrary but must never change: it is the shared rendez-vous point between
# processes, so a different key would defeat the lock entirely.
_MIGRATION_LOCK_KEY = 815_247_001


def get_url() -> str:
    settings = get_settings()
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is required to run Alembic migrations")
    return settings.database_url


def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def _acquire_migration_lock(connection: AsyncConnection) -> None:
    """Block until this process owns the migration lock.

    Committing right after is what lets ``do_run_migrations`` open its own transaction:
    ``execute`` autobegins one in SQLAlchemy 2.0, and Alembic's ``begin_transaction``
    would then fail. The lock is session-scoped, so the commit does not release it.
    """
    await connection.execute(text("SELECT pg_advisory_lock(:key)"), {"key": _MIGRATION_LOCK_KEY})
    await connection.commit()


async def _release_migration_lock(connection: AsyncConnection) -> None:
    """Release the migration lock, never masking a migration failure.

    Runs in a ``finally``, so it may be reached with the connection in a failed
    transaction. Rolling back first clears that state; if the release still fails, the
    lock is dropped anyway when the connection closes moments later.
    """
    try:
        await connection.rollback()
        await connection.execute(
            text("SELECT pg_advisory_unlock(:key)"), {"key": _MIGRATION_LOCK_KEY}
        )
        await connection.commit()
    except Exception:  # noqa: BLE001 — see docstring: closing the connection releases it
        logger.warning("Could not release the migration advisory lock explicitly", exc_info=True)


async def run_async_migrations() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await _acquire_migration_lock(connection)
        try:
            await connection.run_sync(do_run_migrations)
        finally:
            await _release_migration_lock(connection)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
