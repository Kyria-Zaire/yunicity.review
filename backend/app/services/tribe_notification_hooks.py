"""Tribe notifications — minimal MVP (TICKET-A.2)."""

from __future__ import annotations

import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


async def notify_tribe_invitation(
    session: AsyncSession,
    *,
    invitee_user_id: uuid.UUID,
    tribe_name: str,
    tribe_slug: str,
) -> None:
    try:
        await NotificationService(session).send_to_user(
            invitee_user_id,
            title="Yunicity",
            body=f"Invitation à rejoindre « {tribe_name} ».",
            data={"type": "tribe_invitation", "tribe_slug": tribe_slug},
        )
    except Exception:
        logger.warning(
            "tribe_notification_failed",
            extra={"event": "tribe_invitation", "user_id": str(invitee_user_id)},
            exc_info=True,
        )


async def notify_tribe_invitation_accepted(
    session: AsyncSession,
    *,
    inviter_user_id: uuid.UUID,
    tribe_name: str,
    acceptor_name: str,
) -> None:
    try:
        await NotificationService(session).send_to_user(
            inviter_user_id,
            title="Yunicity",
            body=f"{acceptor_name} a rejoint « {tribe_name} ».",
            data={"type": "tribe_invitation_accepted"},
        )
    except Exception:
        logger.warning(
            "tribe_notification_failed",
            extra={"event": "tribe_invitation_accepted", "user_id": str(inviter_user_id)},
            exc_info=True,
        )
