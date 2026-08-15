"""Guarded QA schema reset (C3-F0-T1).

Drops and rebuilds the ``public`` schema of the disposable ``yunicity_qa`` DB.
The guard is invoked *inside* this function (not only in the launcher), so no
import path can reach the destructive statements without passing it first.
"""

from __future__ import annotations

import logging

import asyncpg

from app.qa.guard import QaTarget, ensure_qa_destructive_target, resolve_test_database_url

logger = logging.getLogger(__name__)


def _asyncpg_dsn(url: str) -> str:
    """asyncpg wants a plain postgresql:// DSN, not the SQLAlchemy +asyncpg variant."""
    return url.replace("+asyncpg", "")


async def reset_qa_schema() -> QaTarget:
    """DROP + recreate ``public`` schema on the validated QA target. Fail-closed."""
    target = ensure_qa_destructive_target()
    dsn = _asyncpg_dsn(resolve_test_database_url())

    logger.warning("qa_reset_start", extra={"target": target.confirmation()})
    connection = await asyncpg.connect(dsn)
    try:
        await connection.execute("DROP SCHEMA IF EXISTS public CASCADE")
        await connection.execute("CREATE SCHEMA public")
        await connection.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    finally:
        await connection.close()
    logger.warning("qa_reset_done", extra={"target": target.confirmation()})
    return target
