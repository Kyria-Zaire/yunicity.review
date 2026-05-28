"""Transit nearby API tests (WEB-MAP-02)."""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncGenerator, Generator, Iterator
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
from app.core.config import get_settings
from app.db.session import dispose_db, get_session_factory, init_db
from app.main import create_app
from app.models.transit import TransitDeparture, TransitFeedMeta, TransitStop
from app.services.transit_service import clear_transit_cache_for_tests
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

_PARIS = ZoneInfo("Europe/Paris")

_REIMS_OPERA_LAT = 49.2562
_REIMS_OPERA_LON = 4.0315
_TEST_STOP_EXTERNAL_ID = "TEST_OPERA"


def _database_url() -> str | None:
    return os.environ.get("DATABASE_URL")


@pytest.fixture(autouse=True)
def _clear_transit_cache() -> Generator[None, None, None]:
    clear_transit_cache_for_tests()
    yield
    clear_transit_cache_for_tests()


@pytest.fixture
def transit_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    database_url = _database_url()
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip transit integration tests")
    monkeypatch.setenv("DATABASE_URL", database_url)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
async def transit_client(transit_env: None) -> AsyncGenerator[AsyncClient, None]:
    settings = get_settings()
    init_db(settings)
    application = create_app()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    await dispose_db()


async def _clear_transit_tables(session: AsyncSession) -> None:
    await session.execute(delete(TransitDeparture))
    await session.execute(delete(TransitStop))
    await session.execute(delete(TransitFeedMeta))
    await session.commit()


@pytest.fixture
async def db_session(transit_client: AsyncClient) -> AsyncGenerator[AsyncSession, None]:
    session_factory = get_session_factory()
    if session_factory is None:
        pytest.skip("Database session factory not configured")

    async with session_factory() as session:
        await _clear_transit_tables(session)
        yield session
        await _clear_transit_tables(session)


@pytest.mark.integration
@pytest.mark.anyio
async def test_transit_nearby_empty_without_data(transit_client: AsyncClient) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        await _clear_transit_tables(session)

    response = await transit_client.get(
        "/api/v1/transit/nearby",
        params={"lat": _REIMS_OPERA_LAT, "lon": _REIMS_OPERA_LON, "city": "Reims"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "grand_reims_mobilites"
    assert body["mode"] == "scheduled"
    assert "indicatifs" in body["disclaimer"].lower()
    assert body["stops"] == []


@pytest.mark.integration
@pytest.mark.anyio
async def test_transit_nearby_returns_departures(
    transit_client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    stop = TransitStop(
        id=uuid.uuid4(),
        external_stop_id=_TEST_STOP_EXTERNAL_ID,
        name="Opéra",
        latitude=_REIMS_OPERA_LAT,
        longitude=_REIMS_OPERA_LON,
        city="Reims",
    )
    now = datetime.now(tz=_PARIS)
    departures = [
        TransitDeparture(
            id=uuid.uuid4(),
            stop_id=stop.id,
            route_short_name="A",
            route_type="tram",
            headsign="Neufchâtel",
            scheduled_at=now + timedelta(minutes=4),
            realtime=False,
        ),
        TransitDeparture(
            id=uuid.uuid4(),
            stop_id=stop.id,
            route_short_name="A",
            route_type="tram",
            headsign="Neufchâtel",
            scheduled_at=now + timedelta(minutes=12),
            realtime=False,
        ),
        TransitDeparture(
            id=uuid.uuid4(),
            stop_id=stop.id,
            route_short_name="3",
            route_type="bus",
            headsign="Boulingrin",
            scheduled_at=now + timedelta(minutes=7),
            realtime=False,
        ),
    ]
    meta = TransitFeedMeta(
        source="grand_reims_mobilites",
        mode="scheduled",
        gtfs_url="test://fixture",
        imported_at=now,
    )
    db_session.add(stop)
    await db_session.flush()
    db_session.add_all(departures)
    db_session.add(meta)
    await db_session.commit()

    response = await transit_client.get(
        "/api/v1/transit/nearby",
        params={
            "lat": _REIMS_OPERA_LAT,
            "lon": _REIMS_OPERA_LON,
            "city": "Reims",
            "radius_meters": 600,
            "limit": 5,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["stops"]) == 1
    stop_out = body["stops"][0]
    assert stop_out["name"] == "Opéra"
    assert stop_out["distance_meters"] < 50
    assert len(stop_out["departures"]) == 2
    routes = {d["route_short_name"] for d in stop_out["departures"]}
    assert "A" in routes
    assert all(d["realtime"] is False for d in stop_out["departures"])
    assert all(0 <= d["minutes"] <= 90 for d in stop_out["departures"])


@pytest.mark.integration
@pytest.mark.anyio
async def test_transit_nearby_filters_departures_outside_max_minutes(
    transit_client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    stop = TransitStop(
        id=uuid.uuid4(),
        external_stop_id=_TEST_STOP_EXTERNAL_ID,
        name="Opéra",
        latitude=_REIMS_OPERA_LAT,
        longitude=_REIMS_OPERA_LON,
        city="Reims",
    )
    now = datetime.now(tz=_PARIS)
    departures = [
        TransitDeparture(
            id=uuid.uuid4(),
            stop_id=stop.id,
            route_short_name="A",
            route_type="tram",
            headsign="Neufchâtel",
            scheduled_at=now + timedelta(minutes=5),
            realtime=False,
        ),
        TransitDeparture(
            id=uuid.uuid4(),
            stop_id=stop.id,
            route_short_name="A",
            route_type="tram",
            headsign="Neufchâtel",
            scheduled_at=now + timedelta(minutes=1000),
            realtime=False,
        ),
    ]
    meta = TransitFeedMeta(
        source="grand_reims_mobilites",
        mode="scheduled",
        gtfs_url="test://fixture",
        imported_at=now,
    )
    db_session.add(stop)
    await db_session.flush()
    db_session.add_all(departures)
    db_session.add(meta)
    await db_session.commit()

    response = await transit_client.get(
        "/api/v1/transit/nearby",
        params={
            "lat": _REIMS_OPERA_LAT,
            "lon": _REIMS_OPERA_LON,
            "city": "Reims",
            "radius_meters": 600,
            "limit": 5,
            "max_minutes": 90,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["stops"]) == 1
    stop_out = body["stops"][0]
    assert len(stop_out["departures"]) == 1
    assert stop_out["departures"][0]["minutes"] <= 90

    strict_response = await transit_client.get(
        "/api/v1/transit/nearby",
        params={
            "lat": _REIMS_OPERA_LAT,
            "lon": _REIMS_OPERA_LON,
            "city": "Reims",
            "radius_meters": 600,
            "limit": 5,
            "max_minutes": 3,
        },
    )
    assert strict_response.status_code == 200
    strict_body = strict_response.json()
    assert strict_body["stops"] == []


def test_gtfs_time_parsing() -> None:
    from app.services.gtfs_import import _gtfs_time_to_datetime

    day = datetime(2026, 5, 19, tzinfo=_PARIS).date()
    dt = _gtfs_time_to_datetime(day, "25:30:00")
    assert dt.day == 20
    assert dt.hour == 1
    assert dt.minute == 30
