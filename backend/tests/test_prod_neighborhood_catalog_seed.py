"""Production neighborhood catalog seed tests (FEATURE-PROD-DATA-05 / 05A)."""

from __future__ import annotations

import pytest
from app.core.config import Settings
from app.core.neighborhood_hero_assets import (
    REIMS_NEIGHBORHOOD_HERO_SLUGS,
    neighborhood_dev_public_hero_url,
    neighborhood_seed_cover_url,
)
from app.db.seeds.reims_neighborhoods import REIMS_NEIGHBORHOOD_SEED
from app.db.seeds.reims_neighborhoods_catalog import (
    REIMS_OFFICIAL_NEIGHBORHOOD_COUNT,
    seed_reims_neighborhoods_catalog,
)
from app.db.session import get_engine
from app.models.neighborhood import Neighborhood
from httpx import AsyncClient
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark_integration = [pytest.mark.integration, pytest.mark.asyncio]


def test_neighborhood_seed_cover_url_prod() -> None:
    url = neighborhood_seed_cover_url(
        "boulingrin",
        app_env="prod",
        web_frontend_url="https://yunicity.city",
    )
    assert url == "https://yunicity.city/neighborhoods/reims/boulingrin/hero.jpg"


def test_neighborhood_seed_cover_url_dev() -> None:
    url = neighborhood_seed_cover_url(
        "boulingrin",
        app_env="dev",
        web_frontend_url="http://localhost:3000",
    )
    assert url == neighborhood_dev_public_hero_url("boulingrin")


@pytest.mark.asyncio
@pytest.mark.integration
async def test_prod_catalog_seed_creates_twelve(auth_client: AsyncClient) -> None:
    _ = auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = Settings(
        APP_ENV="prod",
        DEBUG=False,
        JWT_SECRET_KEY="x" * 48,
        REFRESH_TOKEN_PEPPER="y" * 32,
        REFRESH_COOKIE_SECURE=True,
        WEB_FRONTEND_URL="https://yunicity.city",
        CORS_ORIGINS=["https://yunicity.city"],
        MEDIA_PUBLIC_BASE_URL="https://api.yunicity.city",
        EMAIL_PROVIDER="console",
    )
    async with factory() as session:
        await session.execute(delete(Neighborhood))
        await session.flush()
        result = await seed_reims_neighborhoods_catalog(session, settings)
        await session.commit()

        count = (
            await session.execute(
                select(func.count()).select_from(Neighborhood).where(Neighborhood.city == "Reims")
            )
        ).scalar_one()

    assert result.neighborhoods_total == REIMS_OFFICIAL_NEIGHBORHOOD_COUNT == 12
    assert result.editorial_applied == 12
    assert result.hero_assets_applied == 12
    assert count == 12
    assert result.neighborhoods_created == 12


@pytest.mark.asyncio
@pytest.mark.integration
async def test_prod_catalog_seed_idempotent(auth_client: AsyncClient) -> None:
    _ = auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = Settings(
        APP_ENV="prod",
        DEBUG=False,
        JWT_SECRET_KEY="x" * 48,
        REFRESH_TOKEN_PEPPER="y" * 32,
        REFRESH_COOKIE_SECURE=True,
        WEB_FRONTEND_URL="https://yunicity.city",
        CORS_ORIGINS=["https://yunicity.city"],
        MEDIA_PUBLIC_BASE_URL="https://api.yunicity.city",
        EMAIL_PROVIDER="console",
    )
    async with factory() as session:
        await session.execute(delete(Neighborhood))
        await session.flush()
        first = await seed_reims_neighborhoods_catalog(session, settings)
        await session.commit()
        second = await seed_reims_neighborhoods_catalog(session, settings)
        await session.commit()

        count = (
            await session.execute(
                select(func.count()).select_from(Neighborhood).where(Neighborhood.city == "Reims")
            )
        ).scalar_one()

    assert first.neighborhoods_created == 12
    assert second.neighborhoods_created == 0
    assert count == 12


@pytest.mark.asyncio
@pytest.mark.integration
async def test_prod_catalog_seed_prod_cover_urls(auth_client: AsyncClient) -> None:
    _ = auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = Settings(
        APP_ENV="prod",
        DEBUG=False,
        JWT_SECRET_KEY="x" * 48,
        REFRESH_TOKEN_PEPPER="y" * 32,
        REFRESH_COOKIE_SECURE=True,
        WEB_FRONTEND_URL="https://yunicity.city",
        CORS_ORIGINS=["https://yunicity.city"],
        MEDIA_PUBLIC_BASE_URL="https://api.yunicity.city",
        EMAIL_PROVIDER="console",
    )
    async with factory() as session:
        await session.execute(delete(Neighborhood))
        await session.flush()
        await seed_reims_neighborhoods_catalog(session, settings)
        await session.commit()
        rows = (
            await session.execute(select(Neighborhood).where(Neighborhood.city == "Reims"))
        ).scalars().all()

    assert len(rows) == 12
    for hood in rows:
        expected = neighborhood_seed_cover_url(
            hood.slug,
            app_env="prod",
            web_frontend_url="https://yunicity.city",
        )
        assert hood.cover_image_url == expected
        assert hood.latitude is not None
        assert hood.longitude is not None


@pytest.mark.asyncio
@pytest.mark.integration
async def test_list_neighborhoods_after_prod_catalog_seed(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods",
        params={"city": "Reims", "page_size": 50},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["total"] >= 12
    slugs = {item["slug"] for item in body["items"]}
    assert slugs.issuperset(set(REIMS_NEIGHBORHOOD_HERO_SLUGS))
    for seed_row in REIMS_NEIGHBORHOOD_SEED:
        assert seed_row["slug"] in slugs
