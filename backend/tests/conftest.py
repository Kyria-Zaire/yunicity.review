pytest_plugins = ["tests.conftest_auth", "tests.conftest_rbac"]

from collections.abc import AsyncGenerator, Iterator  # noqa: E402

import pytest  # noqa: E402
from app.core.config import get_settings  # noqa: E402
from app.db.session import dispose_db  # noqa: E402
from app.integrations.redis import close_redis  # noqa: E402
from app.main import create_app  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture(autouse=True)
async def reset_async_runtime_state() -> AsyncGenerator[None, None]:
    """Prevent asyncpg/SQLAlchemy engines from leaking across asyncio loops."""
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
