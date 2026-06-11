"""Best-effort passport reputation hooks after citizen activity (PASSPORT-01B)."""

from __future__ import annotations

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.passport_constants import OfferRedemptionStatus
from app.core.passport_reputation_constants import (
    PARTNER_REDEMPTION_POINTS,
    STAMP_EARNED_POINTS,
    PassportReputationEventType,
    PassportReputationSourceType,
)
from app.models.passport import PassportOfferRedemption, PassportStamp
from app.services.passport_reputation_service import PassportReputationService

logger = logging.getLogger(__name__)


async def award_reputation_for_passport_stamp(
    session: AsyncSession,
    *,
    stamp_id: uuid.UUID,
    user_id: uuid.UUID,
    partner_profile_id: uuid.UUID | None = None,
) -> None:
    """Award STAMP_EARNED after a passport_stamp row is persisted."""
    try:
        stamp = await session.get(PassportStamp, stamp_id)
        if stamp is None:
            logger.warning(
                "passport_reputation_stamp_missing",
                extra={"stamp_id": str(stamp_id), "user_id": str(user_id)},
            )
            return

        metadata: dict[str, str] = {
            "organization_id": str(stamp.organization_id),
            "stamp_id": str(stamp.id),
            "reason": "passport_stamp_created",
        }
        if partner_profile_id is not None:
            metadata["partner_profile_id"] = str(partner_profile_id)

        await PassportReputationService(session).award_points(
            user_id=user_id,
            event_type=PassportReputationEventType.STAMP_EARNED.value,
            source_type=PassportReputationSourceType.PASSPORT_STAMP.value,
            points=STAMP_EARNED_POINTS,
            source_id=stamp.id,
            metadata=metadata,
        )
    except Exception:
        logger.warning(
            "passport_reputation_stamp_award_failed",
            extra={"stamp_id": str(stamp_id), "user_id": str(user_id)},
            exc_info=True,
        )


async def award_reputation_for_partner_redemption(
    session: AsyncSession,
    *,
    redemption_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    """Award PARTNER_REDEMPTION only when redemption status is COMPLETED."""
    try:
        redemption = await session.scalar(
            select(PassportOfferRedemption)
            .options(selectinload(PassportOfferRedemption.offer))
            .where(PassportOfferRedemption.id == redemption_id)
        )
        if redemption is None:
            logger.warning(
                "passport_reputation_redemption_missing",
                extra={"redemption_id": str(redemption_id), "user_id": str(user_id)},
            )
            return

        status = (
            redemption.status.value
            if isinstance(redemption.status, OfferRedemptionStatus)
            else str(redemption.status)
        )
        if status != OfferRedemptionStatus.COMPLETED.value:
            return

        metadata: dict[str, str] = {
            "offer_id": str(redemption.partner_offer_id),
            "organization_id": "",
            "reason": "partner_redemption_confirmed",
        }
        offer = redemption.offer
        if offer is not None:
            metadata["offer_id"] = str(offer.id)
            metadata["organization_id"] = str(offer.organization_id)

        await PassportReputationService(session).award_points(
            user_id=user_id,
            event_type=PassportReputationEventType.PARTNER_REDEMPTION.value,
            source_type=PassportReputationSourceType.PARTNER_OFFER_REDEMPTION.value,
            points=PARTNER_REDEMPTION_POINTS,
            source_id=redemption.id,
            metadata=metadata,
        )
    except Exception:
        logger.warning(
            "passport_reputation_redemption_award_failed",
            extra={"redemption_id": str(redemption_id), "user_id": str(user_id)},
            exc_info=True,
        )
