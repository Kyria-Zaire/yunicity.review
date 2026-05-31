"""Partner events API (WEB-PARTNERS-05A)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from app.core.organization_constants import (
    OrganizationMemberRole,
    OrganizationMemberStatus,
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.partner_constants import PartnershipType, PartnerStatus
from app.db.session import get_engine
from app.models.organization import Organization, OrganizationMember
from app.models.partner_profile import PartnerProfile
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


# ---------------------------------------------------------------------------
# Task 2/3 — organization_slug filter
# ---------------------------------------------------------------------------


@pytest.mark.integration
@pytest.mark.asyncio
async def test_filter_by_organization_slug_unknown_returns_empty(
    auth_client: AsyncClient,
) -> None:
    """Unknown slug → empty list, no 404."""
    response = await auth_client.get("/api/v1/events?organization_slug=slug-inexistant")
    assert response.status_code == 200
    assert response.json()["items"] == []


# ---------------------------------------------------------------------------
# Task 4 — Partner status gate
# ---------------------------------------------------------------------------


async def _partner_org_owner(
    session: AsyncSession,
    user_id: uuid.UUID,
    suffix: str,
    partner_status: PartnerStatus,
) -> uuid.UUID:
    """Crée une org vérifiée avec PartnerProfile et un membre OWNER."""
    org = Organization(
        slug=f"partner-org-{suffix}",
        name=f"Partner Org {suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PUBLIC,
    )
    session.add(org)
    await session.flush()
    session.add(
        OrganizationMember(
            organization_id=org.id,
            user_id=user_id,
            role=OrganizationMemberRole.OWNER,
            status=OrganizationMemberStatus.ACTIVE,
        )
    )
    session.add(
        PartnerProfile(
            organization_id=org.id,
            partner_status=partner_status,
            partnership_type=PartnershipType.LOCAL_BUSINESS,
        )
    )
    await session.flush()
    return org.id


@pytest.mark.integration
@pytest.mark.asyncio
async def test_active_partner_can_create_event(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(
            session, partner.user_id, "active-ok", PartnerStatus.ACTIVE
        )
        await session.commit()

    starts = datetime.now(UTC) + timedelta(days=14)
    resp = await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Afterwork pilote",
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Reims centre",
            "event_type": "partner_event",
        },
    )
    assert resp.status_code == 201, resp.text


@pytest.mark.integration
@pytest.mark.asyncio
async def test_signed_partner_cannot_create_event(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(
            session, partner.user_id, "signed-blocked", PartnerStatus.SIGNED
        )
        await session.commit()

    starts = datetime.now(UTC) + timedelta(days=14)
    resp = await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Event bloqué",
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Reims",
            "event_type": "partner_event",
        },
    )
    assert resp.status_code == 403, resp.text
    assert resp.json()["code"] == "PARTNER_NOT_ACTIVE"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_paused_partner_cannot_create_event(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(
            session, partner.user_id, "paused-blocked", PartnerStatus.PAUSED
        )
        await session.commit()

    starts = datetime.now(UTC) + timedelta(days=14)
    resp = await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Event bloqué paused",
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Reims",
        },
    )
    assert resp.status_code == 403, resp.text
    assert resp.json()["code"] == "PARTNER_NOT_ACTIVE"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_classic_org_no_partner_profile_can_create_event(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """Org sans PartnerProfile → comportement inchangé (pas de gate)."""
    from tests.test_partner_offer_moderation import _verified_org_owner

    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _verified_org_owner(session, partner.user_id, "classic-no-profile")
        await session.commit()

    starts = datetime.now(UTC) + timedelta(days=5)
    resp = await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Event classique",
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Reims",
        },
    )
    assert resp.status_code == 201, resp.text
