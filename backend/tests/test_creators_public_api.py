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


async def test_directory_lists_creators_with_published_content(
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
            "directory-listed",
            public_partner_label="Atelier Nord",
            neighborhood_name="Orgeval",
        )
        await _add_content(
            session,
            org_id=org_id,
            user_id=partner.user_id,
            title="Histoire publiée",
            status=PartnerCreatorContentStatus.PUBLISHED,
        )
        await session.commit()

    resp = await auth_client.get(f"{BASE}?city=Reims")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["city"] == "Reims"
    item = next((row for row in data["items"] if row["id"] == str(org_id)), None)
    assert item is not None
    assert item["display_name"] == "Atelier Nord"
    assert item["territory"]["neighborhood_name"] == "Orgeval"
    assert item["published_content_count"] >= 1
    assert item["partnership_type"] == PartnershipType.LOCAL_BUSINESS.value


async def test_directory_excludes_creators_without_published_content(
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
            "directory-no-content",
            public_partner_label="Sans contenu",
        )
        await session.commit()

    resp = await auth_client.get(f"{BASE}?city=Reims")
    assert resp.status_code == 200, resp.text
    ids = {item["id"] for item in resp.json()["items"]}
    assert str(org_id) not in ids


async def test_directory_excludes_draft_only_creators(
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
            "directory-draft-only",
            public_partner_label="Brouillon seul",
        )
        await _add_content(
            session,
            org_id=org_id,
            user_id=partner.user_id,
            title="Brouillon",
            status=PartnerCreatorContentStatus.DRAFT,
        )
        await session.commit()

    resp = await auth_client.get(f"{BASE}?city=Reims")
    assert resp.status_code == 200, resp.text
    ids = {item["id"] for item in resp.json()["items"]}
    assert str(org_id) not in ids


async def test_directory_search_by_display_name(
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
            "directory-search-name",
            public_partner_label="Collectif Zéphyr",
        )
        await _add_content(
            session,
            org_id=org_id,
            user_id=partner.user_id,
            title="Portrait",
            status=PartnerCreatorContentStatus.PUBLISHED,
        )
        await session.commit()

    resp = await auth_client.get(f"{BASE}?city=Reims&q=Zéphyr")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert any(item["id"] == str(org_id) for item in data["items"])
    assert all("zéphyr" in item["display_name"].lower() for item in data["items"])


async def test_directory_search_by_neighborhood(
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
            "directory-search-hood",
            neighborhood_name="Tinqueux",
        )
        await _add_content(
            session,
            org_id=org_id,
            user_id=partner.user_id,
            title="Portrait quartier",
            status=PartnerCreatorContentStatus.PUBLISHED,
        )
        await session.commit()

    resp = await auth_client.get(f"{BASE}?city=Reims&q=Tinqueux")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert any(item["id"] == str(org_id) for item in data["items"])


async def test_directory_pagination_limit_offset(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        for index in range(3):
            org_id = await _active_partner_org(
                session,
                partner.user_id,
                f"directory-page-{index}",
                public_partner_label=f"Créateur Page {index}",
            )
            await _add_content(
                session,
                org_id=org_id,
                user_id=partner.user_id,
                title=f"Histoire {index}",
                status=PartnerCreatorContentStatus.PUBLISHED,
            )
        await session.commit()

    page_one = await auth_client.get(f"{BASE}?city=Reims&limit=1&offset=0")
    page_two = await auth_client.get(f"{BASE}?city=Reims&limit=1&offset=1")
    assert page_one.status_code == 200, page_one.text
    assert page_two.status_code == 200, page_two.text
    first = page_one.json()
    second = page_two.json()
    assert first["limit"] == 1
    assert second["offset"] == 1
    if first["total"] >= 2:
        assert first["items"][0]["id"] != second["items"][0]["id"]
