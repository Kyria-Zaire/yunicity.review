"""Admin local event moderation audit API tests (ADMIN-05D-A)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta

import pytest
from app.core.local_event_constants import (
    LocalEventModerationStatus,
    LocalEventVisibility,
)
from app.core.organization_constants import (
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from app.models.local_event import LocalEvent
from app.models.organization import Organization
from app.models.user import User
from app.models.user_profile import UserProfile
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/local-events"


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


async def _create_pending_event(
    session: AsyncSession,
    *,
    author_id: uuid.UUID,
    suffix: str | None = None,
) -> LocalEvent:
    tag = suffix or uuid.uuid4().hex[:8]
    org = Organization(
        slug=f"event-audit-org-{tag}",
        name=f"Event Audit Org {tag}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.PENDING,
        visibility=OrganizationVisibility.PRIVATE,
    )
    session.add(org)
    await session.flush()
    event = LocalEvent(
        organization_id=org.id,
        created_by_user_id=author_id,
        title=f"Audit event {tag}",
        city="Reims",
        starts_at=datetime.now(UTC) + timedelta(days=3),
        location_name="Lieu audit",
        moderation_status=LocalEventModerationStatus.PENDING_REVIEW.value,
        visibility=LocalEventVisibility.PUBLIC.value,
    )
    session.add(event)
    await session.flush()
    return event


async def _create_approved_event(
    session: AsyncSession,
    *,
    author_id: uuid.UUID,
    suffix: str | None = None,
) -> LocalEvent:
    tag = suffix or uuid.uuid4().hex[:8]
    org = Organization(
        slug=f"event-audit-approved-org-{tag}",
        name=f"Approved Org {tag}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PUBLIC,
    )
    session.add(org)
    await session.flush()
    event = LocalEvent(
        organization_id=org.id,
        created_by_user_id=author_id,
        title=f"Approved audit {tag}",
        city="Reims",
        starts_at=datetime.now(UTC) + timedelta(days=5),
        location_name="Lieu approved",
        moderation_status=LocalEventModerationStatus.APPROVED.value,
        visibility=LocalEventVisibility.PUBLIC.value,
    )
    session.add(event)
    await session.flush()
    return event


async def _count_audit(session: AsyncSession, event_id: uuid.UUID) -> int:
    from app.repositories.admin_local_event_repository import AdminLocalEventRepository

    return await AdminLocalEventRepository(session).count_admin_actions(event_id)


def _actions_url(event_id: uuid.UUID) -> str:
    return f"{BASE}/{event_id}/actions"


@pytest.mark.asyncio
async def test_approve_writes_audit_entry(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_pending_event(session, author_id=moderator.user_id, suffix="approve")
        event_id = event.id
        await session.commit()

    response = await auth_client.post(
        f"{BASE}/{event_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text

    async with factory() as session:
        assert await _count_audit(session, event_id) == 1

    actions = await auth_client.get(
        _actions_url(event_id),
        headers=auth_header(moderator.access_token),
    )
    assert actions.status_code == 200
    item = actions.json()["items"][0]
    assert item["action"] == "approve"
    assert item["previous_status"] == "pending_review"
    assert item["new_status"] == "approved"
    assert item["reason"] == "Événement approuvé."


@pytest.mark.asyncio
async def test_reject_writes_audit_with_payload_reason(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_pending_event(session, author_id=moderator.user_id, suffix="reject")
        event_id = event.id
        await session.commit()

    reject_reason = "Contenu non conforme aux règles locales"
    response = await auth_client.post(
        f"{BASE}/{event_id}/reject",
        headers=auth_header(moderator.access_token),
        json={"reason": reject_reason},
    )
    assert response.status_code == 200, response.text

    actions = await auth_client.get(
        _actions_url(event_id),
        headers=auth_header(moderator.access_token),
    )
    assert actions.status_code == 200
    item = actions.json()["items"][0]
    assert item["action"] == "reject"
    assert item["reason"] == reject_reason


@pytest.mark.asyncio
async def test_no_audit_when_moderation_action_fails(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_pending_event(session, author_id=moderator.user_id, suffix="fail")
        event_id = event.id
        await session.commit()

    first = await auth_client.post(
        f"{BASE}/{event_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert first.status_code == 200

    second = await auth_client.post(
        f"{BASE}/{event_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert second.status_code == 409
    assert second.json()["code"] == "EVENT_STATUS_TRANSITION_FORBIDDEN"

    async with factory() as session:
        assert await _count_audit(session, event_id) == 1


@pytest.mark.asyncio
async def test_moderator_can_list_event_actions(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_pending_event(session, author_id=moderator.user_id, suffix="list")
        event_id = event.id
        await session.commit()

    approve = await auth_client.post(
        f"{BASE}/{event_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert approve.status_code == 200

    response = await auth_client.get(
        _actions_url(event_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1


@pytest.mark.asyncio
async def test_user_denied_list_event_actions(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_pending_event(session, author_id=moderator.user_id, suffix="403")
        event_id = event.id
        await session.commit()

    user = await rbac_user_factory()
    response = await auth_client.get(
        _actions_url(event_id),
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_unknown_event_actions_returns_404(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _actions_url(uuid.uuid4()),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 404
    assert response.json()["code"] == "EVENT_NOT_FOUND"


@pytest.mark.asyncio
async def test_event_actions_pagination(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_pending_event(session, author_id=moderator.user_id, suffix="page")
        event_id = event.id
        staff_user = User(
            email=f"event-audit-staff-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Staff Audit",
            city="Reims",
        )
        session.add(staff_user)
        await session.flush()
        from app.core.event_admin_constants import EventAdminAction
        from app.repositories.admin_local_event_repository import AdminLocalEventRepository

        repo = AdminLocalEventRepository(session)
        now = datetime.now(UTC)
        await repo.record_admin_action(
            local_event_id=event_id,
            action=EventAdminAction.APPROVE.value,
            actor_user_id=staff_user.id,
            previous_status="pending_review",
            new_status="approved",
            reason="Événement approuvé.",
            created_at=now - timedelta(hours=2),
        )
        await repo.record_admin_action(
            local_event_id=event_id,
            action=EventAdminAction.REJECT.value,
            actor_user_id=staff_user.id,
            previous_status="approved",
            new_status="rejected",
            reason="Retrait temporaire",
            created_at=now - timedelta(hours=1),
        )
        await session.commit()

    mod = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _actions_url(event_id),
        params={"page": 1, "page_size": 1},
        headers=auth_header(mod.access_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 1
    assert data["page_size"] == 1


@pytest.mark.asyncio
async def test_event_actions_sorted_by_created_at_desc(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        author = User(
            email=f"event-author-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Author",
            city="Reims",
        )
        session.add(author)
        await session.flush()
        event = await _create_pending_event(session, author_id=author.id, suffix="sort")
        event_id = event.id
        staff_user = User(
            email=f"event-audit-sort-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Sort Staff",
            city="Reims",
        )
        session.add(staff_user)
        await session.flush()
        from app.core.event_admin_constants import EventAdminAction
        from app.repositories.admin_local_event_repository import AdminLocalEventRepository

        repo = AdminLocalEventRepository(session)
        now = datetime.now(UTC)
        await repo.record_admin_action(
            local_event_id=event_id,
            action=EventAdminAction.APPROVE.value,
            actor_user_id=staff_user.id,
            previous_status="pending_review",
            new_status="approved",
            reason="Événement approuvé.",
            created_at=now - timedelta(hours=1),
        )
        await repo.record_admin_action(
            local_event_id=event_id,
            action=EventAdminAction.REJECT.value,
            actor_user_id=staff_user.id,
            previous_status="approved",
            new_status="rejected",
            reason="Motif récent",
            created_at=now,
        )
        await session.commit()

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _actions_url(event_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert items[0]["action"] == "reject"
    assert items[1]["action"] == "approve"
    timestamps = [item["created_at"] for item in items]
    assert timestamps == sorted(timestamps, reverse=True)


@pytest.mark.asyncio
async def test_event_action_actor_email_and_display_name(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_pending_event(session, author_id=moderator.user_id, suffix="actor")
        event_id = event.id
        await session.commit()

    display_name = f"Moderator Event {uuid.uuid4().hex[:6]}"
    async with factory() as session:
        profile = (
            await session.execute(
                select(UserProfile).where(UserProfile.user_id == moderator.user_id)
            )
        ).scalar_one()
        profile.display_name = display_name
        await session.commit()

    approve = await auth_client.post(
        f"{BASE}/{event_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert approve.status_code == 200

    response = await auth_client.get(
        _actions_url(event_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    actor = response.json()["items"][0]["actor_user"]
    assert actor["email"] == moderator.email
    assert actor["display_name"] == display_name


@pytest.mark.asyncio
async def test_event_actions_response_excludes_metadata(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    factory = await _session_factory()
    async with factory() as session:
        event = await _create_pending_event(
            session,
            author_id=moderator.user_id,
            suffix="meta",
        )
        event_id = event.id
        from app.repositories.admin_local_event_repository import AdminLocalEventRepository

        await AdminLocalEventRepository(session).record_admin_action(
            local_event_id=event_id,
            action="approve",
            actor_user_id=moderator.user_id,
            previous_status="pending_review",
            new_status="approved",
            reason="Événement approuvé.",
            metadata={"internal": "secret"},
        )
        await session.commit()

    response = await auth_client.get(
        _actions_url(event_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    item = response.json()["items"][0]
    assert "metadata" not in item
