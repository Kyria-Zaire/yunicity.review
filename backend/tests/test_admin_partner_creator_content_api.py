"""Admin partner creator content moderation API (ADMIN-CREATOR-01)."""

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
from app.core.partner_constants import PartnershipType, PartnerStatus
from app.core.partner_creator_content_constants import PartnerCreatorContentStatus
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from app.models.organization import Organization, OrganizationMember
from app.models.partner_profile import PartnerProfile
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

ADMIN_BASE = "/api/v1/admin/partner-creator-content"
PARTNER_BASE = "/api/v1/organizations/me/creator-content"


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> None:
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()


async def _partner_org_owner(
    session: AsyncSession,
    user_id: uuid.UUID,
    suffix: str,
) -> uuid.UUID:
    org = Organization(
        slug=f"admin-creator-org-{suffix}",
        name=f"Admin Creator Org {suffix}",
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
            partner_status=PartnerStatus.ACTIVE,
            partnership_type=PartnershipType.LOCAL_BUSINESS,
        )
    )
    await session.flush()
    return org.id


@pytest.mark.asyncio
async def test_admin_list_creator_contents_filter_pending(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    moderator = await rbac_user_factory("MODERATOR")
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(session, partner.user_id, "list")
        await session.commit()

    created = await auth_client.post(
        PARTNER_BASE,
        json={
            "organization_id": str(org_id),
            "title": "À modérer",
            "body": "Contenu test file d'attente.",
        },
        headers=auth_header(partner.access_token),
    )
    assert created.status_code == 201
    content_id = created.json()["id"]
    await auth_client.post(
        f"{PARTNER_BASE}/{content_id}/submit",
        headers=auth_header(partner.access_token),
    )

    response = await auth_client.get(
        f"{ADMIN_BASE}?status=pending_review",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total"] >= 1
    ids = [item["id"] for item in data["items"]]
    assert content_id in ids
    row = next(item for item in data["items"] if item["id"] == content_id)
    assert row["status"] == PartnerCreatorContentStatus.PENDING_REVIEW.value
    assert row["organization"]["name"].startswith("Admin Creator Org")


@pytest.mark.asyncio
async def test_admin_get_detail_and_approve(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    moderator = await rbac_user_factory("MODERATOR")
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(session, partner.user_id, "approve")
        await session.commit()

    created = await auth_client.post(
        PARTNER_BASE,
        json={
            "organization_id": str(org_id),
            "title": "Story Belga",
            "body": "Texte complet pour modération.",
        },
        headers=auth_header(partner.access_token),
    )
    content_id = created.json()["id"]
    await auth_client.post(
        f"{PARTNER_BASE}/{content_id}/submit",
        headers=auth_header(partner.access_token),
    )

    detail = await auth_client.get(
        f"{ADMIN_BASE}/{content_id}",
        headers=auth_header(moderator.access_token),
    )
    assert detail.status_code == 200
    assert detail.json()["title"] == "Story Belga"
    assert detail.json()["author"] is not None

    approved = await auth_client.post(
        f"{ADMIN_BASE}/{content_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == PartnerCreatorContentStatus.PUBLISHED.value
    assert approved.json()["is_active"] is True


@pytest.mark.asyncio
async def test_admin_reject_requires_reason(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    moderator = await rbac_user_factory("MODERATOR")
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(session, partner.user_id, "reject")
        await session.commit()

    created = await auth_client.post(
        PARTNER_BASE,
        json={
            "organization_id": str(org_id),
            "title": "À refuser",
            "body": "Contenu incomplet.",
        },
        headers=auth_header(partner.access_token),
    )
    content_id = created.json()["id"]
    await auth_client.post(
        f"{PARTNER_BASE}/{content_id}/submit",
        headers=auth_header(partner.access_token),
    )

    rejected = await auth_client.post(
        f"{ADMIN_BASE}/{content_id}/reject",
        json={"reason": "Le texte ne respecte pas les consignes pilote."},
        headers=auth_header(moderator.access_token),
    )
    assert rejected.status_code == 200
    assert rejected.json()["status"] == PartnerCreatorContentStatus.REJECTED.value
    assert rejected.json()["rejection_reason"] is not None
