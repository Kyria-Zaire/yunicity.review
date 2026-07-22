"""Quartiers V2 hero asset tests (FEATURE-QUARTIERS-V2 / Q2-S1-04)."""

from __future__ import annotations

import pytest
from app.core.neighborhood_hero_assets import (
    FORBIDDEN_COVER_URL_FRAGMENTS,
    REIMS_NEIGHBORHOOD_HERO_SLUGS,
    neighborhood_dev_public_hero_url,
    neighborhood_hero_storage_key,
)
from app.db.seeds.reims_neighborhoods import REIMS_NEIGHBORHOOD_SEED, seed_reims_neighborhoods
from app.db.seeds.reims_neighborhoods_v2_editorial import seed_reims_neighborhoods_v2_editorial
from app.db.seeds.reims_neighborhoods_v2_hero_assets import seed_reims_neighborhoods_v2_hero_assets
from app.db.session import get_engine
from app.models.neighborhood import Neighborhood
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


async def _seed_all_v2(session: AsyncSession) -> None:
    await seed_reims_neighborhoods(session)
    await seed_reims_neighborhoods_v2_editorial(session)
    await seed_reims_neighborhoods_v2_hero_assets(session)


@pytest.mark.asyncio
async def test_all_twelve_neighborhoods_have_hero_storage_keys(auth_client: AsyncClient) -> None:
    _ = auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await _seed_all_v2(session)
        await session.commit()
        rows = (
            (
                await session.execute(
                    select(Neighborhood)
                    .where(Neighborhood.city == "Reims")
                    .order_by(Neighborhood.slug)
                )
            )
            .scalars()
            .all()
        )

    assert len(rows) == len(REIMS_NEIGHBORHOOD_SEED)
    for hood in rows:
        assert hood.hero_image_storage_key == neighborhood_hero_storage_key(hood.slug)


@pytest.mark.asyncio
async def test_all_twelve_neighborhoods_have_cover_image_url(auth_client: AsyncClient) -> None:
    _ = auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await _seed_all_v2(session)
        await session.commit()
        rows = (
            (await session.execute(select(Neighborhood).where(Neighborhood.city == "Reims")))
            .scalars()
            .all()
        )

    assert len(rows) == len(REIMS_NEIGHBORHOOD_SEED)
    for hood in rows:
        assert hood.cover_image_url == neighborhood_dev_public_hero_url(hood.slug)


@pytest.mark.asyncio
async def test_boulingrin_detail_exposes_stable_hero_media(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods/boulingrin",
        params={"city": "Reims"},
    )
    assert response.status_code == 200, response.text
    body = response.json()

    assert body["cover_image_url"] == "/neighborhoods/reims/boulingrin/hero.jpg"
    assert body["hero"]["cover_image_url"] == "/neighborhoods/reims/boulingrin/hero.jpg"
    assert body["hero"]["hero_image_storage_key"] == "neighborhoods/reims/boulingrin/hero.jpg"


@pytest.mark.asyncio
async def test_seeded_cover_urls_have_no_forbidden_hotlinks(
    auth_client: AsyncClient,
) -> None:
    _ = auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await _seed_all_v2(session)
        await session.commit()
        rows = (
            (
                await session.execute(
                    select(Neighborhood.cover_image_url).where(Neighborhood.city == "Reims")
                )
            )
            .scalars()
            .all()
        )

    assert len(rows) == len(REIMS_NEIGHBORHOOD_SEED)
    for url in rows:
        assert url
        lowered = url.lower()
        for fragment in FORBIDDEN_COVER_URL_FRAGMENTS:
            assert fragment not in lowered, f"forbidden fragment {fragment!r} in {url!r}"


@pytest.mark.asyncio
async def test_list_neighborhoods_still_works_with_hero_urls(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods",
        params={"city": "Reims", "page_size": 50},
    )
    assert response.status_code == 200, response.text
    items = response.json()["items"]
    assert len(items) >= 12
    boulingrin = next(item for item in items if item["slug"] == "boulingrin")
    assert boulingrin["cover_image_url"] == "/neighborhoods/reims/boulingrin/hero.jpg"
    assert all(slug in {item["slug"] for item in items} for slug in REIMS_NEIGHBORHOOD_HERO_SLUGS)
