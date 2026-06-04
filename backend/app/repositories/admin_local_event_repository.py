"""Admin local event read persistence (ADMIN-05C)."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.local_event import LocalEvent
from app.repositories.local_event_repository import LocalEventRepository


class AdminLocalEventRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._events = LocalEventRepository(session)

    async def get_by_id(self, event_id: uuid.UUID) -> LocalEvent | None:
        return await self._events.get_by_id(event_id)

    async def count_interests(self, event_id: uuid.UUID) -> int:
        return await self._events.count_interests_for_event(event_id)
