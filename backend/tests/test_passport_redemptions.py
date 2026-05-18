"""Passport offer redemption integration tests."""

from __future__ import annotations

import uuid

import pytest
from app.db.session import get_engine
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_passport import (
    activate_passport,
    auth_header,
    create_verified_org_with_offer,
    register_user,
)

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.mark.asyncio
async def test_redeem_offer_success(auth_client: AsyncClient) -> None:
    data = await register_user(auth_client, suffix="-redeem")
    await activate_passport(auth_client, data["access_token"])

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        _, offer = await create_verified_org_with_offer(
            session, slug_suffix="redeem", offer_title="Réduction 10%"
        )
        offer_id = offer.id
        await session.commit()

    response = await auth_client.post(
        f"/api/v1/passport/offers/{offer_id}/redeem",
        headers=auth_header(data["access_token"]),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "completed"
    assert body["partner_offer_id"] == str(offer_id)
    assert body["redeemed_at"] is not None


@pytest.mark.asyncio
async def test_redeem_duplicate_rejected(auth_client: AsyncClient) -> None:
    data = await register_user(auth_client, suffix="-dup")
    await activate_passport(auth_client, data["access_token"])

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        _, offer = await create_verified_org_with_offer(session, slug_suffix="dup")
        offer_id = offer.id
        await session.commit()

    headers = auth_header(data["access_token"])
    first = await auth_client.post(f"/api/v1/passport/offers/{offer_id}/redeem", headers=headers)
    assert first.status_code == 200
    second = await auth_client.post(f"/api/v1/passport/offers/{offer_id}/redeem", headers=headers)
    assert second.status_code == 409
    assert second.json()["code"] == "REDEMPTION_ALREADY_EXISTS"


@pytest.mark.asyncio
async def test_redeem_requires_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.post(f"/api/v1/passport/offers/{uuid.uuid4()}/redeem")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_redeem_unknown_offer(auth_client: AsyncClient) -> None:
    data = await register_user(auth_client, suffix="-unknown")
    await activate_passport(auth_client, data["access_token"])
    response = await auth_client.post(
        f"/api/v1/passport/offers/{uuid.uuid4()}/redeem",
        headers=auth_header(data["access_token"]),
    )
    assert response.status_code == 404
    assert response.json()["code"] == "OFFER_NOT_FOUND"
