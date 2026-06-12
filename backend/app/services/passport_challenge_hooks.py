"""Best-effort passport challenge progress hooks after citizen activity (PASSPORT-04B)."""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.passport import PassportOfferRedemption, PassportStamp
from app.services.passport_challenge_progress_service import PassportChallengeProgressService

logger = logging.getLogger(__name__)


async def update_challenges_for_passport_stamp(
    session: AsyncSession,
    stamp: PassportStamp,
) -> None:
    """Increment stamp-type challenge progress after a passport_stamp row is persisted."""
    try:
        loaded = await session.scalar(
            select(PassportStamp)
            .options(selectinload(PassportStamp.passport))
            .where(PassportStamp.id == stamp.id)
        )
        if loaded is None:
            logger.warning(
                "passport_challenge_stamp_missing",
                extra={"stamp_id": str(stamp.id)},
            )
            return

        passport = loaded.passport
        if passport is None:
            logger.warning(
                "passport_challenge_stamp_missing_passport",
                extra={"stamp_id": str(stamp.id)},
            )
            return

        await PassportChallengeProgressService(session).increment_stamp_progress(
            passport.user_id,
            loaded,
        )
    except Exception:
        logger.warning(
            "passport_challenge_stamp_progress_failed",
            extra={"stamp_id": str(stamp.id)},
            exc_info=True,
        )


async def update_challenges_for_partner_redemption(
    session: AsyncSession,
    redemption: PassportOfferRedemption,
) -> None:
    """Increment redemption-type challenge progress when redemption is COMPLETED."""
    try:
        loaded = await session.scalar(
            select(PassportOfferRedemption)
            .options(selectinload(PassportOfferRedemption.passport))
            .where(PassportOfferRedemption.id == redemption.id)
        )
        if loaded is None:
            logger.warning(
                "passport_challenge_redemption_missing",
                extra={"redemption_id": str(redemption.id)},
            )
            return

        passport = loaded.passport
        if passport is None:
            logger.warning(
                "passport_challenge_redemption_missing_passport",
                extra={"redemption_id": str(redemption.id)},
            )
            return

        await PassportChallengeProgressService(session).increment_redemption_progress(
            passport.user_id,
            loaded,
        )
    except Exception:
        logger.warning(
            "passport_challenge_redemption_progress_failed",
            extra={"redemption_id": str(redemption.id)},
            exc_info=True,
        )
