pytest_plugins = ["tests.conftest_auth", "tests.conftest_rbac"]

from collections.abc import AsyncGenerator, Iterator  # noqa: E402

import pytest  # noqa: E402
from app.core.config import get_settings  # noqa: E402
from app.db.session import dispose_db  # noqa: E402
from app.integrations.redis import close_redis  # noqa: E402
from app.main import create_app  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402


@pytest.fixture(autouse=True)
async def reset_async_runtime_state() -> AsyncGenerator[None, None]:
    """Isolate each test: flush Redis (rate-limit counters etc.) up front with a
    dedicated connection — the shared global client is torn down by the DB fixtures
    before this fixture's teardown runs, so flushing here on setup is what actually
    clears cross-test state. Dispose engine/redis after so nothing leaks across loops.
    """
    settings = get_settings()
    if settings.redis_url:
        from redis.asyncio import Redis

        flush_client = Redis.from_url(settings.redis_url, decode_responses=True)
        try:
            await flush_client.flushdb()
        finally:
            await flush_client.aclose()
    yield
    await close_redis()
    await dispose_db()
    get_settings.cache_clear()


@pytest.fixture
def app() -> Iterator[FastAPI]:
    get_settings.cache_clear()
    application = create_app()
    yield application
    get_settings.cache_clear()


@pytest.fixture
async def client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
