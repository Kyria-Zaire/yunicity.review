"""Tribe invitation persistence (TICKET-A.2)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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

    @staticmethod
    def is_usable(invitation: TribeInvitation) -> bool:
        now = datetime.now(UTC)
        expires = invitation.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=UTC)
        return invitation.revoked_at is None and invitation.accepted_at is None and expires > now
