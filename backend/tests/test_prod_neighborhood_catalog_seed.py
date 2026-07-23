"""Production neighborhood catalog seed tests (FEATURE-PROD-DATA-05 / 05A)."""

from __future__ import annotations

import logging
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.core.config import Settings
from app.core.neighborhood_hero_assets import (
    REIMS_NEIGHBORHOOD_HERO_SLUGS,
    neighborhood_dev_public_hero_url,
    neighborhood_seed_cover_url,
)
from app.db.seeds.reims_neighborhood_community_tags import (
    REIMS_NEIGHBORHOOD_COMMUNITY_TAG_ASSIGNMENTS,
)
from app.db.seeds.reims_neighborhoods import (
    REIMS_NEIGHBORHOOD_SEED,
    seed_reims_neighborhoods,
)
from app.db.seeds.reims_neighborhoods_catalog import (
    REIMS_MERGED_NEIGHBORHOOD_SLUGS,
    REIMS_OFFICIAL_NEIGHBORHOOD_COUNT,
    seed_reims_neighborhoods_catalog,
)
from app.db.seeds.reims_neighborhoods_v2_editorial import REIMS_NEIGHBORHOOD_V2_EDITORIAL
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


def test_neighborhood_seed_cover_url_recette_uses_media_cdn() -> None:
    """Recette must serve via the INFRA-01 media CDN, not the legacy cdn.yunicity.fr."""
    url = neighborhood_seed_cover_url(
        "boulingrin",
        app_env="recette",
        web_frontend_url="https://recette.yunicity.city",
    )
    assert url == "https://media.recette.yunicity.city/neighborhoods/reims/boulingrin/hero.jpg"


def test_neighborhood_cdn_hero_url_prod_drops_env_label() -> None:
    from app.core.neighborhood_hero_assets import neighborhood_cdn_hero_url

    url = neighborhood_cdn_hero_url("boulingrin", app_env="prod")
    assert url == "https://media.yunicity.city/neighborhoods/reims/boulingrin/hero.jpg"


@pytest.mark.asyncio
async def test_reims_neighborhoods_seed_logging_does_not_crash() -> None:
    """LogRecord reserves 'created' — extra must use neighborhoods_created instead."""
    logging.basicConfig(level=logging.INFO, force=True)

    async def mock_execute(_stmt: object) -> MagicMock:
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        return result

    session = AsyncMock()
    session.execute = mock_execute
    session.add = MagicMock()
    session.flush = AsyncMock()

    created = await seed_reims_neighborhoods(session)

    assert created == len(REIMS_NEIGHBORHOOD_SEED)
    assert session.add.call_count == len(REIMS_NEIGHBORHOOD_SEED)


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

    assert result.neighborhoods_total == REIMS_OFFICIAL_NEIGHBORHOOD_COUNT
    assert result.editorial_applied == len(
        REIMS_NEIGHBORHOOD_V2_EDITORIAL
    )  # 15 : les 12 originaux + les 3 crees ont desormais un editorial (3e)
    # 12 : les 3 quartiers crees n'ont pas encore de hero.
    assert result.hero_assets_applied == len(REIMS_NEIGHBORHOOD_HERO_SLUGS)
    # 3e : tags communautes assignes aux 3 quartiers crees (3 tags chacun).
    assert result.community_tags_assigned == sum(
        len(tags) for tags in REIMS_NEIGHBORHOOD_COMMUNITY_TAG_ASSIGNMENTS.values()
    )
    assert count == REIMS_OFFICIAL_NEIGHBORHOOD_COUNT
    assert result.neighborhoods_created == REIMS_OFFICIAL_NEIGHBORHOOD_COUNT
    # QUARTIER-01 3c : les quartiers fusionnes sont crees puis desactives dans la meme passe.
    assert result.merged_deactivated == len(REIMS_MERGED_NEIGHBORHOOD_SLUGS)
    async with factory() as session:
        active_merged = (
            await session.execute(
                select(func.count())
                .select_from(Neighborhood)
                .where(
                    Neighborhood.slug.in_(REIMS_MERGED_NEIGHBORHOOD_SLUGS),
                    Neighborhood.is_active.is_(True),
                )
            )
        ).scalar_one()
        featured_merged = (
            await session.execute(
                select(func.count())
                .select_from(Neighborhood)
                .where(
                    Neighborhood.slug.in_(REIMS_MERGED_NEIGHBORHOOD_SLUGS),
                    Neighborhood.is_featured.is_(True),
                )
            )
        ).scalar_one()
    assert active_merged == 0, "les quartiers fusionnes doivent etre inactifs"
    assert featured_merged == 0, "aucun quartier fusionne ne doit rester featured"


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

    assert first.neighborhoods_created == REIMS_OFFICIAL_NEIGHBORHOOD_COUNT
    assert second.neighborhoods_created == 0
    assert count == REIMS_OFFICIAL_NEIGHBORHOOD_COUNT
    assert first.merged_deactivated == len(REIMS_MERGED_NEIGHBORHOOD_SLUGS)
    assert second.merged_deactivated == 0  # idempotent : deja inactifs au 2e passage


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
            (await session.execute(select(Neighborhood).where(Neighborhood.city == "Reims")))
            .scalars()
            .all()
        )

    assert len(rows) == REIMS_OFFICIAL_NEIGHBORHOOD_COUNT
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
