"""Reims neighborhoods V2 hero media seed (FEATURE-QUARTIERS-V2 / Q2-S1-04)."""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.neighborhood_hero_assets import (
    REIMS_NEIGHBORHOOD_HERO_SLUGS,
    neighborhood_dev_public_hero_url,
    neighborhood_hero_storage_key,
)
from app.models.neighborhood import Neighborhood

logger = logging.getLogger(__name__)

REIMS_CITY = "Reims"


async def seed_reims_neighborhoods_v2_hero_assets(session: AsyncSession) -> None:
    """Assign Yunicity-owned hero keys and DEV public cover URLs to all 12 Reims hoods."""
    applied = 0
    for slug in REIMS_NEIGHBORHOOD_HERO_SLUGS:
        hood = (
            await session.execute(
                select(Neighborhood).where(
                    Neighborhood.city == REIMS_CITY,
                    Neighborhood.slug == slug,
                )
            )
        ).scalar_one_or_none()
        if hood is None:
            logger.warning("neighborhood_v2_hero_assets_skip_missing slug=%s", slug)
            continue

        hood.hero_image_storage_key = neighborhood_hero_storage_key(slug)
        hood.cover_image_url = neighborhood_dev_public_hero_url(slug)
        applied += 1

    await session.flush()
    logger.info("reims_neighborhoods_v2_hero_assets_seed_completed count=%s", applied)
