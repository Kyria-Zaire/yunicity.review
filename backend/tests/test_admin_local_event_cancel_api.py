"""Admin local event cancel API tests (ADMIN-05D-C1)."""

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
from app.models.event_admin_action import EventAdminAction
from app.models.local_event import LocalEvent
from app.models.organization import Organization
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/local-events"
PUBLIC_EVENTS = "/api/v1/events"
MAP_EVENTS = "/api/v1/map/events"

REIMS_BBOX: dict[str, float] = {
    "lat_min": 49.20,
    "lon_min": 3.90,
    "lat_max": 49.30,
    "lon_max": 4.10,
}


def _cancel_url(event_id: uuid.UUID) -> str:
    return f"{BASE}/{event_id}/cancel"


def _map_query(**extra: float | str | int) -> str:
    params = {**REIMS_BBOX, "city": "Reims", **extra}
    return "&".join(f"{key}={value}" for key, value in params.items())


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


async def _create_approved_event(
    session: AsyncSession,
    *,
    author_id: uuid.UUID,
    suffix: str | None = None,
    is_cancelled: bool = False,
    latitude: float | None = 49.25,
    longitude: float | None = 4.0,
) -> LocalEvent:
    tag = suffix or uuid.uuid4().hex[:8]
    org = Organization(
        slug=f"event-cancel-org-{tag}",
        name=f"Cancel Org {tag}",
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
        title=f"Cancel event {tag}",
        city="Reims",
        starts_at=datetime.now(UTC) + timedelta(days=4),
        location_name="Lieu cancel",
        latitude=latitude,
        longitude=longitude,
        moderation_status=LocalEventModerationStatus.APPROVED.value,
        visibility=LocalEventVisibility.PUBLIC.value,
        is_cancelled=is_cancelled,
    )
    if is_cancelled:
        event.cancelled_at = datetime.now(UTC)
        event.cancelled_by_user_id = author_id
    session.add(event)
    await session.flush()
    return event


async def _create_event_with_status(
    session: AsyncSession,
    *,
    author_id: uuid.UUID,
    moderation_status: str,
    suffix: str,
) -> LocalEvent:
    org = Organization(
        slug=f"event-cancel-status-{suffix}",
        name=f"Status Org {suffix}",
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
        title=f"Status event {suffix}",
        city="Reims",
        starts_at=datetime.now(UTC) + timedelta(days=2),
        location_name="Lieu status",
        moderation_status=moderation_status,
        visibility=LocalEventVisibility.PUBLIC.value,
    )
    session.add(event)
    await session.flush()
    return event


async def _latest_cancel_audit(session: AsyncSession, event_id: uuid.UUID) -> EventAdminAction:
    stmt = (
        select(EventAdminAction)
        .where(
            EventAdminAction.local_event_id == event_id,
            EventAdminAction.action == "cancel",
        )
        .order_by(EventAdminAction.created_at.desc())
        .limit(1)
    )
    entry = (await session.execute(stmt)).scalar_one()
    return entry


