"""Public creator hub API (FEATURE-CREATORS-V1 C1-01)."""

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

BASE = "/api/v1/creator-content"


async def _active_partner_org(
    session: AsyncSession,
    user_id: uuid.UUID,
    suffix: str,
) -> uuid.UUID:
    org = Organization(
        slug=f"creator-hub-{suffix}",
        name=f"Hub Partner {suffix}",
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


async def test_hub_list_returns_only_published_active(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _active_partner_org(session, partner.user_id, "hub-only")
        session.add(
            PartnerCreatorContent(
                organization_id=org_id,
                title="Portrait publié",
                body="Un regard sur Reims.",
                status=PartnerCreatorContentStatus.PUBLISHED,
                is_active=True,
                created_by_user_id=partner.user_id,
            )
        )
        session.add(
            PartnerCreatorContent(
                organization_id=org_id,
                title="Brouillon caché",
                body="Invisible",
                status=PartnerCreatorContentStatus.DRAFT,
                is_active=False,
                created_by_user_id=partner.user_id,
            )
        )
        await session.commit()

    resp = await auth_client.get(f"{BASE}?city=Reims")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] >= 1
    titles = {item["title"] for item in data["items"]}
    assert "Portrait publié" in titles
    assert "Brouillon caché" not in titles
    first = next(item for item in data["items"] if item["title"] == "Portrait publié")
    assert first["author"]["kind"] == "partner"
    assert first["author"]["display_name"] == "Hub Partner hub-only"
    assert first["content_type"] == "article"
    assert first["city"] == "Reims"


async def test_hub_list_photo_content_type(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _active_partner_org(session, partner.user_id, "photo-type")
        session.add(
            PartnerCreatorContent(
                organization_id=org_id,
                title="Instant photo",
                body=None,
                media_url="https://cdn.example.com/photo.jpg",
                status=PartnerCreatorContentStatus.PUBLISHED,
                is_active=True,
                created_by_user_id=partner.user_id,
            )
        )
        await session.commit()

    resp = await auth_client.get(f"{BASE}?city=Reims")
    assert resp.status_code == 200, resp.text
    item = next(i for i in resp.json()["items"] if i["title"] == "Instant photo")
    assert item["content_type"] == "photo"
    assert item["cover"] == "https://cdn.example.com/photo.jpg"
