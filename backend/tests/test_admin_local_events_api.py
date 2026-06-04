"""Admin local events detail API tests (ADMIN-05C)."""

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
from app.models.local_event import EventInterest, LocalEvent
from app.models.organization import Organization
from app.models.user import User
from httpx import AsyncClient
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


async def _seed_event_with_interest(
    session: AsyncSession,
    *,
    suffix: str,
    author_id: uuid.UUID,
    moderation_status: str = LocalEventModerationStatus.PENDING_REVIEW.value,
) -> LocalEvent:
    org = Organization(
        slug=f"admin-event-detail-org-{suffix}",
        name=f"Org detail {suffix}",
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
        title=f"Événement staff {suffix}",
        description="Description test staff.",
        city="Reims",
        starts_at=datetime.now(UTC) + timedelta(days=4),
        ends_at=datetime.now(UTC) + timedelta(days=4, hours=3),
        location_name="Salle municipale",
        address="1 rue de test",
        moderation_status=moderation_status,
        visibility=LocalEventVisibility.PUBLIC.value,
    )
    session.add(event)
    await session.flush()

    citizen = User(
        email=f"event-interest-{suffix}@example.com",
        hashed_password="hashed",
        full_name="Citizen Interest",
        city="Reims",
    )
    session.add(citizen)
    await session.flush()
    session.add(EventInterest(user_id=citizen.id, event_id=event.id))
    return event


@pytest.mark.asyncio
async def test_moderator_can_get_event_detail(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    suffix = uuid.uuid4().hex[:8]

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        event = await _seed_event_with_interest(
            session,
            suffix=suffix,
            author_id=moderator.user_id,
        )
        event_id = event.id
        await session.commit()

    response = await auth_client.get(
        f"{BASE}/{event_id}",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["id"] == str(event_id)
    assert data["title"] == f"Événement staff {suffix}"
    assert data["city"] == "Reims"
    assert data["location_name"] == "Salle municipale"
    assert data["address"] == "1 rue de test"
    assert data["moderation_status"] == LocalEventModerationStatus.PENDING_REVIEW.value
    assert data["visibility"] == LocalEventVisibility.PUBLIC.value
    assert data["interest_count"] == 1
    assert data["organization"]["name"] == f"Org detail {suffix}"
    assert data["organization"]["verification_status"] == VerificationStatus.VERIFIED.value
    assert data["organization"]["visibility"] == OrganizationVisibility.PUBLIC.value


@pytest.mark.asyncio
async def test_get_event_detail_not_found(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        f"{BASE}/{uuid.uuid4()}",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 404
    assert response.json()["code"] == "EVENT_NOT_FOUND"


@pytest.mark.asyncio
async def test_regular_user_denied_event_detail(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.get(
        f"{BASE}/{uuid.uuid4()}",
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"
