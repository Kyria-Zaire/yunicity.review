"""Tribe moderation audit log (TICKET-A.2)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tribe import TribeModerationLog


class TribeModerationLogService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def log(
        self,
        *,
        tribe_id: uuid.UUID,
        actor_user_id: uuid.UUID | None,
        action: str,
        target_user_id: uuid.UUID | None = None,
        target_post_id: uuid.UUID | None = None,
        detail: str | None = None,
    ) -> None:
        self._session.add(
            TribeModerationLog(
                tribe_id=tribe_id,
                actor_user_id=actor_user_id,
                action=action,
                target_user_id=target_user_id,
                target_post_id=target_post_id,
                detail=detail,
                created_at=datetime.now(UTC),
            )
        )
        await self._session.flush()
