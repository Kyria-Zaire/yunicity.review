"""Push subscription persistence (TICKET-307)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.push_subscription import PushSubscription


class PushSubscriptionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, subscription_id: uuid.UUID) -> PushSubscription | None:
        result = await self._session.execute(
            select(PushSubscription).where(PushSubscription.id == subscription_id)
        )
        return result.scalar_one_or_none()

    async def get_by_token(self, expo_push_token: str) -> PushSubscription | None:
        result = await self._session.execute(
            select(PushSubscription).where(PushSubscription.expo_push_token == expo_push_token)
        )
        return result.scalar_one_or_none()

    async def list_active_for_user(self, user_id: uuid.UUID) -> list[PushSubscription]:
        result = await self._session.execute(
            select(PushSubscription)
            .where(
                PushSubscription.user_id == user_id,
                PushSubscription.is_active.is_(True),
            )
            .order_by(PushSubscription.last_seen_at.desc())
        )
        return list(result.scalars().all())

    async def list_for_user(self, user_id: uuid.UUID) -> list[PushSubscription]:
        result = await self._session.execute(
            select(PushSubscription)
            .where(PushSubscription.user_id == user_id)
            .order_by(PushSubscription.last_seen_at.desc())
        )
        return list(result.scalars().all())

    async def deactivate(self, subscription_id: uuid.UUID) -> None:
        await self._session.execute(
            update(PushSubscription)
            .where(PushSubscription.id == subscription_id)
            .values(is_active=False, updated_at=datetime.now(UTC))
        )

    async def deactivate_by_token(self, expo_push_token: str) -> None:
        await self._session.execute(
            update(PushSubscription)
            .where(PushSubscription.expo_push_token == expo_push_token)
            .values(is_active=False, updated_at=datetime.now(UTC))
        )

    async def add(self, subscription: PushSubscription) -> PushSubscription:
        self._session.add(subscription)
        await self._session.flush()
        return subscription
