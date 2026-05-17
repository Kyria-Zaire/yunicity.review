"""Auth integration fixtures (PostgreSQL + RBAC seed)."""

from __future__ import annotations

import os
from collections.abc import AsyncGenerator, Iterator

import pytest
from app.core.config import get_settings
from app.db.base import Base
from app.db.seeds.auth_rbac import seed_auth_rbac
from app.db.session import dispose_db, get_engine, get_session_factory, init_db
from app.integrations.redis import close_redis, init_redis
from app.main import create_app
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

_TEST_JWT_SECRET = "test-secret-key-at-least-32-characters-long!!"


def _database_url() -> str | None:
    return os.environ.get("DATABASE_URL")


@pytest.fixture
def auth_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    database_url = _database_url()
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip auth integration tests")
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("JWT_SECRET_KEY", _TEST_JWT_SECRET)
    monkeypatch.setenv("REFRESH_COOKIE_SECURE", "false")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
async def auth_client(auth_env: None) -> AsyncGenerator[AsyncClient, None]:
    settings = get_settings()
    init_db(settings)
    await init_redis(settings)

    engine = get_engine()
    assert engine is not None
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)

    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        await seed_auth_rbac(session)
        await session.commit()

    application: FastAPI = create_app()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    await close_redis()
    await dispose_db()


@pytest.fixture
def register_payload() -> dict[str, str]:
    return {
        "email": "citoyen@example.com",
        "password": "StrongPassword1!",
        "full_name": "Kyria Mambu",
        "city": "Reims",
    }
