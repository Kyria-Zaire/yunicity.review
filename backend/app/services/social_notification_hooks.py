"""Best-effort social notification triggers (TICKET-503)."""

from __future__ import annotations

import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post import Post
from app.services.social_notification_service import SocialNotificationService

logger = logging.getLogger(__name__)


async def notify_post_liked(
    session: AsyncSession,
    *,
    actor_id: uuid.UUID,
    post: Post,
) -> None:
    if post.tribe_id is not None:
        return
    try:
        await SocialNotificationService(session).notify_post_liked(
            actor_id=actor_id,
            post=post,
        )
    except Exception:
        logger.warning(
            "social_notification_failed",
            extra={"event": "post_liked", "post_id": str(post.id)},
            exc_info=True,
        )


async def notify_post_commented(
    session: AsyncSession,
    *,
    actor_id: uuid.UUID,
    post: Post,
    comment_body: str,
) -> None:
    if post.tribe_id is not None:
        return
    try:
        await SocialNotificationService(session).notify_post_commented(
            actor_id=actor_id,
            post=post,
            comment_body=comment_body,
        )
    except Exception:
        logger.warning(
            "social_notification_failed",
            extra={"event": "post_commented", "post_id": str(post.id)},
            exc_info=True,
        )
