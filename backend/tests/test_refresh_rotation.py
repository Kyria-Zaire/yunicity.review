"""Refresh token rotation and reuse detection tests."""

import pytest
from httpx import AsyncClient

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.mark.asyncio
async def test_refresh_success(auth_client: AsyncClient, register_payload: dict[str, str]) -> None:
    reg = await auth_client.post("/api/v1/auth/register", json=register_payload)
    assert reg.status_code == 201

    refresh = await auth_client.post("/api/v1/auth/refresh")
    assert refresh.status_code == 200
    data = refresh.json()
    assert data["access_token"]
    assert data["expires_in"] == 900


@pytest.mark.asyncio
async def test_refresh_rotates_token(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    await auth_client.post("/api/v1/auth/register", json=register_payload)
    first = await auth_client.post("/api/v1/auth/refresh")
    assert first.status_code == 200

    second = await auth_client.post("/api/v1/auth/refresh")
    assert second.status_code == 200
    assert second.json()["access_token"]


@pytest.mark.asyncio
async def test_reused_refresh_token_rejected(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    from app.core.config import get_settings

    await auth_client.post("/api/v1/auth/register", json=register_payload)
    settings = get_settings()
    old_cookie = auth_client.cookies.get(settings.refresh_cookie_name)
    assert old_cookie

    first_refresh = await auth_client.post("/api/v1/auth/refresh")
    assert first_refresh.status_code == 200

    auth_client.cookies.set(settings.refresh_cookie_name, old_cookie)
    reuse = await auth_client.post("/api/v1/auth/refresh")
    assert reuse.status_code == 401
    assert reuse.json()["code"] == "REFRESH_TOKEN_REUSE"


@pytest.mark.asyncio
async def test_mobile_refresh_via_body(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    reg = await auth_client.post(
        "/api/v1/auth/register",
        json=register_payload,
        headers={"X-Client-Platform": "mobile"},
    )
    assert reg.status_code == 201
    raw_refresh = reg.json()["refresh_token"]
    assert raw_refresh

    auth_client.cookies.clear()
    refresh = await auth_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": raw_refresh},
        headers={"X-Client-Platform": "mobile"},
    )
    assert refresh.status_code == 200
    assert refresh.json().get("refresh_token")


@pytest.mark.asyncio
async def test_refresh_token_raw_never_stored_in_db(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    from app.db.session import get_engine
    from app.models.refresh_token import RefreshToken
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    reg = await auth_client.post(
        "/api/v1/auth/register",
        json=register_payload,
        headers={"X-Client-Platform": "mobile"},
    )
    raw = reg.json()["refresh_token"]
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        tokens = (await session.execute(select(RefreshToken))).scalars().all()
    assert tokens
    for token in tokens:
        assert token.token_hash != raw
        assert len(token.token_hash) == 64
