"""Production cultural places catalog seed tests (FEATURE-PROD-DATA-05 / 05C)."""

from __future__ import annotations

import logging
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.core.config import Settings
from app.core.cultural_place_assets import (
    REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS,
    cultural_place_seed_cover_url,
)
from app.db.seeds.reims_cultural_places import (
    REIMS_CULTURAL_PLACES_SEED,
    seed_reims_cultural_places,
)
from app.db.seeds.reims_cultural_places_catalog import (
    REIMS_OFFICIAL_CULTURAL_PLACE_COUNT,
    seed_reims_cultural_places_catalog,
)
from app.db.seeds.reims_neighborhoods import seed_reims_neighborhoods
from app.db.session import get_engine
from app.main import create_app
from app.models.cultural_place import CulturalPlace
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark_integration = [pytest.mark.integration, pytest.mark.asyncio]


def test_cultural_place_seed_cover_url_prod() -> None:
    url = cultural_place_seed_cover_url(
        "cathedrale-notre-dame",
        app_env="prod",
        web_frontend_url="https://yunicity.city",
    )
    assert url == "https://yunicity.city/places/reims/cathedrale-notre-dame/cover.jpg"
    assert "localhost" not in url


@pytest.mark.asyncio
async def test_reims_cultural_places_seed_logging_does_not_crash() -> None:
    logging.basicConfig(level=logging.INFO, force=True)
    settings = Settings(
        APP_ENV="prod",
        DATABASE_URL="postgresql+asyncpg://yunicity:yunicity@localhost:5434/yunicity_test",
        REDIS_URL="redis://localhost:6379/0",
        DEBUG=False,
        JWT_SECRET_KEY="x" * 48,
        REFRESH_TOKEN_PEPPER="y" * 32,
        REFRESH_COOKIE_SECURE=True,
        WEB_FRONTEND_URL="https://yunicity.city",
        CORS_ORIGINS=["https://yunicity.city"],
        MEDIA_PUBLIC_BASE_URL="https://api.yunicity.city",
        EMAIL_PROVIDER="console",
    )

    async def mock_execute(_stmt: object) -> MagicMock:
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        result.all.return_value = []
        return result

    session = AsyncMock()
    session.execute = mock_execute
    session.get = AsyncMock(return_value=None)
    session.add = MagicMock()
    session.flush = AsyncMock()

    created, updated = await seed_reims_cultural_places(
        session,
        settings=settings,
        official_only=True,
    )

    assert created == REIMS_OFFICIAL_CULTURAL_PLACE_COUNT
    assert updated == 0


@pytest.mark.asyncio
@pytest.mark.integration
async def test_prod_cultural_places_catalog_seed_creates_twelve() -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip cultural places catalog integration tests")
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = Settings(
        APP_ENV="prod",
        DATABASE_URL="postgresql+asyncpg://yunicity:yunicity@localhost:5434/yunicity_test",
        REDIS_URL="redis://localhost:6379/0",
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
        await seed_reims_neighborhoods(session, settings=settings)
        await session.execute(delete(CulturalPlace))
        await session.flush()
        result = await seed_reims_cultural_places_catalog(session, settings)
        await session.commit()

        count = (
            await session.execute(
                select(func.count())
                .select_from(CulturalPlace)
                .where(
                    CulturalPlace.city == "Reims",
                    CulturalPlace.slug.in_(REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS),
                )
            )
        ).scalar_one()

    assert result.places_official == REIMS_OFFICIAL_CULTURAL_PLACE_COUNT == 12
    assert count == 12
    assert result.places_created == 12


@pytest.mark.asyncio
@pytest.mark.integration
async def test_prod_cultural_places_catalog_seed_idempotent() -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip cultural places catalog integration tests")
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = Settings(
        APP_ENV="prod",
        DATABASE_URL="postgresql+asyncpg://yunicity:yunicity@localhost:5434/yunicity_test",
        REDIS_URL="redis://localhost:6379/0",
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
        await seed_reims_neighborhoods(session, settings=settings)
        await session.execute(delete(CulturalPlace))
        await session.flush()
        first = await seed_reims_cultural_places_catalog(session, settings)
        await session.commit()
        second = await seed_reims_cultural_places_catalog(session, settings)
        await session.commit()

    assert first.places_created == 12
    assert second.places_created == 0
    assert second.places_updated == 12


@pytest.mark.asyncio
@pytest.mark.integration
async def test_prod_cultural_places_catalog_prod_image_urls() -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip cultural places catalog integration tests")
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = Settings(
        APP_ENV="prod",
        DATABASE_URL="postgresql+asyncpg://yunicity:yunicity@localhost:5434/yunicity_test",
        REDIS_URL="redis://localhost:6379/0",
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
        await seed_reims_neighborhoods(session, settings=settings)
        await session.execute(delete(CulturalPlace))
        await session.flush()
        await seed_reims_cultural_places_catalog(session, settings)
        await session.commit()
        rows = (
            await session.execute(
                select(CulturalPlace).where(
                    CulturalPlace.city == "Reims",
                    CulturalPlace.slug.in_(REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS),
                )
            )
        ).scalars().all()

    assert len(rows) == 12
    for place in rows:
        expected = cultural_place_seed_cover_url(
            place.slug,
            app_env="prod",
            web_frontend_url="https://yunicity.city",
        )
        assert place.hero_image_url == expected
        assert place.image_source == "yunicity_asset"
        assert "localhost" not in (place.hero_image_url or "")


@pytest.mark.asyncio
@pytest.mark.integration
async def test_api_lists_official_cultural_places_after_catalog_seed() -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip cultural places catalog integration tests")
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = Settings(
        APP_ENV="prod",
        DATABASE_URL="postgresql+asyncpg://yunicity:yunicity@localhost:5434/yunicity_test",
        REDIS_URL="redis://localhost:6379/0",
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
        await seed_reims_neighborhoods(session, settings=settings)
        await session.execute(delete(CulturalPlace))
        await session.flush()
        await seed_reims_cultural_places_catalog(session, settings)
        await session.commit()

    application = create_app()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/cultural-places",
            params={"city": "Reims", "limit": 50},
        )
    assert response.status_code == 200, response.text
    slugs = {item["slug"] for item in response.json()["items"]}
    assert slugs.issuperset(set(REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS))
    assert len(REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS) == len(
        {s for s in REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS if s in slugs}
    )


def test_official_seed_subset_of_full_catalog() -> None:
    official = set(REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS)
    full = {entry["slug"] for entry in REIMS_CULTURAL_PLACES_SEED}
    assert official.issubset(full)
    assert len(official) == 12
