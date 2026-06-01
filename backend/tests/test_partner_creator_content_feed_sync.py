"""Partner creator content feed sync (WEB-PARTNERS-06C)."""

from __future__ import annotations

import uuid

import pytest
from app.core.feed_constants import PostType
from app.core.organization_constants import (
    OrganizationMemberRole,
    OrganizationMemberStatus,
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.partner_creator_content_constants import PartnerCreatorContentStatus
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from app.models.organization import Organization, OrganizationMember
from app.models.partner_creator_content import PartnerCreatorContent
from app.models.post import Post
from app.repositories.post_repository import PostRepository
from app.services.feed_creator_content_sync import FeedCreatorContentSyncService
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> None:
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()


ADMIN_BASE = "/api/v1/admin/partner-creator-content"
PARTNER_BASE = "/api/v1/organizations/me/creator-content"


async def _verified_org_owner(
    session: AsyncSession,
    user_id: uuid.UUID,
    suffix: str,
) -> uuid.UUID:
    org = Organization(
        slug=f"feed-sync-org-{suffix}",
        name=f"Feed sync org {suffix}",
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
async def test_approve_creates_partner_creator_feed_post(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    moderator = await rbac_user_factory("MODERATOR")
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _verified_org_owner(session, partner.user_id, "feed-post")
        await session.commit()

    created = await auth_client.post(
        PARTNER_BASE,
        json={
            "organization_id": str(org_id),
            "title": "Coulisses du chai",
            "body": "Visite des caves ce week-end.",
        },
        headers=auth_header(partner.access_token),
    )
    assert created.status_code == 201
    content_id = created.json()["id"]

    submitted = await auth_client.post(
        f"{PARTNER_BASE}/{content_id}/submit",
        headers=auth_header(partner.access_token),
    )
    assert submitted.status_code == 200

    approved = await auth_client.post(
        f"{ADMIN_BASE}/{content_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "published"
    assert approved.json()["is_active"] is True

    async with factory() as session:
        result = await session.execute(
            select(Post).where(Post.partner_creator_content_id == uuid.UUID(content_id))
        )
        post = result.scalar_one_or_none()
        assert post is not None
        assert post.type == PostType.PARTNER_CREATOR.value
        assert post.is_active is True
        assert post.title == "Coulisses du chai"


@pytest.mark.asyncio
async def test_feed_sync_service_upsert_is_idempotent(auth_client: AsyncClient) -> None:
    _ = auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = Organization(
            slug="feed-sync-idempotent",
            name="Idempotent Org",
            type=OrganizationType.COMMERCE,
            city="Reims",
            verification_status=VerificationStatus.VERIFIED,
            visibility=OrganizationVisibility.PUBLIC,
        )
        session.add(org)
        await session.flush()
        content = PartnerCreatorContent(
            organization_id=org.id,
            title="Titre initial",
            body="Corps",
            status=PartnerCreatorContentStatus.PUBLISHED,
            is_active=True,
        )
        session.add(content)
        await session.flush()

        sync = FeedCreatorContentSyncService(session)
        post1 = await sync.upsert_creator_content_post(content, org)
        content.title = "Titre mis à jour"
        post2 = await sync.upsert_creator_content_post(content, org)
        await session.commit()

        assert post1.id == post2.id
        posts = PostRepository(session)
        loaded = await posts.get_by_partner_creator_content_id(content.id)
        assert loaded is not None
        assert loaded.title == "Titre mis à jour"
