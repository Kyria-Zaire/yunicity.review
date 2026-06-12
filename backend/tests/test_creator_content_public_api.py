"""Public creator hub API (FEATURE-CREATORS-V1 C1-01 / C1-02)."""

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
from app.models.partner_creator_content import PartnerCreatorContent
from app.models.partner_profile import PartnerProfile
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/creator-content"


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> None:
    """Évite RATE_LIMITED quand la suite enchaîne plusieurs POST /auth/register."""
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
) -> uuid.UUID:
    org = Organization(
        slug=f"creator-hub-{suffix}",
        name=f"Hub Partner {suffix}",
        type=OrganizationType.COMMERCE,
        city=city,
        verification_status=verification_status,
        visibility=visibility,
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
        await _add_content(
            session,
            org_id=org_id,
            user_id=partner.user_id,
            title="Portrait publié",
            status=PartnerCreatorContentStatus.PUBLISHED,
            body="Un regard sur Reims.",
        )
        await _add_content(
            session,
            org_id=org_id,
            user_id=partner.user_id,
            title="Brouillon caché",
            status=PartnerCreatorContentStatus.DRAFT,
            is_active=False,
            body="Invisible",
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


async def test_detail_returns_published_content(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _active_partner_org(session, partner.user_id, "detail-ok")
        content_id = await _add_content(
            session,
            org_id=org_id,
            user_id=partner.user_id,
            title="Histoire publiée",
            status=PartnerCreatorContentStatus.PUBLISHED,
            body="Premier paragraphe.\n\nDeuxième paragraphe.",
        )
        await session.commit()

    resp = await auth_client.get(f"{BASE}/{content_id}")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["id"] == str(content_id)
    assert data["title"] == "Histoire publiée"
    assert data["body"] == "Premier paragraphe.\n\nDeuxième paragraphe."
    assert data["city"] == "Reims"
    assert data["content_type"] == "article"
    assert data["author"]["kind"] == "partner"
    assert data["author"]["display_name"] == "Hub Partner detail-ok"
    assert "related" in data
    assert isinstance(data["related"], list)


@pytest.mark.parametrize(
    "status",
    [
        PartnerCreatorContentStatus.DRAFT,
        PartnerCreatorContentStatus.PENDING_REVIEW,
        PartnerCreatorContentStatus.REJECTED,
        PartnerCreatorContentStatus.ARCHIVED,
    ],
)
async def test_detail_returns_404_for_non_published_status(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    status: PartnerCreatorContentStatus,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _active_partner_org(session, partner.user_id, f"detail-{status.value}")
        content_id = await _add_content(
            session,
            org_id=org_id,
            user_id=partner.user_id,
            title=f"Contenu {status.value}",
            status=status,
        )
        await session.commit()

    resp = await auth_client.get(f"{BASE}/{content_id}")
    assert resp.status_code == 404, resp.text
    assert resp.json()["code"] == "CREATOR_CONTENT_NOT_FOUND"


async def test_detail_returns_404_when_organization_not_public(
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
            "detail-private-org",
            visibility=OrganizationVisibility.PRIVATE,
        )
        content_id = await _add_content(
            session,
            org_id=org_id,
            user_id=partner.user_id,
            title="Contenu org privée",
            status=PartnerCreatorContentStatus.PUBLISHED,
        )
        await session.commit()

    resp = await auth_client.get(f"{BASE}/{content_id}")
    assert resp.status_code == 404, resp.text


async def test_detail_returns_404_when_organization_not_verified(
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
            "detail-unverified",
            verification_status=VerificationStatus.PENDING,
        )
        content_id = await _add_content(
            session,
            org_id=org_id,
            user_id=partner.user_id,
            title="Contenu org non vérifiée",
            status=PartnerCreatorContentStatus.PUBLISHED,
        )
        await session.commit()

    resp = await auth_client.get(f"{BASE}/{content_id}")
    assert resp.status_code == 404, resp.text


async def test_detail_related_excludes_current_and_list_unchanged(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _active_partner_org(session, partner.user_id, "detail-related")
        main_id = await _add_content(
            session,
            org_id=org_id,
            user_id=partner.user_id,
            title="Histoire principale",
            status=PartnerCreatorContentStatus.PUBLISHED,
        )
        for index in range(4):
            await _add_content(
                session,
                org_id=org_id,
                user_id=partner.user_id,
                title=f"Autre histoire {index}",
                status=PartnerCreatorContentStatus.PUBLISHED,
            )
        await session.commit()

    detail_resp = await auth_client.get(f"{BASE}/{main_id}")
    assert detail_resp.status_code == 200, detail_resp.text
    detail = detail_resp.json()
    related_ids = {item["id"] for item in detail["related"]}
    assert str(main_id) not in related_ids
    assert len(detail["related"]) <= 3

    list_resp = await auth_client.get(f"{BASE}?city=Reims")
    assert list_resp.status_code == 200, list_resp.text
    list_titles = {item["title"] for item in list_resp.json()["items"]}
    assert "Histoire principale" in list_titles
