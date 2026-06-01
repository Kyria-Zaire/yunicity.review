"""Public partner creator content API (WEB-PARTNERS-06B)."""

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
from app.models.organization import Organization, OrganizationMember
from app.models.partner_creator_content import PartnerCreatorContent
from app.models.partner_profile import PartnerProfile
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


async def _active_partner_org(
    session: AsyncSession,
    user_id: uuid.UUID,
    suffix: str,
) -> tuple[uuid.UUID, str]:
    org = Organization(
        slug=f"creator-pub-{suffix}",
        name=f"Creator Pub {suffix}",
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
    return org.id, org.slug


async def test_public_list_returns_only_published_active(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id, slug = await _active_partner_org(session, partner.user_id, "published-only")
        session.add(
            PartnerCreatorContent(
                organization_id=org_id,
                title="Publié",
                body="Visible",
                status=PartnerCreatorContentStatus.PUBLISHED,
                is_active=True,
                created_by_user_id=partner.user_id,
            )
        )
        session.add(
            PartnerCreatorContent(
                organization_id=org_id,
                title="Brouillon",
                body="Caché",
                status=PartnerCreatorContentStatus.DRAFT,
                is_active=False,
                created_by_user_id=partner.user_id,
            )
        )
        await session.commit()

    resp = await auth_client.get(f"/api/v1/partners/{slug}/creator-content?city=Reims")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["title"] == "Publié"


async def test_public_list_unknown_partner_returns_404(auth_client: AsyncClient) -> None:
    resp = await auth_client.get("/api/v1/partners/inconnu-slug/creator-content?city=Reims")
    assert resp.status_code == 404
    assert resp.json()["code"] == "PARTNER_NOT_FOUND"