@pytest.mark.asyncio
async def test_moderator_can_cancel_approved_event(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_approved_event(
            session, author_id=moderator.user_id, suffix="ok"
        )
        event_id = event.id
        await session.commit()

    response = await auth_client.post(
        _cancel_url(event_id),
        headers=auth_header(moderator.access_token),
        json={"reason": "Annulation opérationnelle staff."},
    )
    assert response.status_code == 200, response.text
    assert response.json()["is_cancelled"] is True


@pytest.mark.asyncio
async def test_user_denied_cancel_event(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_approved_event(
            session, author_id=moderator.user_id, suffix="403"
        )
        event_id = event.id
        await session.commit()

    user = await rbac_user_factory()
    response = await auth_client.post(
        _cancel_url(event_id),
        headers=auth_header(user.access_token),
        json={"reason": "Tentative non autorisée"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_pending_review_cannot_be_cancelled(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_event_with_status(
            session,
            author_id=moderator.user_id,
            moderation_status=LocalEventModerationStatus.PENDING_REVIEW.value,
            suffix="pending",
        )
        event_id = event.id
        await session.commit()

    response = await auth_client.post(
        _cancel_url(event_id),
        headers=auth_header(moderator.access_token),
        json={"reason": "Tentative sur pending"},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "EVENT_CANCEL_NOT_ALLOWED"


@pytest.mark.asyncio
async def test_rejected_cannot_be_cancelled(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_event_with_status(
            session,
            author_id=moderator.user_id,
            moderation_status=LocalEventModerationStatus.REJECTED.value,
            suffix="rejected",
        )
        event_id = event.id
        await session.commit()

    response = await auth_client.post(
        _cancel_url(event_id),
        headers=auth_header(moderator.access_token),
        json={"reason": "Tentative sur rejected"},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "EVENT_CANCEL_NOT_ALLOWED"


@pytest.mark.asyncio
async def test_already_cancelled_refused(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_approved_event(
            session,
            author_id=moderator.user_id,
            suffix="already",
            is_cancelled=True,
        )
        event_id = event.id
        await session.commit()

    response = await auth_client.post(
        _cancel_url(event_id),
        headers=auth_header(moderator.access_token),
        json={"reason": "Double annulation"},
    )
    assert response.status_code == 409
    assert response.json()["code"] == "EVENT_ALREADY_CANCELLED"


@pytest.mark.asyncio
async def test_cancel_reason_required(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_approved_event(
            session, author_id=moderator.user_id, suffix="no-reason"
        )
        event_id = event.id
        await session.commit()

    response = await auth_client.post(
        _cancel_url(event_id),
        headers=auth_header(moderator.access_token),
        json={},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_cancel_reason_too_short(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_approved_event(
            session, author_id=moderator.user_id, suffix="short"
        )
        event_id = event.id
        await session.commit()

    response = await auth_client.post(
        _cancel_url(event_id),
        headers=auth_header(moderator.access_token),
        json={"reason": "ab"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_cancel_sets_cancelled_at_and_actor(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_approved_event(
            session, author_id=moderator.user_id, suffix="fields"
        )
        event_id = event.id
        await session.commit()

    response = await auth_client.post(
        _cancel_url(event_id),
        headers=auth_header(moderator.access_token),
        json={"reason": "Annulation avec horodatage."},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["cancelled_at"] is not None
    assert data["cancelled_by_user_id"] == str(moderator.user_id)

    async with factory() as session:
        row = await session.get(LocalEvent, event_id)
        assert row is not None
        assert row.cancelled_at is not None
        assert row.cancelled_by_user_id == moderator.user_id


@pytest.mark.asyncio
async def test_cancel_writes_audit_with_reason(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    reason = "Motif d'annulation staff documenté."
    async with factory() as session:
        event = await _create_approved_event(
            session, author_id=moderator.user_id, suffix="audit"
        )
        event_id = event.id
        await session.commit()

    response = await auth_client.post(
        _cancel_url(event_id),
        headers=auth_header(moderator.access_token),
        json={"reason": reason},
    )
    assert response.status_code == 200

    async with factory() as session:
        entry = await _latest_cancel_audit(session, event_id)
        assert entry.action == "cancel"
        assert entry.previous_status == LocalEventModerationStatus.APPROVED.value
        assert entry.new_status == LocalEventModerationStatus.APPROVED.value
        assert entry.reason == reason
        assert entry.actor_user_id == moderator.user_id
        assert entry.metadata_ == {"is_cancelled": True}


@pytest.mark.asyncio
async def test_cancel_audit_metadata_not_exposed_in_actions_list(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_approved_event(
            session, author_id=moderator.user_id, suffix="meta"
        )
        event_id = event.id
        await session.commit()

    cancel = await auth_client.post(
        _cancel_url(event_id),
        headers=auth_header(moderator.access_token),
        json={"reason": "Annulation avec metadata interne."},
    )
    assert cancel.status_code == 200

    response = await auth_client.get(
        f"{BASE}/{event_id}/actions",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["action"] == "cancel"
    assert "metadata" not in item


@pytest.mark.asyncio
async def test_cancel_deactivates_feed_post(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_event_with_status(
            session,
            author_id=moderator.user_id,
            moderation_status=LocalEventModerationStatus.PENDING_REVIEW.value,
            suffix="feed",
        )
        event_id = event.id
        await session.commit()

    approve = await auth_client.post(
        f"{BASE}/{event_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert approve.status_code == 200

    async with factory() as session:
        from app.repositories.post_repository import PostRepository

        post = await PostRepository(session).get_by_local_event_id(event_id)
        assert post is not None
        assert post.is_active is True

    cancel = await auth_client.post(
        _cancel_url(event_id),
        headers=auth_header(moderator.access_token),
        json={"reason": "Retrait du fil d'actualité."},
    )
    assert cancel.status_code == 200

    async with factory() as session:
        from app.repositories.post_repository import PostRepository

        post = await PostRepository(session).get_by_local_event_id(event_id)
        assert post is not None
        assert post.is_active is False


@pytest.mark.asyncio
async def test_cancel_detail_response_is_cancelled_true(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_approved_event(
            session, author_id=moderator.user_id, suffix="detail"
        )
        event_id = event.id
        await session.commit()

    response = await auth_client.post(
        _cancel_url(event_id),
        headers=auth_header(moderator.access_token),
        json={"reason": "Vérification payload détail."},
    )
    assert response.status_code == 200
    assert response.json()["is_cancelled"] is True
    assert response.json()["moderation_status"] == LocalEventModerationStatus.APPROVED.value


@pytest.mark.asyncio
async def test_public_event_detail_returns_410_when_cancelled(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    async with factory() as session:
        event = await _create_approved_event(
            session, author_id=moderator.user_id, suffix="public410"
        )
        event_id = event.id
        await session.commit()

    cancel = await auth_client.post(
        _cancel_url(event_id),
        headers=auth_header(moderator.access_token),
        json={"reason": "Annulation visible côté public."},
    )
    assert cancel.status_code == 200

    response = await auth_client.get(f"{PUBLIC_EVENTS}/{event_id}")
    assert response.status_code == 410
    assert response.json()["code"] == "EVENT_CANCELLED"


@pytest.mark.asyncio
async def test_map_excludes_event_after_staff_cancel(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    moderator = await rbac_user_factory("MODERATOR")
    marker = f"map-cancel-api-{uuid.uuid4().hex[:8]}"
    async with factory() as session:
        event = await _create_approved_event(
            session,
            author_id=moderator.user_id,
            suffix=marker,
            latitude=49.25,
            longitude=4.0,
        )
        event.title = marker
        event_id = event.id
        await session.commit()

    before = await auth_client.get(f"{MAP_EVENTS}?{_map_query()}")
    assert before.status_code == 200
    assert marker in [item["title"] for item in before.json()["events"]]

    cancel = await auth_client.post(
        _cancel_url(event_id),
        headers=auth_header(moderator.access_token),
        json={"reason": "Retrait carte après annulation."},
    )
    assert cancel.status_code == 200

    after = await auth_client.get(f"{MAP_EVENTS}?{_map_query()}")
    assert after.status_code == 200
    assert marker not in [item["title"] for item in after.json()["events"]]
