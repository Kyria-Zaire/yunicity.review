"""Partner offer moderation API tests (TICKET-305A)."""

from __future__ import annotations

import uuid

import pytest
from app.core.organization_constants import (
    OrganizationMemberRole,
    OrganizationMemberStatus,
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.db.session import get_engine
from app.models.organization import Organization, OrganizationMember
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

ADMIN_BASE = "/api/v1/admin/partner-offers"
PARTNER_BASE = "/api/v1/organizations/me/offers"


async def _verified_org_owner(
    session: AsyncSession,
    user_id: uuid.UUID,
    suffix: str,
) -> uuid.UUID:
    org = Organization(
        slug=f"mod-org-{suffix}",
        name=f"Mod org {suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PRIVATE,
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
    await session.flush()
    return org.id


@pytest.mark.asyncio
async def test_full_moderation_workflow(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    moderator = await rbac_user_factory("MODERATOR")
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _verified_org_owner(session, partner.user_id, suffix="flow")
        await session.commit()

    created = await auth_client.post(
        PARTNER_BASE,
        json={
            "organization_id": str(org_id),
            "title": "Workflow offre",
            "offer_type": "gift",
        },
        headers=auth_header(partner.access_token),
    )
    assert created.status_code == 201
    offer_id = created.json()["id"]

    submitted = await auth_client.post(
        f"{PARTNER_BASE}/{offer_id}/submit",
        headers=auth_header(partner.access_token),
    )
    assert submitted.status_code == 200
    assert submitted.json()["offer_status"] == "pending_review"

    approved = await auth_client.post(
        f"{ADMIN_BASE}/{offer_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert approved.status_code == 200
    assert approved.json()["offer_status"] == "published"
    assert approved.json()["is_active"] is True
    assert approved.json()["moderated_by_user_id"] == str(moderator.user_id)
    assert approved.json()["organization"]["visibility"] == "public"


@pytest.mark.asyncio
async def test_reject_requires_reason(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    moderator = await rbac_user_factory("MODERATOR")
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _verified_org_owner(session, partner.user_id, suffix="reject")
        await session.commit()

    created = await auth_client.post(
        PARTNER_BASE,
        json={
            "organization_id": str(org_id),
            "title": "À rejeter",
            "offer_type": "discount",
        },
        headers=auth_header(partner.access_token),
    )
    offer_id = created.json()["id"]
    await auth_client.post(
        f"{PARTNER_BASE}/{offer_id}/submit",
        headers=auth_header(partner.access_token),
    )

    rejected = await auth_client.post(
        f"{ADMIN_BASE}/{offer_id}/reject",
        json={"reason": "Description insuffisante pour le pilote."},
        headers=auth_header(moderator.access_token),
    )
    assert rejected.status_code == 200
    assert rejected.json()["offer_status"] == "rejected"
    assert rejected.json()["rejection_reason"] == "Description insuffisante pour le pilote."
    assert rejected.json()["is_active"] is False


@pytest.mark.asyncio
async def test_approve_forbidden_from_rejected(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    moderator = await rbac_user_factory("MODERATOR")
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _verified_org_owner(session, partner.user_id, suffix="bad")
        await session.commit()

    created = await auth_client.post(
        PARTNER_BASE,
        json={
            "organization_id": str(org_id),
            "title": "Rejet direct",
            "offer_type": "vip",
        },
        headers=auth_header(partner.access_token),
    )
    offer_id = created.json()["id"]
    await auth_client.post(
        f"{PARTNER_BASE}/{offer_id}/submit",
        headers=auth_header(partner.access_token),
    )
    await auth_client.post(
        f"{ADMIN_BASE}/{offer_id}/reject",
        json={"reason": "Non conforme"},
        headers=auth_header(moderator.access_token),
    )

    approve = await auth_client.post(
        f"{ADMIN_BASE}/{offer_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert approve.status_code == 422
    assert approve.json()["code"] == "INVALID_OFFER_TRANSITION"


@pytest.mark.asyncio
async def test_moderation_queue_filter(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        f"{ADMIN_BASE}?status=pending_review",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    assert "items" in response.json()
