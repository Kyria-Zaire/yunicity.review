"""Shared fixture for Alembic migration tests (CI-CLEANUP-05)."""

from __future__ import annotations

import asyncio
from collections.abc import Iterator

import pytest
from app.core.config import get_settings

from tests.qa_support import configure_destructive_qa_db

_TEST_JWT_SECRET = "test-secret-key-at-least-32-characters-long!!"


async def _reset_schema_to_empty(database_url: str) -> None:
    import asyncpg

    connection = await asyncpg.connect(database_url.replace("+asyncpg", ""))
    try:
        await connection.execute("DROP SCHEMA public CASCADE")
        await connection.execute("CREATE SCHEMA public")
        await connection.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    finally:
        await connection.close()


@pytest.fixture
def migration_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Give each Alembic migration test an empty database to build from.

    The rest of the suite creates its schema with ``Base.metadata.create_all``, which
    leaves every application table in place but no ``alembic_version`` row. Running
    ``alembic upgrade`` against that state fails — "relation users already exists" for
    tests that upgrade from base, "relation alembic_version does not exist" for tests
    that rewind to a revision. Dropping the schema first lets Alembic build it from base,
    so these tests actually exercise the migrations instead of failing during setup.

    pytest runs sequentially here (no xdist installed, no ``-n``), so no other test can be
    mid-flight against this database while the schema is dropped.
    """
    # Fail-closed: guard runs before the destructive reset; QA target only (C3-F0-T1-R1).
    database_url = configure_destructive_qa_db(monkeypatch)
    monkeypatch.setenv("JWT_SECRET_KEY", _TEST_JWT_SECRET)
    get_settings.cache_clear()
    asyncio.run(_reset_schema_to_empty(database_url))
    yield
    get_settings.cache_clear()
