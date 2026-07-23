"""Production-safe Reims cultural places catalog seed (FEATURE-PROD-DATA-05 / 05C)."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.cultural_place_assets import REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS
from app.db.seeds.reims_cultural_places import seed_reims_cultural_places
from app.db.seeds.reims_neighborhood_landmarks import seed_reims_neighborhood_landmarks
from app.models.cultural_place import CulturalPlace

logger = logging.getLogger(__name__)

REIMS_CITY = "Reims"
REIMS_OFFICIAL_CULTURAL_PLACE_COUNT = len(REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS)


@dataclass(frozen=True)
class ReimsCulturalPlacesCatalogSeedResult:
    places_created: int
    places_updated: int
    places_official: int
    landmarks_linked: int


async def _count_official_places(session: AsyncSession) -> int:
    return (
        await session.execute(
            select(func.count())
            .select_from(CulturalPlace)
            .where(
                CulturalPlace.city == REIMS_CITY,
                CulturalPlace.slug.in_(REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS),
                CulturalPlace.is_active.is_(True),
            )
        )
    ).scalar_one()


async def seed_reims_cultural_places_catalog(
    session: AsyncSession,
    settings: Settings,
) -> ReimsCulturalPlacesCatalogSeedResult:
    """Idempotent catalog: 12 official Reims cultural places with prod-safe media."""
    places_created, places_updated = await seed_reims_cultural_places(
        session,
        settings=settings,
        official_only=True,
    )
    official_count = await _count_official_places(session)

    if official_count != REIMS_OFFICIAL_CULTURAL_PLACE_COUNT:
        raise RuntimeError(
            f"Reims cultural places catalog incomplete: expected "
            f"{REIMS_OFFICIAL_CULTURAL_PLACE_COUNT}, got {official_count} "
            f"(created={places_created}, updated={places_updated})"
        )

    # Landmarks (3e) : les lieux officiels existent maintenant, les quartiers doivent avoir ete
    # seedes au prealable (--neighborhoods). Leve si un lieu reference manque.
    landmarks_linked = await seed_reims_neighborhood_landmarks(session)

    result = ReimsCulturalPlacesCatalogSeedResult(
        places_created=places_created,
        places_updated=places_updated,
        places_official=official_count,
        landmarks_linked=landmarks_linked,
    )
    logger.info(
        "reims_cultural_places_catalog_seed_completed",
        extra={
            "places_created": result.places_created,
            "places_updated": result.places_updated,
            "places_official": result.places_official,
            "landmarks_linked": result.landmarks_linked,
        },
    )
    return result
