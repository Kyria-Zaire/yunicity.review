"""Production-safe Reims neighborhood catalog seed (FEATURE-PROD-DATA-05 / 05A)."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.db.seeds.reims_neighborhoods import REIMS_NEIGHBORHOOD_SEED, seed_reims_neighborhoods
from app.db.seeds.reims_neighborhoods_v2_editorial import seed_reims_neighborhoods_v2_editorial
from app.db.seeds.reims_neighborhoods_v2_hero_assets import seed_reims_neighborhoods_v2_hero_assets
from app.models.neighborhood import Neighborhood

logger = logging.getLogger(__name__)

REIMS_CITY = "Reims"
REIMS_OFFICIAL_NEIGHBORHOOD_COUNT = len(REIMS_NEIGHBORHOOD_SEED)

# Fusionnes dans cernay-jean-jaures (QUARTIER-01 phase 3c). Ils restent dans le seed — donc
# comptes dans REIMS_OFFICIAL_NEIGHBORHOOD_COUNT et dans le garde-fou — mais sont desactives
# (soft-delete). PAS de DELETE : leurs aliases/moods/timeline sont en CASCADE, et local_videos
# reference neighborhoods en RESTRICT. La desactivation vit ici, dans le seed catalog (qui
# tourne apres la creation), et non dans une migration qui s'appliquerait avant le seed et
# laisserait un env neuf les recreer actifs.
REIMS_MERGED_NEIGHBORHOOD_SLUGS: tuple[str, ...] = ("cernay", "jean-jaures", "boulingrin")


@dataclass(frozen=True)
class ReimsNeighborhoodsCatalogSeedResult:
    neighborhoods_created: int
    neighborhoods_total: int
    editorial_applied: int
    hero_assets_applied: int
    merged_deactivated: int


async def _count_reims_neighborhoods(session: AsyncSession) -> int:
    return (
        await session.execute(
            select(func.count()).select_from(Neighborhood).where(Neighborhood.city == REIMS_CITY)
        )
    ).scalar_one()


async def _deactivate_merged_neighborhoods(session: AsyncSession) -> int:
    """Soft-delete les quartiers fusionnes : is_active=false + is_featured=false.

    is_featured=false aussi, pour resorber le doublon transitoire de mise en avant (le seed
    insert-only ne pouvait pas le retirer a la creation de cernay-jean-jaures). Idempotent :
    ne compte que les lignes reellement basculees, donc 0 au second passage.
    """
    to_deactivate = (
        await session.execute(
            select(func.count())
            .select_from(Neighborhood)
            .where(
                Neighborhood.city == REIMS_CITY,
                Neighborhood.slug.in_(REIMS_MERGED_NEIGHBORHOOD_SLUGS),
                Neighborhood.is_active.is_(True),
            )
        )
    ).scalar_one()
    if to_deactivate:
        await session.execute(
            update(Neighborhood)
            .where(
                Neighborhood.city == REIMS_CITY,
                Neighborhood.slug.in_(REIMS_MERGED_NEIGHBORHOOD_SLUGS),
            )
            .values(is_active=False, is_featured=False)
        )
    return to_deactivate


async def seed_reims_neighborhoods_catalog(
    session: AsyncSession,
    settings: Settings,
) -> ReimsNeighborhoodsCatalogSeedResult:
    """Idempotent catalog: 12 official Reims neighborhoods + V2 editorial + hero assets."""
    before_count = await _count_reims_neighborhoods(session)

    neighborhoods_created = await seed_reims_neighborhoods(session, settings=settings)
    editorial_applied = await seed_reims_neighborhoods_v2_editorial(session)
    hero_assets_applied = await seed_reims_neighborhoods_v2_hero_assets(session, settings=settings)
    merged_deactivated = await _deactivate_merged_neighborhoods(session)

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
        merged_deactivated=merged_deactivated,
    )
    logger.info(
        "reims_neighborhoods_catalog_seed_completed",
        extra={
            "city": REIMS_CITY,
            "neighborhoods_created": result.neighborhoods_created,
            "neighborhoods_total": result.neighborhoods_total,
            "editorial_applied": result.editorial_applied,
            "hero_assets_applied": result.hero_assets_applied,
            "merged_deactivated": result.merged_deactivated,
        },
    )
    return result
