"""Signed partners API tests (WEB-PARTNERS-01)."""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncGenerator, Iterator

import pytest
from app.core.config import get_settings
from app.core.partner_constants import PartnershipType, PartnerStatus
from app.db.seeds.reims_signed_partners import (
    REIMS_SIGNED_PARTNERS_SEED,
    seed_reims_signed_partners,
)
from app.db.session import dispose_db, get_session_factory, init_db
from app.main import create_app
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select

_INTERNAL_KEYS = frozenset(
    {
        "notes_internal",
        "contract_reference",
        "contact_email",
        "contact_phone",
        "contact_name",
        "signed_at",
    }
)


def _database_url() -> str | None:
    return os.environ.get("DATABASE_URL")


@pytest.fixture
def partners_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    database_url = _database_url()
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip partners integration tests")
    monkeypatch.setenv("DATABASE_URL", database_url)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
async def partners_client(partners_env: None) -> AsyncGenerator[AsyncClient, None]:
    settings = get_settings()
    init_db(settings)
    application = create_app()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    await dispose_db()


@pytest.fixture
async def partners_ready(partners_client: AsyncClient) -> AsyncGenerator[None, None]:
    session_factory = get_session_factory()
    if session_factory is None:
        pytest.skip("Database session factory not configured")
    async with session_factory() as session:
        await seed_reims_signed_partners(session)
        await session.commit()
    yield


@pytest.mark.integration
async def test_seed_idempotent(partners_env: None) -> None:
    session_factory = get_session_factory()
    if session_factory is None:
        pytest.skip("Database session factory not configured")
    async with session_factory() as session:
        await seed_reims_signed_partners(session)
        await session.commit()
        count_first = await session.scalar(select(func.count()).select_from(PartnerProfile))
    async with session_factory() as session:
        await seed_reims_signed_partners(session)
        await session.commit()
        count_second = await session.scalar(select(func.count()).select_from(PartnerProfile))
    assert count_first == count_second
    assert count_second is not None
    assert count_second >= len(REIMS_SIGNED_PARTNERS_SEED)


@pytest.mark.integration
async def test_partner_profile_linked_to_organization(
    partners_ready: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        result = await session.execute(
            select(PartnerProfile, Organization)
            .join(Organization, PartnerProfile.organization_id == Organization.id)
            .where(Organization.slug == "belga-queen")
        )
        row = result.one()
        profile, org = row
        assert profile.organization_id == org.id
        assert org.name == "Belga Queen"


@pytest.mark.integration
async def test_list_partners_default_public_only(
    partners_client: AsyncClient,
    partners_ready: None,
) -> None:
    response = await partners_client.get("/api/v1/partners", params={"city": "Reims", "limit": 50})
    assert response.status_code == 200
    body = response.json()
    slugs = {item["slug"] for item in body["items"]}
    assert "belga-queen" in slugs
    assert "pittaya" in slugs
    assert "garcon-barbiers" in slugs
    assert "centre-des-ressources" in slugs
    assert "daiboken" not in slugs
    assert "ett-europe-top-team" not in slugs
    for item in body["items"]:
        assert item["partner_status"] in {
            PartnerStatus.ACTIVE.value,
            PartnerStatus.PREMIUM.value,
            PartnerStatus.FOUNDING_PARTNER.value,
        }


@pytest.mark.integration
async def test_signed_only_not_exposed_publicly(
    partners_client: AsyncClient,
    partners_ready: None,
) -> None:
    list_response = await partners_client.get(
        "/api/v1/partners",
        params={"city": "Reims", "status": PartnerStatus.SIGNED.value, "limit": 50},
    )
    assert list_response.status_code == 200
    assert list_response.json()["items"] == []

    detail_response = await partners_client.get(
        "/api/v1/partners/daiboken",
        params={"city": "Reims"},
    )
    assert detail_response.status_code == 404


@pytest.mark.integration
async def test_internal_fields_never_exposed(
    partners_client: AsyncClient,
    partners_ready: None,
) -> None:
    response = await partners_client.get(
        "/api/v1/partners/belga-queen",
        params={"city": "Reims"},
    )
    assert response.status_code == 200
    payload = response.json()
    for key in _INTERNAL_KEYS:
        assert key not in payload


@pytest.mark.integration
async def test_filters_city_type_featured(
    partners_client: AsyncClient,
    partners_ready: None,
) -> None:
    featured = await partners_client.get(
        "/api/v1/partners",
        params={"city": "Reims", "featured": True, "limit": 50},
    )
    assert featured.status_code == 200
    featured_items = featured.json()["items"]
    assert len(featured_items) >= 2
    assert all(item["is_featured"] for item in featured_items)

    restaurant = await partners_client.get(
        "/api/v1/partners",
        params={
            "city": "Reims",
            "type": PartnershipType.RESTAURANT.value,
            "limit": 50,
        },
    )
    assert restaurant.status_code == 200
    assert all(
        item["partnership_type"] == PartnershipType.RESTAURANT.value
        for item in restaurant.json()["items"]
    )
    assert any(item["slug"] == "pittaya" for item in restaurant.json()["items"])

    other_city = await partners_client.get(
        "/api/v1/partners",
        params={"city": "Paris", "limit": 50},
    )
    assert other_city.status_code == 200
    assert other_city.json()["items"] == []


@pytest.mark.integration
async def test_slug_detail_public_partner(
    partners_client: AsyncClient,
    partners_ready: None,
) -> None:
    response = await partners_client.get(
        "/api/v1/partners/pittaya",
        params={"city": "Reims"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["slug"] == "pittaya"
    assert body["name"] == "Pittaya"
    assert body["is_verified"] is True
    assert body["partner_status"] == PartnerStatus.ACTIVE.value


@pytest.mark.integration
async def test_signed_partner_has_no_sensitive_location_when_queried_via_db(
    partners_ready: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None
    org_id = uuid.UUID("d6040000-0000-4000-8000-000000000004")
    async with session_factory() as session:
        org = await session.get(Organization, org_id)
        assert org is not None
        org.address = "Adresse test interne"
        org.latitude = 49.25
        org.longitude = 4.03
        await session.commit()

    transport = ASGITransport(app=create_app())
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/partners/daiboken", params={"city": "Reims"})
    assert response.status_code == 404


@pytest.mark.integration
async def test_public_partner_detail_includes_created_at(
    partners_client: AsyncClient,
    partners_ready: None,
) -> None:
    response = await partners_client.get(
        "/api/v1/partners/pittaya",
        params={"city": "Reims"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "created_at" in body
    assert body["created_at"] is not None


@pytest.mark.integration
async def test_partner_without_coords_returns_null_coordinates(
    partners_client: AsyncClient,
    partners_ready: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None
    org_id = uuid.UUID("d6040000-0000-4000-8000-000000000009")
    async with session_factory() as session:
        org = await session.get(Organization, org_id)
        assert org is not None
        org.latitude = None
        org.longitude = None
        await session.commit()

    response = await partners_client.get(
        "/api/v1/partners/belga-queen",
        params={"city": "Reims"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["latitude"] is None
    assert body["longitude"] is None


@pytest.mark.integration
async def test_list_partners_active_status_filter(
    partners_client: AsyncClient,
    partners_ready: None,
) -> None:
    response = await partners_client.get(
        "/api/v1/partners",
        params={
            "city": "Reims",
            "status": PartnerStatus.ACTIVE.value,
            "limit": 50,
        },
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) >= 1
    assert all(item["partner_status"] == PartnerStatus.ACTIVE.value for item in items)
    assert any(item["slug"] == "pittaya" for item in items)
