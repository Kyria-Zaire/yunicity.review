"""Production-safe Reims signed partners catalog seed (FEATURE-PROD-DATA-05 / 05D)."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.partner_assets import DEMO_PARTNER_SLUGS
from app.db.seeds.reims_partner_offers import (
    REIMS_PARTNER_OFFERS_SEED,
    seed_reims_partner_offers,
)
from app.db.seeds.reims_signed_partners import (
    REIMS_SIGNED_PARTNER_SLUGS,
    seed_reims_signed_partners,
)
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile
from app.models.passport import PartnerOffer

logger = logging.getLogger(__name__)

REIMS_CITY = "Reims"
REIMS_SIGNED_PARTNER_COUNT = len(REIMS_SIGNED_PARTNER_SLUGS)
REIMS_PARTNER_OFFERS_COUNT = len(REIMS_PARTNER_OFFERS_SEED)


@dataclass(frozen=True)
class ReimsPartnersCatalogSeedResult:
    partners_created: int
    partners_updated: int
    partners_signed: int
    offers_created: int
    offers_updated: int
    offers_total: int


async def _count_signed_partners(session: AsyncSession) -> int:
    return (
        await session.execute(
            select(func.count())
            .select_from(PartnerProfile)
            .join(Organization, PartnerProfile.organization_id == Organization.id)
            .where(
                Organization.city == REIMS_CITY,
                Organization.slug.in_(REIMS_SIGNED_PARTNER_SLUGS),
            )
        )
    ).scalar_one()


async def _count_partner_offers(session: AsyncSession) -> int:
    return (
        await session.execute(
            select(func.count())
            .select_from(PartnerOffer)
            .join(Organization, PartnerOffer.organization_id == Organization.id)
            .where(
                Organization.city == REIMS_CITY,
                Organization.slug.in_(REIMS_SIGNED_PARTNER_SLUGS),
            )
        )
    ).scalar_one()


async def _assert_no_demo_partners(session: AsyncSession) -> None:
    demo_count = (
        await session.execute(
            select(func.count())
            .select_from(Organization)
            .where(Organization.slug.in_(DEMO_PARTNER_SLUGS))
        )
    ).scalar_one()
    if demo_count:
        raise RuntimeError(
            f"Demo partner organizations detected in catalog seed: count={demo_count}"
        )


async def seed_reims_partners_catalog(
    session: AsyncSession,
    settings: Settings,
) -> ReimsPartnersCatalogSeedResult:
    """Idempotent catalog: signed Reims partners + passport offers (no demo/events)."""
    partners_created, partners_updated = await seed_reims_signed_partners(
        session,
        settings=settings,
    )
    offers_created, offers_updated = await seed_reims_partner_offers(session)

    partners_signed = await _count_signed_partners(session)
    offers_total = await _count_partner_offers(session)
    await _assert_no_demo_partners(session)

    if partners_signed != REIMS_SIGNED_PARTNER_COUNT:
        raise RuntimeError(
            f"Reims partners catalog incomplete: expected "
            f"{REIMS_SIGNED_PARTNER_COUNT}, got {partners_signed} "
            f"(created={partners_created}, updated={partners_updated})"
        )
    if offers_total != REIMS_PARTNER_OFFERS_COUNT:
        raise RuntimeError(
            f"Reims partner offers catalog incomplete: expected "
            f"{REIMS_PARTNER_OFFERS_COUNT}, got {offers_total} "
            f"(created={offers_created}, updated={offers_updated})"
        )

    result = ReimsPartnersCatalogSeedResult(
        partners_created=partners_created,
        partners_updated=partners_updated,
        partners_signed=partners_signed,
        offers_created=offers_created,
        offers_updated=offers_updated,
        offers_total=offers_total,
    )
    logger.info(
        "reims_partners_catalog_seed_completed",
        extra={
            "partners_created": result.partners_created,
            "partners_updated": result.partners_updated,
            "partners_signed": result.partners_signed,
            "offers_created": result.offers_created,
            "offers_updated": result.offers_updated,
            "offers_total": result.offers_total,
        },
    )
    return result
