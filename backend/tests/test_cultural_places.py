"""Cultural places API tests (WEB-MAP-03)."""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncGenerator, Iterator

import pytest
from app.core.config import get_settings
from app.db.seeds.reims_cultural_places import (
    REIMS_CULTURAL_PLACES_SEED,
    seed_reims_cultural_places,
)
from app.db.seeds.reims_neighborhoods import seed_reims_neighborhoods
from app.db.session import dispose_db, get_session_factory, init_db
from app.main import create_app
from app.models.cultural_place import CulturalPlace
from httpx import ASGITransport, AsyncClient

_REIMS_LAT = 49.2538
_REIMS_LON = 4.0340


def _database_url() -> str | None:
    return os.environ.get("DATABASE_URL")


@pytest.fixture
def cultural_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    database_url = _database_url()
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip cultural places integration tests")
    monkeypatch.setenv("DATABASE_URL", database_url)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
async def cultural_client(cultural_env: None) -> AsyncGenerator[AsyncClient, None]:
    settings = get_settings()
    init_db(settings)
    application = create_app()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    await dispose_db()


@pytest.fixture
async def cultural_ready(cultural_client: AsyncClient) -> AsyncGenerator[None, None]:
    session_factory = get_session_factory()
    if session_factory is None:
        pytest.skip("Database session factory not configured")
    async with session_factory() as session:
        await seed_reims_neighborhoods(session)
        await seed_reims_cultural_places(session)
        await session.commit()
    yield


@pytest.mark.integration
@pytest.mark.anyio
async def test_list_cultural_places_city(
    cultural_client: AsyncClient,
    cultural_ready: None,
) -> None:
    response = await cultural_client.get(
        "/api/v1/cultural-places",
        params={"city": "Reims", "limit": 20},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["city"] == "Reims"
    assert body["count"] >= len(REIMS_CULTURAL_PLACES_SEED) - 2
    cathedral = next(i for i in body["items"] if i["slug"] == "cathedrale-notre-dame")
    assert cathedral["hero_image_url"]
    assert cathedral["photo_credit"]
    assert cathedral["image_source"] == "wikimedia_commons"
    assert len(cathedral["gallery_images"]) >= 2


@pytest.mark.integration
@pytest.mark.anyio
async def test_list_featured_filter(
    cultural_client: AsyncClient,
    cultural_ready: None,
) -> None:
    response = await cultural_client.get(
        "/api/v1/cultural-places",
        params={"city": "Reims", "featured": True, "limit": 8},
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) <= 8
    assert len(items) >= 4
    slugs = {item["slug"] for item in items}
    assert "cathedrale-notre-dame" in slugs
    priorities = [item["slug"] for item in items]
    assert priorities[0] == "cathedrale-notre-dame"


@pytest.mark.integration
@pytest.mark.anyio
async def test_inactive_excluded(
    cultural_client: AsyncClient,
    cultural_ready: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None
    inactive_slug = f"lieu-inactif-test-{uuid.uuid4().hex[:8]}"
    async with session_factory() as session:
        inactive = CulturalPlace(
            id=uuid.uuid4(),
            slug=inactive_slug,
            name="Lieu inactif",
            short_description="Ne doit pas apparaître",
            city="Reims",
            address="Test",
            latitude=_REIMS_LAT,
            longitude=_REIMS_LON,
            category="monument",
            source_name="Test",
            is_active=False,
            is_featured=False,
        )
        session.add(inactive)
        await session.commit()

    response = await cultural_client.get(
        "/api/v1/cultural-places",
        params={"city": "Reims", "limit": 50},
    )
    slugs = {item["slug"] for item in response.json()["items"]}
    assert inactive_slug not in slugs


@pytest.mark.integration
@pytest.mark.anyio
async def test_map_bbox_filters_places(
    cultural_client: AsyncClient,
    cultural_ready: None,
) -> None:
    tight: dict[str, str | int | float] = {
        "lat_min": 49.252,
        "lon_min": 4.032,
        "lat_max": 49.255,
        "lon_max": 4.036,
        "city": "Reims",
        "limit": 50,
    }
    response = await cultural_client.get("/api/v1/map/cultural-places", params=tight)
    assert response.status_code == 200
    places = response.json()["places"]
    assert len(places) >= 1
    for place in places:
        assert tight["lat_min"] <= place["latitude"] <= tight["lat_max"]
        assert tight["lon_min"] <= place["longitude"] <= tight["lon_max"]

    wide_empty: dict[str, str | float] = {
        "lat_min": 48.0,
        "lon_min": 2.0,
        "lat_max": 48.5,
        "lon_max": 2.5,
        "city": "Reims",
    }
    empty = await cultural_client.get("/api/v1/map/cultural-places", params=wide_empty)
    assert empty.json()["count"] == 0


@pytest.mark.integration
@pytest.mark.anyio
async def test_get_place_by_slug(
    cultural_client: AsyncClient,
    cultural_ready: None,
) -> None:
    response = await cultural_client.get(
        "/api/v1/cultural-places/cathedrale-notre-dame",
        params={"city": "Reims"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["slug"] == "cathedrale-notre-dame"
    assert body["name"]
    assert body["source_name"]
    assert body["hero_image_url"]
    assert body["editorial_excerpt"]
    assert body["gallery_images"]
    assert body["featured_priority"] >= 90
