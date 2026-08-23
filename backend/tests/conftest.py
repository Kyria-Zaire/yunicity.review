pytest_plugins = [
    "tests.conftest_auth",
    "tests.conftest_rbac",
    "tests.conftest_local_video",
    "tests.conftest_migration",
]

import os  # noqa: E402
from collections.abc import AsyncGenerator, Iterator  # noqa: E402

import pytest  # noqa: E402
from app.core.config import get_settings  # noqa: E402
from app.db.session import dispose_db  # noqa: E402
from app.integrations.redis import close_redis  # noqa: E402
from app.main import create_app  # noqa: E402
from app.qa.guard import ensure_pytest_database_target  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402


def pytest_sessionstart(session: pytest.Session) -> None:
    """Fail-closed destructive-DB policy (C3-F0-T1-R1), enforced once before any test.

    C3.1-R1G : la seule cible destructive est une base JETABLE ``yunicity_test_*``
    atteinte via ``TEST_DATABASE_URL``. ``yunicity_qa`` est refusee — elle appartient
    a Playwright et a la revue manuelle :
    - ``TEST_DATABASE_URL`` set → validate through the QA guard (raises on any forbidden
      target or missing QA marker) and pin ``DATABASE_URL`` to it, so no fixture can reach
      a non-QA database.
    - ``TEST_DATABASE_URL`` absent but ``DATABASE_URL`` present → refuse: this is exactly the
      legacy path where a destructive fixture would drop the dev schema. No fallback.
    - neither set → unit-only run (e.g. backend-ci); DB fixtures skip individually.
    """
    test_url = os.environ.get("TEST_DATABASE_URL", "").strip()
    db_url = os.environ.get("DATABASE_URL", "").strip()
    if not test_url:
        if db_url:
            raise RuntimeError(
                "Destructive-test policy: DATABASE_URL is set without a validated "
                "TEST_DATABASE_URL. Point TEST_DATABASE_URL at the yunicity_qa target."
            )
        return
    ensure_pytest_database_target()
    os.environ["DATABASE_URL"] = test_url


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
