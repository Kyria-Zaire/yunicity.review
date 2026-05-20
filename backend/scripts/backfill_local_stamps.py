"""Backfill territorial memory stamps for early users (TICKET-504).

Usage (from backend/):
    python scripts/backfill_local_stamps.py
"""

from __future__ import annotations

import asyncio
import logging
import sys
from datetime import UTC, datetime
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.passport_constants import OfferRedemptionStatus  # noqa: E402
from app.db.session import get_engine  # noqa: E402
from app.models.passport import PartnerOffer, PassportOfferRedemption  # noqa: E402
from app.services.local_stamp_service import LocalStampService  # noqa: E402
from sqlalchemy import select  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker  # noqa: E402
from sqlalchemy.orm import selectinload  # noqa: E402

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


async def backfill_local_stamps() -> None:
    engine = get_engine()
    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured")

    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    awarded_total = 0

    async with factory() as session:
        result = await session.execute(
            select(PassportOfferRedemption)
            .options(
                selectinload(PassportOfferRedemption.passport),
                selectinload(PassportOfferRedemption.offer).selectinload(PartnerOffer.organization),
            )
            .where(PassportOfferRedemption.status == OfferRedemptionStatus.COMPLETED.value)
            .order_by(PassportOfferRedemption.redeemed_at.asc().nulls_last())
        )
        redemptions = list(result.scalars().all())
        service = LocalStampService(session)

        for redemption in redemptions:
            passport = redemption.passport
            offer = redemption.offer
            if passport is None or offer is None:
                continue
            org = offer.organization
            if org is None:
                continue
            redeemed_at = redemption.redeemed_at or datetime.now(UTC)
            audit = (redemption.metadata_ or {}).get("audit") or {}
            via_scan = audit.get("event") == "redemption_success"
            created = await service.evaluate_after_redemption(
                passport=passport,
                offer=offer,
                organization=org,
                redeemed_at=redeemed_at,
                via_partner_scan=via_scan,
                send_notifications=False,
            )
            if created:
                awarded_total += len(created)
        await session.commit()

    logger.info("backfill_local_stamps_done", extra={"awarded": awarded_total})


if __name__ == "__main__":
    asyncio.run(backfill_local_stamps())
