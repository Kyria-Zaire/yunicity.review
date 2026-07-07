"""ARQ cron job: auto-publish scheduled posts (FEED-SCHED-01).

Runs on the existing media worker (see ``workers/video_worker.py``). A minute
tick activates any scheduled post whose time has passed; on worker restart the
next tick catches up every overdue post at once, so nothing is lost — only
published late by at most (downtime + 1 minute).
"""

from __future__ import annotations

import logging
from typing import Any

from app.core.config import get_settings
from app.db.session import get_session_factory, init_db
from app.services.scheduled_post_service import publish_due_scheduled_posts

logger = logging.getLogger(__name__)


async def publish_scheduled_posts_job(ctx: dict[str, Any]) -> int:
    """Cron entrypoint: publish due scheduled posts, return how many."""
    del ctx
    session_factory = get_session_factory()
    if session_factory is None:
        init_db(get_settings())
        session_factory = get_session_factory()
    if session_factory is None:
        logger.warning("scheduled_posts_cron_no_db")
        return 0

    async with session_factory() as session:
        published = await publish_due_scheduled_posts(session)
    return len(published)
