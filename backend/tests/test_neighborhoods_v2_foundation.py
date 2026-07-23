"""Quartiers V2 foundation tests (FEATURE-QUARTIERS-V2 / Q2-S1-01)."""

from __future__ import annotations

import pytest
from app.db.seeds.reims_neighborhoods import REIMS_NEIGHBORHOOD_SEED, seed_reims_neighborhoods
from app.db.seeds.reims_neighborhoods_v2_editorial import (
    REIMS_NEIGHBORHOOD_V2_EDITORIAL,
    seed_reims_neighborhoods_v2_editorial,
)
from app.db.session import get_engine
from app.models.neighborhood import Neighborhood
from app.models.neighborhood_editorial import (
    NeighborhoodAlias,
    NeighborhoodMoodTag,
    NeighborhoodTimelineEntry,
)
from app.services.neighborhood_v2_presenter import slugify_alias_name
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


async def _seed_reims_v2(session: AsyncSession) -> None:
    await seed_reims_neighborhoods(session)
    await seed_reims_neighborhoods_v2_editorial(session)


@pytest.mark.asyncio
async def test_reims_neighborhood_catalog_has_twelve(auth_client: AsyncClient) -> None:
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await _seed_reims_v2(session)
        await session.commit()
        count = (
            await session.execute(
                select(func.count()).select_from(Neighborhood).where(Neighborhood.city == "Reims")
            )
        ).scalar_one()
    assert count == len(REIMS_NEIGHBORHOOD_SEED)  # 15 depuis QUARTIER-01 3b


@pytest.mark.asyncio
async def test_v2_editorial_seed_boulingrin(auth_client: AsyncClient) -> None:
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await _seed_reims_v2(session)
        await session.commit()

        hood = (
            await session.execute(
                select(Neighborhood).where(
                    Neighborhood.city == "Reims",
                    Neighborhood.slug == "boulingrin",
                )
            )
        ).scalar_one()

        assert hood.long_story
        assert len(hood.long_story) >= 300
        assert hood.featured_quote == "Le cœur gourmand de Reims."

        aliases = (
            (
                await session.execute(
                    select(NeighborhoodAlias).where(NeighborhoodAlias.neighborhood_id == hood.id)
                )
            )
            .scalars()
            .all()
        )
        assert any(a.alias == "Halles du Boulingrin" and a.is_primary for a in aliases)

        timeline = (
            await session.execute(
                select(func.count())
                .select_from(NeighborhoodTimelineEntry)
                .where(NeighborhoodTimelineEntry.neighborhood_id == hood.id)
            )
        ).scalar_one()
        assert timeline >= 3

        mood_tags = (
            await session.execute(select(func.count()).select_from(NeighborhoodMoodTag))
        ).scalar_one()
        assert mood_tags == 7


@pytest.mark.asyncio
async def test_v2_editorial_seed_covers_every_neighborhood(auth_client: AsyncClient) -> None:
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await _seed_reims_v2(session)
        await session.commit()

        with_story = (
            await session.execute(
                select(func.count())
                .select_from(Neighborhood)
                .where(
                    Neighborhood.city == "Reims",
                    Neighborhood.long_story.is_not(None),
                )
            )
        ).scalar_one()
        # Chaque entree editoriale pose un long_story (pas de nombre fige : le catalogue grandit).
        assert with_story == len(REIMS_NEIGHBORHOOD_V2_EDITORIAL)

    # Couverture totale : chaque quartier du catalogue a une entree editoriale, et inversement.
    editorial_slugs = {row["slug"] for row in REIMS_NEIGHBORHOOD_V2_EDITORIAL}
    base_slugs = {row["slug"] for row in REIMS_NEIGHBORHOOD_SEED}
    assert editorial_slugs == base_slugs


@pytest.mark.asyncio
async def test_v2_editorial_seed_idempotent(auth_client: AsyncClient) -> None:
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await _seed_reims_v2(session)
        await seed_reims_neighborhoods_v2_editorial(session)
        await session.commit()

        hood = (
            await session.execute(
                select(Neighborhood).where(
                    Neighborhood.city == "Reims",
                    Neighborhood.slug == "centre-ville",
                )
            )
        ).scalar_one()

        alias_count = (
            await session.execute(
                select(func.count())
                .select_from(NeighborhoodAlias)
                .where(NeighborhoodAlias.neighborhood_id == hood.id)
            )
        ).scalar_one()
        assert alias_count == 2


@pytest.mark.asyncio
async def test_get_neighborhood_detail_includes_v2_fields(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods/boulingrin",
        params={"city": "Reims"},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["slug"] == "boulingrin"
    assert body["long_story"]
    assert body["featured_quote"]
    assert body["aliases"]
    assert body["aliases"][0]["name"] == "Halles du Boulingrin"
    assert body["aliases"][0]["slug"] == slugify_alias_name("Halles du Boulingrin")
    assert "gourmet" in body["moods"]
    assert len(body["timeline"]) >= 3
    assert body["timeline"][0]["description"]


@pytest.mark.asyncio
async def test_list_neighborhoods_keeps_v1_lightweight(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods",
        params={"city": "Reims", "page_size": 50},
    )
    assert response.status_code == 200, response.text
    item = next(i for i in response.json()["items"] if i["slug"] == "boulingrin")
    assert item["aliases"] == []
    assert item["moods"] == []
    assert item["timeline"] == []
    assert item["long_story"] is None


@pytest.mark.asyncio
async def test_list_neighborhoods_includes_v2_slugs(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods",
        params={"city": "Reims", "page_size": 50},
    )
    assert response.status_code == 200, response.text
    slugs = {item["slug"] for item in response.json()["items"]}
    assert "maison-blanche" in slugs
    assert "la-neuvillette" in slugs


@pytest.mark.asyncio
async def test_get_neighborhood_v1_fields_unchanged(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods/saint-remi",
        params={"city": "Reims"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["display_name"] == "Saint-Remi"
    assert body["ambiance"] == "cultural"
    assert "id" in body
    assert "created_at" in body
