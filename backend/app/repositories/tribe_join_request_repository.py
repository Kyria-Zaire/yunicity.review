"""Tribe join requests persistence (bloc 4 — demande d'adhésion tribu privée)."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tribe import TribeJoinRequest


class TribeJoinRequestRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, request: TribeJoinRequest) -> TribeJoinRequest:
        self._session.add(request)
        await self._session.flush()
        return request

    async def get_by_id(self, request_id: uuid.UUID) -> TribeJoinRequest | None:
        result = await self._session.execute(
            select(TribeJoinRequest).where(TribeJoinRequest.id == request_id)
        )
        return result.scalar_one_or_none()

    async def get_pending_for_user_tribe(
        self, tribe_id: uuid.UUID, user_id: uuid.UUID
    ) -> TribeJoinRequest | None:
        result = await self._session.execute(
            select(TribeJoinRequest).where(
                TribeJoinRequest.tribe_id == tribe_id,
                TribeJoinRequest.requested_by == user_id,
                TribeJoinRequest.accepted_at.is_(None),
                TribeJoinRequest.declined_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def list_pending_for_tribe(self, tribe_id: uuid.UUID) -> list[TribeJoinRequest]:
        result = await self._session.execute(
            select(TribeJoinRequest)
            .where(
                TribeJoinRequest.tribe_id == tribe_id,
                TribeJoinRequest.accepted_at.is_(None),
                TribeJoinRequest.declined_at.is_(None),
            )
            .order_by(TribeJoinRequest.created_at.asc())
        )
        return list(result.scalars().all())
