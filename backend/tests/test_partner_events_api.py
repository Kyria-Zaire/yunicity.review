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
from app.db.seeds.reims_partner_events import (
    REIMS_PARTNER_EVENTS_SEED,
    seed_reims_partner_events,
)
from app.db.session import get_engine
from app.models.local_event import LocalEvent
from app.models.organization import Organization, OrganizationMember
from app.models.partner_profile import PartnerProfile
from httpx import AsyncClient
from sqlalchemy import func, select
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


# ---------------------------------------------------------------------------
# Task 5 — Filter by organization_slug + is_partner in response
# ---------------------------------------------------------------------------


@pytest.mark.integration
@pytest.mark.asyncio
async def test_filter_by_organization_slug_returns_only_org_events(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(
            session, partner.user_id, "slug-filter", PartnerStatus.ACTIVE
        )
        result = await session.execute(
            select(Organization).where(Organization.id == org_id)
        )
        org = result.scalar_one()
        org_slug = org.slug
        await session.commit()

    starts = datetime.now(UTC) + timedelta(days=14)
    await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Event Slug Filter Test",
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Reims",
            "event_type": "partner_event",
        },
    )

    resp = await auth_client.get(f"/api/v1/events?organization_slug={org_slug}")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 1
    assert items[0]["title"] == "Event Slug Filter Test"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_event_response_exposes_is_partner(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(
            session, partner.user_id, "ispartner-check", PartnerStatus.ACTIVE
        )
        await session.commit()

    starts = datetime.now(UTC) + timedelta(days=14)
    create = await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Is Partner Check",
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Reims",
            "event_type": "partner_event",
        },
    )
    assert create.status_code == 201

    event_id = create.json()["id"]
    resp = await auth_client.get(f"/api/v1/events/{event_id}")
    assert resp.status_code == 200
    org = resp.json()["organization"]
    assert org is not None
    assert org["is_partner"] is True
    assert org["partner_status"] == "active"
    # Champs internes NON exposés
    assert "contact_email" not in org
    assert "contact_phone" not in org
    assert "contract_reference" not in org
    assert "notes_internal" not in org


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


# ---------------------------------------------------------------------------
# Task 6 — GET /partners/{slug}/events
# ---------------------------------------------------------------------------


@pytest.mark.integration
@pytest.mark.asyncio
async def test_partner_events_endpoint_active_returns_events(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """GET /partners/{slug}/events → retourne les events futurs."""
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(
            session, partner.user_id, "pe-active", PartnerStatus.ACTIVE
        )
        result = await session.execute(select(Organization).where(Organization.id == org_id))
        org = result.scalar_one()
        org_slug = org.slug
        await session.commit()

    starts = datetime.now(UTC) + timedelta(days=14)
    await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Afterwork découverte test",
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Reims",
            "event_type": "partner_event",
        },
    )

    resp = await auth_client.get(f"/api/v1/partners/{org_slug}/events")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert any(e["title"] == "Afterwork découverte test" for e in items)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_partner_events_endpoint_signed_returns_404(
    auth_client: AsyncClient,
) -> None:
    """Partenaire signed → 404."""
    # "daiboken" a partner_status=SIGNED dans le seed reims_signed_partners
    resp = await auth_client.get("/api/v1/partners/daiboken/events")
    assert resp.status_code == 404


@pytest.mark.integration
@pytest.mark.asyncio
async def test_partner_events_endpoint_unknown_slug_returns_404(
    auth_client: AsyncClient,
) -> None:
    resp = await auth_client.get("/api/v1/partners/slug-qui-nexiste-pas/events")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Task 7 — Seed idempotence
# ---------------------------------------------------------------------------


@pytest.mark.integration
@pytest.mark.asyncio
async def test_seed_partner_events_idempotent(
    auth_client: AsyncClient,
) -> None:
    """Le seed ne doit pas créer de doublon si lancé deux fois."""
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with factory() as session:
        await seed_reims_partner_events(session)
        await seed_reims_partner_events(session)
        await session.commit()

    async with factory() as session:
        for entry in REIMS_PARTNER_EVENTS_SEED:
            count_result = await session.execute(
                select(func.count()).select_from(LocalEvent).where(
                    LocalEvent.organization_id == entry["organization_id"],
                    LocalEvent.title == entry["title"],
                )
            )
            count = count_result.scalar_one()
            assert count == 1, f"Doublon détecté pour {entry['title']}"
