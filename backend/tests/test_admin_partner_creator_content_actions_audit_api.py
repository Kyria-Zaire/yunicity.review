"""Admin partner creator content moderation audit API tests (ADMIN-06D-A)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
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
from app.core.partner_creator_content_constants import PartnerCreatorContentStatus
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from app.models.organization import Organization, OrganizationMember
from app.models.partner_creator_content import PartnerCreatorContent
from app.models.partner_profile import PartnerProfile
from app.models.user import User
from app.models.user_profile import UserProfile
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/partner-creator-content"
PARTNER_BASE = "/api/v1/organizations/me/creator-content"


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> AsyncIterator[None]:
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()
    yield
    if redis is not None:
        await redis.flushdb()


async def _session_factory() -> async_sessionmaker[AsyncSession]:
    engine = get_engine()
    assert engine is not None
    return async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


async def _partner_org_owner(
    session: AsyncSession,
    user_id: uuid.UUID,
    suffix: str,
) -> uuid.UUID:
    slug = f"creator-audit-org-{suffix}"
    org = Organization(
        slug=slug,
        name=f"Creator Audit Org {suffix}",
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


async def _create_pending_content(
    session: AsyncSession,
    *,
    org_id: uuid.UUID,
    author_id: uuid.UUID,
) -> PartnerCreatorContent:
    suffix = uuid.uuid4().hex[:8]
    content = PartnerCreatorContent(
        organization_id=org_id,
        title=f"Audit content {suffix}",
        body="Corps pour audit modération.",
        status=PartnerCreatorContentStatus.PENDING_REVIEW,
        is_active=False,
        created_by_user_id=author_id,
    )
    session.add(content)
    await session.flush()
    return content


async def _create_published_content(
    session: AsyncSession,
    *,
    org_id: uuid.UUID,
    author_id: uuid.UUID,
) -> PartnerCreatorContent:
    suffix = uuid.uuid4().hex[:8]
    content = PartnerCreatorContent(
        organization_id=org_id,
        title=f"Published audit {suffix}",
        body="Contenu publié pour archivage.",
        status=PartnerCreatorContentStatus.PUBLISHED,
        is_active=True,
        created_by_user_id=author_id,
    )
    session.add(content)
    await session.flush()
    return content


async def _count_audit(session: AsyncSession, content_id: uuid.UUID) -> int:
    from app.repositories.admin_partner_creator_content_repository import (
        AdminPartnerCreatorContentRepository,
    )

    return await AdminPartnerCreatorContentRepository(session).count_admin_actions(content_id)


def _actions_url(content_id: uuid.UUID) -> str:
    return f"{BASE}/{content_id}/actions"


@pytest.mark.asyncio
async def test_approve_writes_audit_entry(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    factory = await _session_factory()
    async with factory() as session:
        org_id = await _partner_org_owner(session, partner.user_id, "approve")
        content = await _create_pending_content(
            session,
            org_id=org_id,
            author_id=partner.user_id,
        )
        content_id = content.id
        await session.commit()

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.post(
        f"{BASE}/{content_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text

    async with factory() as session:
        assert await _count_audit(session, content_id) == 1

    actions = await auth_client.get(
        _actions_url(content_id),
        headers=auth_header(moderator.access_token),
    )
    assert actions.status_code == 200
    item = actions.json()["items"][0]
    assert item["action"] == "approve"
    assert item["previous_status"] == "pending_review"
    assert item["new_status"] == "published"
    assert item["reason"] == "Contenu approuvé et publié."


@pytest.mark.asyncio
async def test_reject_writes_audit_with_payload_reason(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    factory = await _session_factory()
    async with factory() as session:
        org_id = await _partner_org_owner(session, partner.user_id, "reject")
        content = await _create_pending_content(
            session,
            org_id=org_id,
            author_id=partner.user_id,
        )
        content_id = content.id
        await session.commit()

    moderator = await rbac_user_factory("MODERATOR")
    reject_reason = "Contenu incomplet pour publication"
    response = await auth_client.post(
        f"{BASE}/{content_id}/reject",
        headers=auth_header(moderator.access_token),
        json={"reason": reject_reason},
    )
    assert response.status_code == 200, response.text

    actions = await auth_client.get(
        _actions_url(content_id),
        headers=auth_header(moderator.access_token),
    )
    assert actions.status_code == 200
    item = actions.json()["items"][0]
    assert item["action"] == "reject"
    assert item["reason"] == reject_reason


@pytest.mark.asyncio
async def test_archive_writes_audit_entry(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    factory = await _session_factory()
    async with factory() as session:
        org_id = await _partner_org_owner(session, partner.user_id, "archive")
        content = await _create_published_content(
            session,
            org_id=org_id,
            author_id=partner.user_id,
        )
        content_id = content.id
        await session.commit()

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.post(
        f"{BASE}/{content_id}/archive",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text

    actions = await auth_client.get(
        _actions_url(content_id),
        headers=auth_header(moderator.access_token),
    )
    assert actions.status_code == 200
    item = actions.json()["items"][0]
    assert item["action"] == "archive"
    assert item["previous_status"] == "published"
    assert item["new_status"] == "archived"
    assert item["reason"] == "Contenu archivé."


@pytest.mark.asyncio
async def test_no_audit_when_moderation_action_fails(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    factory = await _session_factory()
    async with factory() as session:
        org_id = await _partner_org_owner(session, partner.user_id, "fail")
        content = await _create_pending_content(
            session,
            org_id=org_id,
            author_id=partner.user_id,
        )
        content_id = content.id
        await session.commit()

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.post(
        f"{BASE}/{content_id}/archive",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_CREATOR_CONTENT_TRANSITION"

    async with factory() as session:
        assert await _count_audit(session, content_id) == 0


@pytest.mark.asyncio
async def test_moderator_can_list_content_actions(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    factory = await _session_factory()
    async with factory() as session:
        org_id = await _partner_org_owner(session, partner.user_id, "list")
        content = await _create_pending_content(
            session,
            org_id=org_id,
            author_id=partner.user_id,
        )
        content_id = content.id
        await session.commit()

    moderator = await rbac_user_factory("MODERATOR")
    approve = await auth_client.post(
        f"{BASE}/{content_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert approve.status_code == 200

    response = await auth_client.get(
        _actions_url(content_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1


@pytest.mark.asyncio
async def test_user_denied_list_content_actions(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    factory = await _session_factory()
    async with factory() as session:
        org_id = await _partner_org_owner(session, partner.user_id, "403")
        content = await _create_pending_content(
            session,
            org_id=org_id,
            author_id=partner.user_id,
        )
        content_id = content.id
        await session.commit()

    user = await rbac_user_factory()
    response = await auth_client.get(
        _actions_url(content_id),
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_unknown_content_actions_returns_404(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _actions_url(uuid.uuid4()),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 404
    assert response.json()["code"] == "CREATOR_CONTENT_NOT_FOUND"


@pytest.mark.asyncio
async def test_content_actions_pagination(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    factory = await _session_factory()
    async with factory() as session:
        org_id = await _partner_org_owner(session, partner.user_id, "page")
        content = await _create_pending_content(
            session,
            org_id=org_id,
            author_id=partner.user_id,
        )
        content_id = content.id
        moderator_user = User(
            email=f"cc-audit-mod-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Staff Audit",
            city="Reims",
        )
        session.add(moderator_user)
        await session.flush()
        session.add(
            UserProfile(
                user_id=moderator_user.id,
                username=f"staff{uuid.uuid4().hex[:6]}",
                display_name="Staff Audit Display",
                city="Reims",
            )
        )
        from app.core.creator_content_admin_constants import CreatorContentAdminAction
        from app.repositories.admin_partner_creator_content_repository import (
            AdminPartnerCreatorContentRepository,
        )

        repo = AdminPartnerCreatorContentRepository(session)
        now = datetime.now(UTC)
        await repo.record_admin_action(
            creator_content_id=content_id,
            action=CreatorContentAdminAction.APPROVE.value,
            actor_user_id=moderator_user.id,
            previous_status="pending_review",
            new_status="published",
            reason="Contenu approuvé et publié.",
            created_at=now - timedelta(hours=2),
        )
        await repo.record_admin_action(
            creator_content_id=content_id,
            action=CreatorContentAdminAction.ARCHIVE.value,
            actor_user_id=moderator_user.id,
            previous_status="published",
            new_status="archived",
            reason="Contenu archivé.",
            created_at=now - timedelta(hours=1),
        )
        await session.commit()

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _actions_url(content_id),
        params={"page": 1, "page_size": 1},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 1
    assert data["page_size"] == 1


@pytest.mark.asyncio
async def test_content_actions_sorted_by_created_at_desc(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    factory = await _session_factory()
    async with factory() as session:
        org_id = await _partner_org_owner(session, partner.user_id, "sort")
        content = await _create_pending_content(
            session,
            org_id=org_id,
            author_id=partner.user_id,
        )
        content_id = content.id
        moderator_user = User(
            email=f"cc-audit-sort-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Sort Staff",
            city="Reims",
        )
        session.add(moderator_user)
        await session.flush()
        from app.core.creator_content_admin_constants import CreatorContentAdminAction
        from app.repositories.admin_partner_creator_content_repository import (
            AdminPartnerCreatorContentRepository,
        )

        repo = AdminPartnerCreatorContentRepository(session)
        now = datetime.now(UTC)
        await repo.record_admin_action(
            creator_content_id=content_id,
            action=CreatorContentAdminAction.APPROVE.value,
            actor_user_id=moderator_user.id,
            previous_status="pending_review",
            new_status="published",
            reason="Contenu approuvé et publié.",
            created_at=now - timedelta(hours=1),
        )
        await repo.record_admin_action(
            creator_content_id=content_id,
            action=CreatorContentAdminAction.ARCHIVE.value,
            actor_user_id=moderator_user.id,
            previous_status="published",
            new_status="archived",
            reason="Contenu archivé.",
            created_at=now,
        )
        await session.commit()

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _actions_url(content_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert items[0]["action"] == "archive"
    assert items[1]["action"] == "approve"
    timestamps = [item["created_at"] for item in items]
    assert timestamps == sorted(timestamps, reverse=True)


@pytest.mark.asyncio
async def test_content_action_actor_email_and_display_name(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    factory = await _session_factory()
    async with factory() as session:
        org_id = await _partner_org_owner(session, partner.user_id, "actor")
        content = await _create_pending_content(
            session,
            org_id=org_id,
            author_id=partner.user_id,
        )
        content_id = content.id
        await session.commit()

    display_name = f"Moderator Audit {uuid.uuid4().hex[:6]}"
    moderator = await rbac_user_factory(
        "MODERATOR",
        email=f"cc-mod-display-{uuid.uuid4().hex[:8]}@example.com",
    )
    async with factory() as session:
        profile = (
            await session.execute(
                select(UserProfile).where(UserProfile.user_id == moderator.user_id)
            )
        ).scalar_one()
        profile.display_name = display_name
        await session.commit()

    approve = await auth_client.post(
        f"{BASE}/{content_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert approve.status_code == 200

    response = await auth_client.get(
        _actions_url(content_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    actor = response.json()["items"][0]["actor_user"]
    assert actor["email"] == moderator.email
    assert actor["display_name"] == display_name


@pytest.mark.asyncio
async def test_content_actions_response_excludes_metadata(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    moderator = await rbac_user_factory("MODERATOR")
    factory = await _session_factory()
    async with factory() as session:
        org_id = await _partner_org_owner(session, partner.user_id, "meta")
        content = await _create_pending_content(
            session,
            org_id=org_id,
            author_id=partner.user_id,
        )
        content_id = content.id
        from app.repositories.admin_partner_creator_content_repository import (
            AdminPartnerCreatorContentRepository,
        )

        await AdminPartnerCreatorContentRepository(session).record_admin_action(
            creator_content_id=content_id,
            action="approve",
            actor_user_id=moderator.user_id,
            previous_status="pending_review",
            new_status="published",
            reason="Contenu approuvé et publié.",
            metadata={"internal": "secret"},
        )
        await session.commit()
    response = await auth_client.get(
        _actions_url(content_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    item = response.json()["items"][0]
    assert "metadata" not in item
