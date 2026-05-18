"""Admin partner offer moderation API tests (TICKET-305 / 305A)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from app.core.organization_constants import (
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.db.session import get_engine
from app.models.organization import Organization
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/partner-offers"


async def _create_verified_org(session: AsyncSession, *, suffix: str) -> Organization:
    org = Organization(
        slug=f"offer-org-{suffix}",
        name=f"Partner {suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PRIVATE,
    )
    session.add(org)
    await session.flush()
    return org


async def _create_pending_org(session: AsyncSession, *, suffix: str) -> Organization:
    org = Organization(
        slug=f"pending-org-{suffix}",
        name=f"Pending {suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.PENDING,
        visibility=OrganizationVisibility.PRIVATE,
    )
    session.add(org)
    await session.flush()
    return org


@pytest.mark.asyncio
async def test_create_offer_verified_org_success(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await _create_verified_org(session, suffix="ok")
        org_id = org.id
        await session.commit()

    now = datetime.now(UTC)
    response = await auth_client.post(
        BASE,
        json={
            "organization_id": str(org_id),
            "title": "Café offert",
            "description": "Un café pour les citoyens",
            "offer_type": "drink",
            "redemption_limit": 1,
            "valid_from": now.isoformat(),
            "valid_until": (now + timedelta(days=30)).isoformat(),
        },
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["title"] == "Café offert"
    assert data["offer_status"] == "draft"
    assert data["is_active"] is False
    assert data["organization"]["verification_status"] == "verified"


@pytest.mark.asyncio
async def test_create_offer_pending_org_rejected(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await _create_pending_org(session, suffix="no")
        org_id = org.id
        await session.commit()

    response = await auth_client.post(
        BASE,
        json={
            "organization_id": str(org_id),
            "title": "Offre invalide",
            "offer_type": "drink",
        },
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 422
    assert response.json()["code"] == "ORGANIZATION_NOT_VERIFIED"


@pytest.mark.asyncio
async def test_create_offer_invalid_dates(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await _create_verified_org(session, suffix="dates")
        org_id = org.id
        await session.commit()

    now = datetime.now(UTC)
    response = await auth_client.post(
        BASE,
        json={
            "organization_id": str(org_id),
            "title": "Dates invalides",
            "offer_type": "discount",
            "valid_from": now.isoformat(),
            "valid_until": (now - timedelta(days=1)).isoformat(),
        },
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_approve_and_archive_offer(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    admin = await rbac_user_factory("SUPER_ADMIN")
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await _create_verified_org(session, suffix="act")
        org_id = org.id
        await session.commit()

    create = await auth_client.post(
        BASE,
        json={
            "organization_id": str(org_id),
            "title": "Modération test",
            "offer_type": "gift",
        },
        headers=auth_header(admin.access_token),
    )
    assert create.status_code == 201
    offer_id = create.json()["id"]

    # Staff cannot publish without review queue — submit via partner path omitted;
    # force pending_review via DB-less path: patch status not allowed; use partner flow
    # For admin-only bootstrap, transition draft -> pending_review via submit simulation:
    from app.core.passport_constants import PartnerOfferStatus
    from app.models.passport import PartnerOffer

    async with factory() as session:
        offer = await session.get(PartnerOffer, uuid.UUID(offer_id))
        assert offer is not None
        offer.status = PartnerOfferStatus.PENDING_REVIEW
        await session.commit()

    approve = await auth_client.post(
        f"{BASE}/{offer_id}/approve",
        headers=auth_header(admin.access_token),
    )
    assert approve.status_code == 200
    assert approve.json()["offer_status"] == "published"
    assert approve.json()["organization"]["visibility"] == "public"

    archive = await auth_client.post(
        f"{BASE}/{offer_id}/archive",
        headers=auth_header(admin.access_token),
    )
    assert archive.status_code == 200
    assert archive.json()["offer_status"] == "archived"
    assert archive.json()["is_active"] is False


@pytest.mark.asyncio
async def test_list_offers_with_filters(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        f"{BASE}?status=published&offer_type=drink",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body


@pytest.mark.asyncio
async def test_partner_offers_user_denied(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.get(BASE, headers=auth_header(user.access_token))
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_partner_offers_auth_required(auth_client: AsyncClient) -> None:
    response = await auth_client.get(BASE)
    assert response.status_code == 401
