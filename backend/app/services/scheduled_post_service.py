"""Auto-publication of scheduled posts (FEED-SCHED-01).

Posts created with a future ``scheduled_at`` are stored inactive
(``is_active = False``). A recurring worker job calls
:func:`publish_due_scheduled_posts` to activate them once their scheduled
time has passed.

``scheduled_published_at`` is the explicit "already published" marker: once
set it is never cleared, so a post soft-deleted after publication is never
re-published even though it becomes inactive again.
"""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post import Post

logger = logging.getLogger(__name__)


async def publish_due_scheduled_posts(
    session: AsyncSession,
    *,
    now: datetime | None = None,
) -> list[uuid.UUID]:
    """Activate every scheduled post whose time has come.

    A post is published when it is scheduled (``scheduled_at`` set and due),
    still inactive, and was never published before. The update is idempotent:
    a second run touches nothing because ``scheduled_published_at`` is now set.

    Returns the ids of the posts published by this call.
    """
    moment = now or datetime.now(UTC)
    stmt = (
        update(Post)
        .where(
            Post.scheduled_at.is_not(None),
            Post.scheduled_at <= moment,
            Post.is_active.is_(False),
            Post.scheduled_published_at.is_(None),
        )
        .values(is_active=True, scheduled_published_at=moment)
        .returning(Post.id)
    )
    result = await session.execute(stmt)
    published = [row[0] for row in result.all()]
    if published:
        await session.commit()
        logger.info(
            "scheduled_posts_published",
            extra={"count": len(published), "post_ids": [str(pid) for pid in published]},
        )
    else:
        # No write happened; keep the read-only transaction clean.
        await session.rollback()
    return published
