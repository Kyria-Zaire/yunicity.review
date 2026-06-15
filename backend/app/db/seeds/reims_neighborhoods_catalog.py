"""Production-safe Reims neighborhood catalog seed (FEATURE-PROD-DATA-05 / 05A)."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.db.seeds.reims_neighborhoods import REIMS_NEIGHBORHOOD_SEED, seed_reims_neighborhoods
from app.db.seeds.reims_neighborhoods_v2_editorial import seed_reims_neighborhoods_v2_editorial
from app.db.seeds.reims_neighborhoods_v2_hero_assets import seed_reims_neighborhoods_v2_hero_assets
from app.models.neighborhood import Neighborhood

logger = logging.getLogger(__name__)

REIMS_CITY = "Reims"
REIMS_OFFICIAL_NEIGHBORHOOD_COUNT = len(REIMS_NEIGHBORHOOD_SEED)


@dataclass(frozen=True)
class ReimsNeighborhoodsCatalogSeedResult:
    neighborhoods_created: int
    neighborhoods_total: int
    editorial_applied: int
    hero_assets_applied: int


async def _count_reims_neighborhoods(session: AsyncSession) -> int:
    return (
        await session.execute(
            select(func.count()).select_from(Neighborhood).where(Neighborhood.city == REIMS_CITY)
        )
    ).scalar_one()


async def seed_reims_neighborhoods_catalog(
    session: AsyncSession,
    settings: Settings,
) -> ReimsNeighborhoodsCatalogSeedResult:
    """Idempotent catalog: 12 official Reims neighborhoods + V2 editorial + hero assets."""
    before_count = await _count_reims_neighborhoods(session)

    neighborhoods_created = await seed_reims_neighborhoods(session, settings=settings)
    editorial_applied = await seed_reims_neighborhoods_v2_editorial(session)
    hero_assets_applied = await seed_reims_neighborhoods_v2_hero_assets(session, settings=settings)

    total = await _count_reims_neighborhoods(session)
    if total != REIMS_OFFICIAL_NEIGHBORHOOD_COUNT:
        raise RuntimeError(
            f"Reims neighborhood catalog incomplete: expected "
            f"{REIMS_OFFICIAL_NEIGHBORHOOD_COUNT}, got {total} "
            f"(before={before_count}, created={neighborhoods_created})"
        )

    result = ReimsNeighborhoodsCatalogSeedResult(
        neighborhoods_created=neighborhoods_created,
        neighborhoods_total=total,
        editorial_applied=editorial_applied,
        hero_assets_applied=hero_assets_applied,
    )
    logger.info(
        "reims_neighborhoods_catalog_seed_completed",
        extra={
            "city": REIMS_CITY,
            "neighborhoods_created": result.neighborhoods_created,
            "neighborhoods_total": result.neighborhoods_total,
            "editorial_applied": result.editorial_applied,
            "hero_assets_applied": result.hero_assets_applied,
        },
    )
    return result
