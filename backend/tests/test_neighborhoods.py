"""Neighborhood foundation tests (TICKET-602)."""

from __future__ import annotations

import uuid

import pytest
from app.core.feed_constants import PostAuthorType, PostType
from app.db.seeds.reims_neighborhoods import REIMS_NEIGHBORHOOD_SEED, seed_reims_neighborhoods
from app.db.session import get_engine
from app.models.neighborhood import Neighborhood
from app.models.post import Post
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_passport import auth_header, register_user
from tests.conftest_rbac import RbacUserFactory
from tests.conftest_rbac import auth_header as rbac_auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.mark.asyncio
async def test_reims_neighborhood_seed_idempotent(auth_client: AsyncClient) -> None:
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await seed_reims_neighborhoods(session)
        await session.commit()
        count = (
            await session.execute(
                select(func.count()).select_from(Neighborhood).where(Neighborhood.city == "Reims")
            )
        ).scalar_one()
    assert count >= len(REIMS_NEIGHBORHOOD_SEED)


@pytest.mark.asyncio
async def test_list_neighborhoods_public(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/neighborhoods", params={"city": "Reims"})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["total"] >= 6
    slugs = {item["slug"] for item in body["items"]}
    assert "centre-ville" in slugs
    assert "boulingrin" in slugs


@pytest.mark.asyncio
async def test_get_neighborhood_by_slug(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods/saint-remi",
        params={"city": "Reims"},
    )
    assert response.status_code == 200
    assert response.json()["display_name"] == "Saint-Remi"
    assert response.json()["ambiance"] == "cultural"


@pytest.mark.asyncio
async def test_neighborhood_context(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods/centre-ville/context",
        params={"city": "Reims"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["neighborhood"]["slug"] == "centre-ville"
    assert "events_count" in data["stats"]


@pytest.mark.asyncio
async def test_admin_create_and_patch_neighborhood(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    staff = await rbac_user_factory("MODERATOR")
    headers = rbac_auth_header(staff.access_token)

    create = await auth_client.post(
        "/api/v1/admin/neighborhoods",
        headers=headers,
        json={
            "city": "Reims",
            "slug": "test-quartier-602",
            "display_name": "Quartier test",
            "short_description": "Zone de test QA.",
            "ambiance": "calm",
        },
    )
    assert create.status_code == 201, create.text

    patch = await auth_client.patch(
        "/api/v1/admin/neighborhoods/test-quartier-602",
        headers=headers,
        params={"city": "Reims"},
        json={"display_name": "Quartier test mis à jour"},
    )
    assert patch.status_code == 200
    assert patch.json()["display_name"] == "Quartier test mis à jour"

    deactivate = await auth_client.delete(
        "/api/v1/admin/neighborhoods/test-quartier-602",
        headers=headers,
        params={"city": "Reims"},
    )
    assert deactivate.status_code == 200
    assert deactivate.json()["is_active"] is False

    hidden = await auth_client.get(
        "/api/v1/neighborhoods/test-quartier-602",
        params={"city": "Reims"},
    )
    assert hidden.status_code == 404


@pytest.mark.asyncio
async def test_admin_neighborhood_forbidden_for_citizen(auth_client: AsyncClient) -> None:
    citizen = await register_user(auth_client, suffix="-hood-citizen")
    response = await auth_client.post(
        "/api/v1/admin/neighborhoods",
        headers=auth_header(citizen["access_token"]),
        json={
            "city": "Reims",
            "slug": "hack-hood",
            "display_name": "Hack",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_feed_neighborhood_summary_on_post(auth_client: AsyncClient) -> None:
    user = await register_user(auth_client, suffix="-hood-feed")
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        result = await session.execute(
            select(Neighborhood).where(
                Neighborhood.city == "Reims",
                Neighborhood.slug == "boulingrin",
            )
        )
        hood = result.scalar_one()
        post = Post(
            author_type=PostAuthorType.CITIZEN.value,
            author_id=uuid.UUID(str(user["user"]["id"])),
            type=PostType.POST.value,
            city="Reims",
            body="Un café au Boulingrin.",
            neighborhood_id=hood.id,
            is_active=True,
        )
        session.add(post)
        await session.commit()

    feed = await auth_client.get(
        "/api/v1/feed",
        headers=auth_header(user["access_token"]),
    )
    assert feed.status_code == 200
    items = feed.json()["items"]
    tagged = [i for i in items if i.get("neighborhood_summary")]
    assert any(i["neighborhood_summary"]["slug"] == "boulingrin" for i in tagged)


@pytest.mark.asyncio
async def test_nullable_neighborhood_on_entities(auth_client: AsyncClient) -> None:
    """Posts and related entities work without neighborhood_id."""
    user = await register_user(auth_client, suffix="-hood-null")
    create = await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": "Reims sans quartier explicite"},
        headers=auth_header(user["access_token"]),
    )
    assert create.status_code == 201
    assert create.json().get("neighborhood_summary") is None
