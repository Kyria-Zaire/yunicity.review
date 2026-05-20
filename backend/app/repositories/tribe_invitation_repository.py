"""Tribe invitation persistence (TICKET-A.2)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.tribe import TribeInvitation


class TribeInvitationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_token_hash(self, token_hash: str) -> TribeInvitation | None:
        result = await self._session.execute(
            select(TribeInvitation).where(TribeInvitation.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def add(self, invitation: TribeInvitation) -> TribeInvitation:
        self._session.add(invitation)
        await self._session.flush()
        return invitation

    async def get_by_id(self, invitation_id: uuid.UUID) -> TribeInvitation | None:
        result = await self._session.execute(
            select(TribeInvitation)
            .options(joinedload(TribeInvitation.tribe))
            .where(TribeInvitation.id == invitation_id)
        )
        return result.scalar_one_or_none()

    async def list_pending_for_user(self, user_id: uuid.UUID) -> list[TribeInvitation]:
        now = datetime.now(UTC)
        result = await self._session.execute(
            select(TribeInvitation)
            .options(joinedload(TribeInvitation.tribe))
            .where(
                TribeInvitation.invited_user_id == user_id,
                TribeInvitation.accepted_at.is_(None),
                TribeInvitation.revoked_at.is_(None),
                TribeInvitation.expires_at > now,
            )
            .order_by(TribeInvitation.created_at.desc())
        )
        return list(result.scalars().unique().all())

    @staticmethod
    def is_usable(invitation: TribeInvitation) -> bool:
        now = datetime.now(UTC)
        expires = invitation.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=UTC)
        return invitation.revoked_at is None and invitation.accepted_at is None and expires > now
