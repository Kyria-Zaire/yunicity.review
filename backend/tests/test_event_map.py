"""Event map API tests (FEATURE-D / TICKET-D.3)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, cast

import pytest
from app.core.local_event_constants import (
    LocalEventModerationStatus,
    LocalEventVisibility,
)
from app.core.map_constants import MAP_RATE_LIMIT
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from app.models.local_event import LocalEvent
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_passport import auth_header
from tests.conftest_rbac import RbacUserFactory, register_user

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

REIMS_BBOX: dict[str, float] = {
    "lat_min": 49.20,
    "lon_min": 3.90,
    "lat_max": 49.30,
    "lon_max": 4.10,
}


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> None:
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()


def _map_query(**extra: float | str | int) -> str:
    params = {**REIMS_BBOX, "city": "Reims", **extra}
    parts = [f"{key}={value}" for key, value in params.items()]
    return "&".join(parts)


async def _seed_event(
    session: AsyncSession,
    *,
    title: str,
    latitude: float | None,
    longitude: float | None,
    starts_at: datetime | None = None,
    city: str = "Reims",
    moderation_status: str = LocalEventModerationStatus.APPROVED.value,
    is_cancelled: bool = False,
) -> uuid.UUID:
    event = LocalEvent(
        created_by_user_id=uuid.uuid4(),
        title=title,
        city=city,
        starts_at=starts_at or datetime.now(UTC) + timedelta(days=2),
        location_name="Lieu test",
        latitude=latitude,
        longitude=longitude,
        moderation_status=moderation_status,
        visibility=LocalEventVisibility.PUBLIC.value,
        is_cancelled=is_cancelled,
    )
    session.add(event)
    await session.flush()
    return event.id


@pytest.mark.asyncio
async def test_map_events_returns_events_in_bbox(auth_client: AsyncClient) -> None:
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    marker = f"map-in-{uuid.uuid4().hex[:8]}"
    async with factory() as session:
        await _seed_event(
            session,
            title=marker,
            latitude=49.25,
            longitude=4.0,
        )
        await _seed_event(
            session,
            title="hors bbox",
            latitude=48.5,
            longitude=4.0,
        )
        await session.commit()

    response = await auth_client.get(f"/api/v1/map/events?{_map_query()}")
    assert response.status_code == 200, response.text
    data = response.json()
    titles = [item["title"] for item in data["events"]]
    assert marker in titles
    assert "hors bbox" not in titles
    assert data["count"] >= 1
    assert data["bbox"]["lat_min"] == REIMS_BBOX["lat_min"]


@pytest.mark.asyncio
async def test_map_events_excludes_without_coordinates(auth_client: AsyncClient) -> None:
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    marker = f"map-nocoords-{uuid.uuid4().hex[:8]}"
    async with factory() as session:
        await _seed_event(session, title=marker, latitude=None, longitude=None)
        await session.commit()

    response = await auth_client.get(f"/api/v1/map/events?{_map_query()}")
    assert response.status_code == 200, response.text
    titles = [item["title"] for item in response.json()["events"]]
    assert marker not in titles


@pytest.mark.asyncio
async def test_map_events_excludes_expired(auth_client: AsyncClient) -> None:
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    marker = f"map-past-{uuid.uuid4().hex[:8]}"
    async with factory() as session:
        await _seed_event(
            session,
            title=marker,
            latitude=49.25,
            longitude=4.0,
            starts_at=datetime.now(UTC) - timedelta(days=1),
        )
        await session.commit()

    response = await auth_client.get(f"/api/v1/map/events?{_map_query()}")
    assert response.status_code == 200, response.text
    assert marker not in [item["title"] for item in response.json()["events"]]


@pytest.mark.asyncio
async def test_map_events_excludes_cancelled_and_pending(auth_client: AsyncClient) -> None:
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    cancelled = f"map-cancel-{uuid.uuid4().hex[:8]}"
    pending = f"map-pending-{uuid.uuid4().hex[:8]}"
    async with factory() as session:
        await _seed_event(
            session,
            title=cancelled,
            latitude=49.25,
            longitude=4.0,
            is_cancelled=True,
        )
        await _seed_event(
            session,
            title=pending,
            latitude=49.25,
            longitude=4.0,
            moderation_status=LocalEventModerationStatus.PENDING_REVIEW.value,
        )
        await session.commit()

    response = await auth_client.get(f"/api/v1/map/events?{_map_query()}")
    assert response.status_code == 200, response.text
    titles = [item["title"] for item in response.json()["events"]]
    assert cancelled not in titles
    assert pending not in titles


@pytest.mark.asyncio
async def test_map_events_city_filter(auth_client: AsyncClient) -> None:
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    reims_title = f"map-reims-{uuid.uuid4().hex[:8]}"
    lyon_title = f"map-lyon-{uuid.uuid4().hex[:8]}"
    async with factory() as session:
        await _seed_event(
            session,
            title=reims_title,
            latitude=49.25,
            longitude=4.0,
            city="Reims",
        )
        await _seed_event(
            session,
            title=lyon_title,
            latitude=49.25,
            longitude=4.0,
            city="Lyon",
        )
        await session.commit()

    response = await auth_client.get(f"/api/v1/map/events?{_map_query(city='Reims')}")
    assert response.status_code == 200, response.text
    titles = [item["title"] for item in response.json()["events"]]
    assert reims_title in titles
    assert lyon_title not in titles


@pytest.mark.asyncio
async def test_map_events_respects_limit_and_truncated(auth_client: AsyncClient) -> None:
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    prefix = f"map-limit-{uuid.uuid4().hex[:6]}"
    tight_bbox = "lat_min=49.240&lon_min=3.995&lat_max=49.246&lon_max=4.005&city=Reims"
    async with factory() as session:
        for index in range(6):
            await _seed_event(
                session,
                title=f"{prefix}-{index}",
                latitude=49.241 + index * 0.001,
                longitude=4.0,
            )
        await session.commit()

    response = await auth_client.get(f"/api/v1/map/events?{tight_bbox}&limit=5")
    assert response.status_code == 200, response.text
    data = response.json()
    matching = [item for item in data["events"] if item["title"].startswith(prefix)]
    assert len(matching) == 5
    assert data["truncated"] is True
    assert data["count"] == 5


@pytest.mark.asyncio
async def test_map_events_invalid_bbox(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        "/api/v1/map/events?"
        "lat_min=49.30&lat_max=49.20&lon_min=3.9&lon_max=4.1&city=Reims"
    )
    assert response.status_code == 422, response.text
    assert response.json()["code"] == "INVALID_BBOX"


@pytest.mark.asyncio
async def test_map_events_bbox_too_large(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        "/api/v1/map/events?"
        "lat_min=49.0&lat_max=50.0&lon_min=3.0&lon_max=4.0&city=Reims"
    )
    assert response.status_code == 422, response.text
    assert response.json()["code"] == "BBOX_TOO_LARGE"


@pytest.mark.asyncio
async def test_map_events_requires_city_when_anonymous(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        "/api/v1/map/events?"
        "lat_min=49.20&lon_min=3.90&lat_max=49.30&lon_max=4.10"
    )
    assert response.status_code == 400, response.text
    assert response.json()["code"] == "CITY_REQUIRED"


@pytest.mark.asyncio
async def test_map_events_uses_profile_city_when_authenticated(
    auth_client: AsyncClient,
) -> None:
    user = await register_user(auth_client)
    complete = await auth_client.post(
        "/api/v1/profile/complete",
        json={"city": "Reims", "interests": ["culture"]},
        headers=auth_header(user.access_token),
    )
    assert complete.status_code == 200, complete.text

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    marker = f"map-auth-{uuid.uuid4().hex[:8]}"
    async with factory() as session:
        await _seed_event(session, title=marker, latitude=49.25, longitude=4.0)
        await session.commit()

    query = "&".join(f"{key}={value}" for key, value in REIMS_BBOX.items())
    response = await auth_client.get(
        f"/api/v1/map/events?{query}",
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 200, response.text
    assert marker in [item["title"] for item in response.json()["events"]]


@pytest.mark.asyncio
async def test_map_events_via_api_with_coordinates(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    from tests.conftest_rbac import auth_header as rbac_auth_header
    from tests.test_partner_offer_moderation import _verified_org_owner

    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _verified_org_owner(session, partner.user_id, "map-api")
        await session.commit()

    title = f"map-api-{uuid.uuid4().hex[:8]}"
    starts = datetime.now(UTC) + timedelta(days=4)
    create = await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=rbac_auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": title,
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Place Drouet",
            "latitude": 49.255,
            "longitude": 4.031,
        },
    )
    assert create.status_code == 201, create.text

    response = await auth_client.get(f"/api/v1/map/events?{_map_query()}")
    assert response.status_code == 200, response.text
    payload = cast(dict[str, Any], response.json())
    hit = next((e for e in payload["events"] if e["title"] == title), None)
    assert hit is not None
    assert hit["latitude"] == pytest.approx(49.255)
    assert hit["longitude"] == pytest.approx(4.031)


@pytest.mark.asyncio
async def test_map_events_rate_limit(auth_client: AsyncClient) -> None:
    redis = get_redis_client()
    if redis is None:
        pytest.skip("Redis requis pour tester le rate limiting map")

    for _ in range(MAP_RATE_LIMIT):
        ok = await auth_client.get(f"/api/v1/map/events?{_map_query()}")
        assert ok.status_code == 200, ok.text

    blocked = await auth_client.get(f"/api/v1/map/events?{_map_query()}")
    assert blocked.status_code == 429, blocked.text
    assert blocked.json()["code"] == "RATE_LIMITED"
