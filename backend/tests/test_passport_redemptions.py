"""Passport offer redemption integration tests.

PASSPORT-SELF-REDEEM-API-01 (décision produit, 2026-11-05) : la consommation d'une
offre exige une validation partenaire. Réussite, doublon et offre inconnue sont
vérifiés via le parcours partenaire (``/scan/redeem``) ; la route citoyenne
``/passport/offers/{id}/redeem`` refuse toujours, sans effet.
"""

from __future__ import annotations

import uuid

import pytest
from app.core.yuni_wallet_constants import YuniTransactionReferenceType
from app.db.session import get_engine
from app.models.passport import PassportOfferRedemption
from app.models.yuni_wallet import YuniTransaction
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_passport import (
    activate_passport,
    auth_header,
    create_verified_org_with_offer,
    partner_redeem,
    register_partner_for_org,
    register_user,
)

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


def _factory() -> async_sessionmaker[AsyncSession]:
    engine = get_engine()
    assert engine is not None
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.mark.asyncio
async def test_redeem_offer_success(auth_client: AsyncClient) -> None:
    data = await register_user(auth_client, suffix="-redeem")
    passport = await activate_passport(auth_client, data["access_token"])

    async with _factory()() as session:
        org, offer = await create_verified_org_with_offer(
            session, slug_suffix="redeem", offer_title="Réduction 10%"
        )
        partner = await register_partner_for_org(
            auth_client, session, organization_id=org.id, suffix="-redeem"
        )
        offer_id = offer.id
        await session.commit()

    response = await partner_redeem(
        auth_client,
        partner_token=partner["access_token"],
        citizen_token=data["access_token"],
        offer_id=offer_id,
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    assert body["offer_title"] == "Réduction 10%"

    async with _factory()() as session:
        redemption = await session.scalar(
            select(PassportOfferRedemption).where(
                PassportOfferRedemption.passport_id == uuid.UUID(passport["id"])
            )
        )
        assert redemption is not None
        # Récompense de l'utilisation, rattachée à CETTE utilisation (le parcours
        # partenaire attribue aussi des Yuni pour le tampon Passport : autre référence).
        yuni = await session.scalar(
            select(func.count())
            .select_from(YuniTransaction)
            .where(
                YuniTransaction.user_id == uuid.UUID(data["user"]["id"]),
                YuniTransaction.reference_type
                == YuniTransactionReferenceType.PARTNER_OFFER_REDEMPTION.value,
                YuniTransaction.reference_id == redemption.id,
            )
        )
    assert redemption.partner_offer_id == offer_id
    assert redemption.redeemed_at is not None
    assert redemption.metadata_ and "audit" in redemption.metadata_
    assert yuni == 1, "la récompense Yuni est attribuée via le parcours partenaire"


@pytest.mark.asyncio
async def test_redeem_duplicate_rejected(auth_client: AsyncClient) -> None:
    data = await register_user(auth_client, suffix="-dup")
    await activate_passport(auth_client, data["access_token"])

    async with _factory()() as session:
        org, offer = await create_verified_org_with_offer(session, slug_suffix="dup")
        partner = await register_partner_for_org(
            auth_client, session, organization_id=org.id, suffix="-dup"
        )
        offer_id = offer.id
        await session.commit()

    kwargs = {
        "partner_token": partner["access_token"],
        "citizen_token": data["access_token"],
        "offer_id": offer_id,
    }
    first = await partner_redeem(auth_client, **kwargs)
    assert first.status_code == 200, first.text
    second = await partner_redeem(auth_client, **kwargs)
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
    async with _factory()() as session:
        org, _ = await create_verified_org_with_offer(session, slug_suffix="unknown")
        partner = await register_partner_for_org(
            auth_client, session, organization_id=org.id, suffix="-unknown"
        )
        await session.commit()

    response = await partner_redeem(
        auth_client,
        partner_token=partner["access_token"],
        citizen_token=data["access_token"],
        offer_id=uuid.uuid4(),
    )
    assert response.status_code == 404
    assert response.json()["code"] == "OFFER_NOT_FOUND"


@pytest.mark.asyncio
async def test_citizen_route_refuses_identically_whatever_the_offer(
    auth_client: AsyncClient,
) -> None:
    data = await register_user(auth_client, suffix="-citizen-route")
    await activate_passport(auth_client, data["access_token"])
    async with _factory()() as session:
        _, offer = await create_verified_org_with_offer(session, slug_suffix="citizen-route")
        await session.commit()
        offer_id = offer.id

    headers = auth_header(data["access_token"])
    existing = await auth_client.post(f"/api/v1/passport/offers/{offer_id}/redeem", headers=headers)
    unknown = await auth_client.post(
        f"/api/v1/passport/offers/{uuid.uuid4()}/redeem", headers=headers
    )
    assert (existing.status_code, unknown.status_code) == (403, 403)
    assert existing.json() == unknown.json()
    assert existing.json()["code"] == "OFFER_PARTNER_VALIDATION_REQUIRED"
