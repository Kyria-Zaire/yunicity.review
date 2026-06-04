"""Admin local event persistence (ADMIN-05C / 05D-A)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event_admin_action import EventAdminAction
from app.models.local_event import LocalEvent
from app.models.user import User
from app.models.user_profile import UserProfile
from app.repositories.local_event_repository import LocalEventRepository


@dataclass(frozen=True, slots=True)
class AdminEventActionRow:
    action: EventAdminAction
    actor: User | None
    actor_profile: UserProfile | None


class AdminLocalEventRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._events = LocalEventRepository(session)

    async def get_by_id(self, event_id: uuid.UUID) -> LocalEvent | None:
        return await self._events.get_by_id(event_id)

    async def event_exists(self, event_id: uuid.UUID) -> bool:
        stmt = (
            select(func.count()).select_from(LocalEvent).where(LocalEvent.id == event_id)
        )
        count = int((await self._session.execute(stmt)).scalar_one())
        return count > 0

    async def count_interests(self, event_id: uuid.UUID) -> int:
        return await self._events.count_interests_for_event(event_id)

    async def count_admin_actions(self, local_event_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(EventAdminAction)
            .where(EventAdminAction.local_event_id == local_event_id)
        )
        return int((await self._session.execute(stmt)).scalar_one())

    async def record_admin_action(
        self,
        *,
        local_event_id: uuid.UUID,
        action: str,
        actor_user_id: uuid.UUID,
        previous_status: str | None,
        new_status: str | None,
        reason: str | None,
        metadata: dict[str, Any] | None = None,
        created_at: datetime | None = None,
    ) -> EventAdminAction:
        entry = EventAdminAction(
            local_event_id=local_event_id,
            action=action,
            actor_user_id=actor_user_id,
            previous_status=previous_status,
            new_status=new_status,
            reason=reason,
            metadata_=metadata,
            created_at=created_at or datetime.now(UTC),
        )
        self._session.add(entry)
        await self._session.flush()
        return entry

    async def list_admin_actions(
        self,
        *,
        local_event_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[AdminEventActionRow], int]:
        filters = [EventAdminAction.local_event_id == local_event_id]
        count_stmt = select(func.count()).select_from(EventAdminAction).where(*filters)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        stmt = (
            select(EventAdminAction, User, UserProfile)
            .outerjoin(User, EventAdminAction.actor_user_id == User.id)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
            .where(*filters)
            .order_by(EventAdminAction.created_at.desc(), EventAdminAction.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        rows = [
            AdminEventActionRow(
                action=row[0],
                actor=row[1] if isinstance(row[1], User) else None,
                actor_profile=row[2] if isinstance(row[2], UserProfile) else None,
            )
            for row in result.all()
        ]
        return rows, total
