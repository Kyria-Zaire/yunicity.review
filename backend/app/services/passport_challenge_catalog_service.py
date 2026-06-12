"""Passport challenge catalog read service (PASSPORT-04A).

Progress tracking: PassportChallengeProgressService (PASSPORT-04B).
Reward claim: future tickets.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seeds.passport_challenges import seed_passport_challenges
from app.models.passport_challenge import PassportChallenge


class PassportChallengeCatalogService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_active_challenges(self) -> list[PassportChallenge]:
        stmt = (
            select(PassportChallenge)
            .where(PassportChallenge.is_active.is_(True))
            .order_by(PassportChallenge.display_order.asc(), PassportChallenge.name.asc())
        )
        return list((await self._session.execute(stmt)).scalars().all())

    async def get_challenge_by_code(self, code: str) -> PassportChallenge | None:
        result = await self._session.scalar(
            select(PassportChallenge).where(PassportChallenge.code == code).limit(1)
        )
        return result

    async def ensure_mvp_challenges(self) -> None:
        await seed_passport_challenges(self._session)
