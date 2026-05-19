"""Best-effort push triggers — never block main transactions (TICKET-307)."""

from __future__ import annotations

import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


async def notify_redemption_success(session: AsyncSession, citizen_user_id: uuid.UUID) -> None:
    try:
        await NotificationService(session).send_to_user(
            citizen_user_id,
            title="Yunicity",
            body="Votre avantage a été validé",
            data={"type": "redemption_success"},
        )
    except Exception:
        logger.warning(
            "push_notification_failed",
            extra={"event": "redemption_success", "user_id": str(citizen_user_id)},
            exc_info=True,
        )


async def notify_offer_approved(session: AsyncSession, creator_user_id: uuid.UUID) -> None:
    try:
        await NotificationService(session).send_to_user(
            creator_user_id,
            title="Yunicity",
            body="Votre offre est visible dans Yunicity",
            data={"type": "offer_approved"},
        )
    except Exception:
        logger.warning(
            "push_notification_failed",
            extra={"event": "offer_approved", "user_id": str(creator_user_id)},
            exc_info=True,
        )


def _passport_level_notification_body(tier_code: str) -> str:
    messages = {
        "silver": "Vous avez atteint le niveau Silver.",
        "gold": "Votre Passport évolue — niveau Gold.",
        "neo_arrivant": "Bienvenue sur le territoire.",
        "press_creator": "Bienvenue parmi les créateurs locaux.",
        "basic": "Votre Passport est actif.",
    }
    return messages.get(tier_code, "Votre Passport évolue.")


async def notify_passport_level_up(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    tier_code: str,
) -> None:
    try:
        await NotificationService(session).send_to_user(
            user_id,
            title="Yunicity",
            body=_passport_level_notification_body(tier_code),
            data={"type": "passport_level_up", "tier_code": tier_code},
        )
    except Exception:
        logger.warning(
            "push_notification_failed",
            extra={"event": "passport_level_up", "user_id": str(user_id), "tier": tier_code},
            exc_info=True,
        )


async def notify_offer_rejected(session: AsyncSession, creator_user_id: uuid.UUID) -> None:
    try:
        await NotificationService(session).send_to_user(
            creator_user_id,
            title="Yunicity",
            body="Quelques ajustements sont nécessaires sur votre offre",
            data={"type": "offer_rejected"},
        )
    except Exception:
        logger.warning(
            "push_notification_failed",
            extra={"event": "offer_rejected", "user_id": str(creator_user_id)},
            exc_info=True,
        )
