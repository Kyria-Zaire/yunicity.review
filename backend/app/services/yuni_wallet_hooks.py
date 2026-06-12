"""Best-effort YuniMonnaie earn hooks after citizen activity (PASSPORT-02B)."""

from __future__ import annotations

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.passport_constants import OfferRedemptionStatus
from app.core.yuni_wallet_constants import (
    PARTNER_REDEMPTION_YM,
    STAMP_EARNED_YM,
    YuniTransactionReferenceType,
    YuniWalletStatus,
)
from app.core.yuni_wallet_errors import YuniWalletSuspendedError
from app.models.passport import PassportOfferRedemption, PassportStamp
from app.models.yuni_wallet import YuniTransaction
from app.services.yuni_wallet_service import YuniWalletService

logger = logging.getLogger(__name__)


async def _is_wallet_suspended(session: AsyncSession, user_id: uuid.UUID) -> bool:
    wallet = await YuniWalletService(session).get_wallet(user_id)
    return wallet is not None and wallet.status == YuniWalletStatus.SUSPENDED.value


async def award_yuni_for_passport_stamp(
    session: AsyncSession,
    *,
    stamp_id: uuid.UUID,
    user_id: uuid.UUID,
    partner_profile_id: uuid.UUID | None = None,
) -> YuniTransaction | None:
    """Award STAMP_EARNED_YM after a passport_stamp row is persisted."""
    try:
        if await _is_wallet_suspended(session, user_id):
            logger.info(
                "yuni_wallet_stamp_skipped_suspended",
                extra={"stamp_id": str(stamp_id), "user_id": str(user_id)},
            )
            return None

        stamp = await session.get(PassportStamp, stamp_id)
        if stamp is None:
            logger.warning(
                "yuni_wallet_stamp_missing",
                extra={"stamp_id": str(stamp_id), "user_id": str(user_id)},
            )
            return None

        metadata: dict[str, str] = {
            "stamp_id": str(stamp.id),
            "organization_id": str(stamp.organization_id),
            "reason": "passport_stamp_created",
        }
        if partner_profile_id is not None:
            metadata["partner_profile_id"] = str(partner_profile_id)

        return await YuniWalletService(session).earn(
            user_id,
            STAMP_EARNED_YM,
            YuniTransactionReferenceType.PASSPORT_STAMP.value,
            reference_id=stamp.id,
            metadata=metadata,
        )
    except YuniWalletSuspendedError:
        logger.info(
            "yuni_wallet_stamp_skipped_suspended",
            extra={"stamp_id": str(stamp_id), "user_id": str(user_id)},
        )
        return None
    except Exception:
        logger.warning(
            "yuni_wallet_stamp_award_failed",
            extra={"stamp_id": str(stamp_id), "user_id": str(user_id)},
            exc_info=True,
        )
        return None


async def award_yuni_for_partner_redemption(
    session: AsyncSession,
    *,
    redemption_id: uuid.UUID,
    user_id: uuid.UUID,
) -> YuniTransaction | None:
    """Award PARTNER_REDEMPTION_YM only when redemption status is COMPLETED."""
    try:
        if await _is_wallet_suspended(session, user_id):
            logger.info(
                "yuni_wallet_redemption_skipped_suspended",
                extra={"redemption_id": str(redemption_id), "user_id": str(user_id)},
            )
            return None

        redemption = await session.scalar(
            select(PassportOfferRedemption)
            .options(selectinload(PassportOfferRedemption.offer))
            .where(PassportOfferRedemption.id == redemption_id)
        )
        if redemption is None:
            logger.warning(
                "yuni_wallet_redemption_missing",
                extra={"redemption_id": str(redemption_id), "user_id": str(user_id)},
            )
            return None

        status = (
            redemption.status.value
            if isinstance(redemption.status, OfferRedemptionStatus)
            else str(redemption.status)
        )
        if status != OfferRedemptionStatus.COMPLETED.value:
            return None

        metadata: dict[str, str] = {
            "redemption_id": str(redemption.id),
            "offer_id": str(redemption.partner_offer_id),
            "organization_id": "",
            "reason": "partner_redemption_completed",
        }
        offer = redemption.offer
        if offer is not None:
            metadata["offer_id"] = str(offer.id)
            metadata["organization_id"] = str(offer.organization_id)

        return await YuniWalletService(session).earn(
            user_id,
            PARTNER_REDEMPTION_YM,
            YuniTransactionReferenceType.PARTNER_OFFER_REDEMPTION.value,
            reference_id=redemption.id,
            metadata=metadata,
        )
    except YuniWalletSuspendedError:
        logger.info(
            "yuni_wallet_redemption_skipped_suspended",
            extra={"redemption_id": str(redemption_id), "user_id": str(user_id)},
        )
        return None
    except Exception:
        logger.warning(
            "yuni_wallet_redemption_award_failed",
            extra={"redemption_id": str(redemption_id), "user_id": str(user_id)},
            exc_info=True,
        )
        return None
