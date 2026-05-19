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
