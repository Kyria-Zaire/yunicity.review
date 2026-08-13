"""Search multi-type AsyncSession concurrency regression (C3-F0-T2).

Root cause: ``SearchService._search_all`` ran its per-type branches with
``asyncio.gather`` over a single shared ``AsyncSession``. ``AsyncSession`` is not
safe for concurrent use — under load this raises
``sqlalchemy.exc.IllegalStateChangeError``.

Reproducing the raw 500 is timing/load dependent (it fires reliably under uvicorn
with data, not under the ASGI test transport). This test instead targets the
defect deterministically: it asserts the session is never used concurrently during
a multi-type search. It FAILS before the fix (peak concurrency > 1, or the shared
session raises) and PASSES once the branches are serialized.
"""

from __future__ import annotations

import asyncio
import os
import uuid
from collections.abc import AsyncGenerator
from typing import Any

import pytest
from app.core.search_constants import SearchPeriod
from app.db.base import Base
from app.db.session import dispose_db, get_engine, init_db
from app.schemas.search import SearchResponse
from app.services.search_service import SearchService
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def search_session(monkeypatch: pytest.MonkeyPatch) -> AsyncGenerator[AsyncSession, None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip search concurrency test")
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-at-least-32-characters-long!!")

    from app.core.config import get_settings

    get_settings.cache_clear()
    init_db(get_settings())
    engine = get_engine()
    assert engine is not None
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session

    await dispose_db()
    get_settings.cache_clear()


async def test_search_all_never_uses_session_concurrently(
    search_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The multi-type ('all') path must serialize DB access on the shared session."""
    active = 0
    peak = 0
    original_execute: Any = search_session.execute

    async def _tracked_execute(*args: Any, **kwargs: Any) -> Any:
        nonlocal active, peak
        active += 1
        peak = max(peak, active)
        # Yield control so any concurrent branch would be observed here.
        await asyncio.sleep(0)
        try:
            return await original_execute(*args, **kwargs)
        finally:
            active -= 1

    monkeypatch.setattr(search_session, "execute", _tracked_execute)

    response = await SearchService(search_session).search(
        raw_query=f"reims{uuid.uuid4().hex[:6]}",
        city="Reims",
        neighborhood_slug=None,
        entity_type="all",
        period=SearchPeriod.UPCOMING,
        page=1,
        limit=10,
        viewer=None,
    )

    assert isinstance(response, SearchResponse)
    assert response.type_filter == "all"
    assert peak == 1, f"session used concurrently (peak={peak}) — branches not serialized"
