"""Public creator profile API (FEATURE-CREATORS-V1 C1-03)."""

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
from app.models.neighborhood import Neighborhood
from app.models.organization import Organization, OrganizationMember
from app.models.partner_creator_content import PartnerCreatorContent
from app.models.partner_profile import PartnerProfile
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/public/creators"


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> None:
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()


async def _active_partner_org(
    session: AsyncSession,
    user_id: uuid.UUID,
    suffix: str,
    *,
    verification_status: VerificationStatus = VerificationStatus.VERIFIED,
    visibility: OrganizationVisibility = OrganizationVisibility.PUBLIC,
    city: str = "Reims",
    description: str | None = "Bio publique du créateur.",
    public_partner_label: str | None = None,
    neighborhood_name: str | None = None,
) -> uuid.UUID:
    neighborhood_id: uuid.UUID | None = None
    if neighborhood_name:
        neighborhood = Neighborhood(
            city=city,
            slug=f"quartier-{suffix}",
            display_name=neighborhood_name,
            is_active=True,
        )
        session.add(neighborhood)
        await session.flush()
        neighborhood_id = neighborhood.id

    org = Organization(
        slug=f"creator-profile-{suffix}",
        name=f"Profile Partner {suffix}",
        description=description,
        type=OrganizationType.COMMERCE,
        city=city,
        verification_status=verification_status,
        visibility=visibility,
        neighborhood_id=neighborhood_id,
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
            public_partner_label=public_partner_label,
        )
    )
    await session.flush()
    return org.id


async def _add_content(
    session: AsyncSession,
    *,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    title: str,
    status: PartnerCreatorContentStatus,
    is_active: bool = True,
    body: str | None = "Corps de test.",
) -> uuid.UUID:
    content = PartnerCreatorContent(
        organization_id=org_id,
        title=title,
        body=body,
        status=status,
        is_active=is_active,
        created_by_user_id=user_id,
    )
    session.add(content)
    await session.flush()
    return content.id


async def test_profile_returns_public_creator_with_contents(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _active_partner_org(
            session,
            partner.user_id,
            "profile-ok",
            public_partner_label="Studio Lumière",
            neighborhood_name="Centre-ville",
        )
        published_id = await _add_content(
            session,
            org_id=org_id,
            user_id=partner.user_id,
            title="Portrait publié",
            status=PartnerCreatorContentStatus.PUBLISHED,
        )
        await _add_content(
            session,
            org_id=org_id,
            user_id=partner.user_id,
            title="Brouillon caché",
            status=PartnerCreatorContentStatus.DRAFT,
        )
        await session.commit()

    resp = await auth_client.get(f"{BASE}/{org_id}")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["id"] == str(org_id)
    assert data["kind"] == "partner"
    assert data["display_name"] == "Studio Lumière"
    assert data["slug"] == "creator-profile-profile-ok"
    assert data["description"] == "Bio publique du créateur."
    assert data["territory"]["city"] == "Reims"
    assert data["territory"]["neighborhood_name"] == "Centre-ville"
    assert data["stats"]["published_content_count"] == 1
    assert data["contents_total"] == 1
    titles = {item["title"] for item in data["contents"]}
    assert "Portrait publié" in titles
    assert "Brouillon caché" not in titles
    assert data["contents"][0]["id"] == str(published_id)


async def test_profile_returns_404_for_unknown_creator(
    auth_client: AsyncClient,
) -> None:
    resp = await auth_client.get(f"{BASE}/{uuid.uuid4()}")
    assert resp.status_code == 404, resp.text
    assert resp.json()["code"] == "CREATOR_NOT_FOUND"


async def test_profile_returns_404_when_organization_not_public(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _active_partner_org(
            session,
            partner.user_id,
            "profile-private",
            visibility=OrganizationVisibility.PRIVATE,
        )
        await session.commit()

    resp = await auth_client.get(f"{BASE}/{org_id}")
    assert resp.status_code == 404, resp.text


async def test_profile_returns_404_when_partner_not_active(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _active_partner_org(session, partner.user_id, "profile-signed")
        result = await session.execute(
            select(PartnerProfile).where(PartnerProfile.organization_id == org_id)
        )
        profile = result.scalar_one()
        profile.partner_status = PartnerStatus.SIGNED.value
        await session.commit()

    resp = await auth_client.get(f"{BASE}/{org_id}")
    assert resp.status_code == 404, resp.text


@pytest.mark.parametrize(
    "status",
    [
        PartnerCreatorContentStatus.DRAFT,
        PartnerCreatorContentStatus.PENDING_REVIEW,
        PartnerCreatorContentStatus.REJECTED,
        PartnerCreatorContentStatus.ARCHIVED,
    ],
)
async def test_profile_excludes_non_published_contents(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    status: PartnerCreatorContentStatus,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _active_partner_org(session, partner.user_id, f"profile-{status.value}")
        await _add_content(
            session,
            org_id=org_id,
            user_id=partner.user_id,
            title=f"Contenu {status.value}",
            status=status,
        )
        await session.commit()

    resp = await auth_client.get(f"{BASE}/{org_id}")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["stats"]["published_content_count"] == 0
    assert data["contents"] == []


async def test_profile_empty_contents_state(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _active_partner_org(session, partner.user_id, "profile-empty")
        await session.commit()

    resp = await auth_client.get(f"{BASE}/{org_id}")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["stats"]["published_content_count"] == 0
    assert data["contents"] == []
    assert data["contents_total"] == 0
