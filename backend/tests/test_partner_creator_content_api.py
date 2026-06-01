"""Partner creator content API (WEB-PARTNERS-06A)."""

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


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> None:
    """Évite RATE_LIMITED quand la suite enchaîne plusieurs POST /auth/register."""
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()


async def _partner_org_owner(
    session: AsyncSession,
    user_id: uuid.UUID,
    suffix: str,
    partner_status: PartnerStatus,
) -> uuid.UUID:
    org = Organization(
        slug=f"creator-org-{suffix}",
        name=f"Creator Org {suffix}",
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


async def test_active_partner_can_create_creator_content_draft(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(
            session, partner.user_id, "active-creator", PartnerStatus.ACTIVE
        )
        await session.commit()

    resp = await auth_client.post(
        "/api/v1/organizations/me/creator-content",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Coulisses du chai",
            "body": "Visite guidée des caves ce week-end.",
        },
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["status"] == PartnerCreatorContentStatus.DRAFT.value
    assert data["is_active"] is False
    assert data["organization"]["slug"].startswith("creator-org-")


async def test_signed_partner_cannot_create_creator_content(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(
            session, partner.user_id, "signed-creator", PartnerStatus.SIGNED
        )
        await session.commit()

    resp = await auth_client.post(
        "/api/v1/organizations/me/creator-content",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Brouillon bloqué",
        },
    )
    assert resp.status_code == 403
    assert resp.json()["code"] == "PARTNER_NOT_ACTIVE"


async def test_submit_creator_content_moves_to_pending_review(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(
            session, partner.user_id, "submit-creator", PartnerStatus.ACTIVE
        )
        await session.commit()

    create = await auth_client.post(
        "/api/v1/organizations/me/creator-content",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "À modérer",
        },
    )
    assert create.status_code == 201
    content_id = create.json()["id"]

    submit = await auth_client.post(
        f"/api/v1/organizations/me/creator-content/{content_id}/submit",
        headers=auth_header(partner.access_token),
    )
    assert submit.status_code == 200, submit.text
    assert submit.json()["status"] == PartnerCreatorContentStatus.PENDING_REVIEW.value
