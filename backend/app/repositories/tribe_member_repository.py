"""Tribe membership persistence (TICKET-A.2)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tribe_constants import (
    TRIBE_MAX_ACTIVE_PER_USER,
    TRIBE_MEMBER_LIMIT_DEFAULT,
    TRIBE_REJOIN_COOLDOWN_DAYS,
    TribeMemberRole,
)
from app.models.tribe import TribeMember


class TribeMemberRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_membership(self, tribe_id: uuid.UUID, user_id: uuid.UUID) -> TribeMember | None:
        result = await self._session.execute(
            select(TribeMember).where(
                TribeMember.tribe_id == tribe_id,
                TribeMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_active_membership(
        self, tribe_id: uuid.UUID, user_id: uuid.UUID
    ) -> TribeMember | None:
        result = await self._session.execute(
            select(TribeMember).where(
                TribeMember.tribe_id == tribe_id,
                TribeMember.user_id == user_id,
                TribeMember.left_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def count_active_members(self, tribe_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(TribeMember)
            .where(
                TribeMember.tribe_id == tribe_id,
                TribeMember.left_at.is_(None),
            )
        )
        return int(result.scalar_one())

    async def count_active_tribes_for_user(self, user_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(TribeMember)
            .where(
                TribeMember.user_id == user_id,
                TribeMember.left_at.is_(None),
            )
        )
        return int(result.scalar_one())

    async def list_active_members(
        self, tribe_id: uuid.UUID, *, offset: int, limit: int
    ) -> list[TribeMember]:
        result = await self._session.execute(
            select(TribeMember)
            .where(
                TribeMember.tribe_id == tribe_id,
                TribeMember.left_at.is_(None),
            )
            .order_by(TribeMember.joined_at.asc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_active_owner(self, tribe_id: uuid.UUID) -> TribeMember | None:
        result = await self._session.execute(
            select(TribeMember).where(
                TribeMember.tribe_id == tribe_id,
                TribeMember.role == TribeMemberRole.OWNER.value,
                TribeMember.left_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def add(self, member: TribeMember) -> TribeMember:
        self._session.add(member)
        await self._session.flush()
        return member

    async def can_rejoin(self, tribe_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        member = await self.get_membership(tribe_id, user_id)
        if member is None or member.left_at is None:
            return True
        cutoff = datetime.now(UTC) - timedelta(days=TRIBE_REJOIN_COOLDOWN_DAYS)
        left_at = member.left_at
        if left_at.tzinfo is None:
            left_at = left_at.replace(tzinfo=UTC)
        return left_at <= cutoff

    async def is_at_user_tribe_limit(self, user_id: uuid.UUID) -> bool:
        count = await self.count_active_tribes_for_user(user_id)
        return count >= TRIBE_MAX_ACTIVE_PER_USER

    async def is_at_member_limit(self, tribe_id: uuid.UUID, limit: int) -> bool:
        effective = limit or TRIBE_MEMBER_LIMIT_DEFAULT
        count = await self.count_active_members(tribe_id)
        return count >= effective
