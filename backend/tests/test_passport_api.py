"""Passport API integration tests."""

from __future__ import annotations

import pytest
from app.db.session import get_engine
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_passport import (
    activate_passport,
    auth_header,
    create_unverified_org_with_active_offer,
    create_verified_org_with_offer,
    register_user,
)

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.mark.asyncio
async def test_list_tiers_is_public(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/passport/tiers")
    assert response.status_code == 200
    codes = [item["code"] for item in response.json()["items"]]
    assert "basic" in codes
    assert "business" not in codes


@pytest.mark.asyncio
async def test_passport_me_requires_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/passport/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_stamps_empty_after_activation(auth_client: AsyncClient) -> None:
    data = await register_user(auth_client, suffix="-stamps")
    await activate_passport(auth_client, data["access_token"])
    response = await auth_client.get(
        "/api/v1/passport/stamps",
        headers=auth_header(data["access_token"]),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 0
    assert body["items"] == []


@pytest.mark.asyncio
async def test_offers_only_from_verified_public_orgs(auth_client: AsyncClient) -> None:
    data = await register_user(auth_client, suffix="-offers")
    await activate_passport(auth_client, data["access_token"])

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await create_verified_org_with_offer(
            session, slug_suffix="verified", offer_title="Offre vérifiée"
        )
        await create_unverified_org_with_active_offer(session, slug_suffix="pending")
        await session.commit()

    response = await auth_client.get(
        "/api/v1/passport/offers",
        headers=auth_header(data["access_token"]),
    )
    assert response.status_code == 200
    titles = [item["title"] for item in response.json()["items"]]
    assert "Offre vérifiée" in titles
    assert all("pending" not in title.lower() for title in titles)


@pytest.mark.asyncio
async def test_user_isolation_on_stamps(auth_client: AsyncClient) -> None:
    user_a = await register_user(auth_client, suffix="-a")
    user_b = await register_user(auth_client, suffix="-b")
    await activate_passport(auth_client, user_a["access_token"])
    await activate_passport(auth_client, user_b["access_token"])

    response = await auth_client.get(
        "/api/v1/passport/stamps",
        headers=auth_header(user_a["access_token"]),
    )
    assert response.status_code == 200
    assert response.json()["total"] == 0
