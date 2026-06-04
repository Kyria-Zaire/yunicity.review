"""Admin partner offer read persistence (ADMIN-04E-A)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.passport import PartnerOffer, Passport, PassportOfferRedemption
from app.models.user import User
from app.models.user_profile import UserProfile


@dataclass(frozen=True, slots=True)
class AdminOfferRedemptionRow:
    redemption: PassportOfferRedemption
    passport: Passport
    user: User
    profile: UserProfile | None


class AdminPartnerOfferRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def offer_exists(self, offer_id: uuid.UUID) -> bool:
        stmt = (
            select(func.count())
            .select_from(PartnerOffer)
            .where(PartnerOffer.id == offer_id)
        )
        count = int((await self._session.execute(stmt)).scalar_one())
        return count > 0

    async def list_offer_redemptions(
        self,
        *,
        offer_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[AdminOfferRedemptionRow], int]:
        filters = [PassportOfferRedemption.partner_offer_id == offer_id]
        count_stmt = select(func.count()).select_from(PassportOfferRedemption).where(*filters)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        stmt = (
            select(PassportOfferRedemption, Passport, User, UserProfile)
            .join(Passport, PassportOfferRedemption.passport_id == Passport.id)
            .join(User, Passport.user_id == User.id)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
            .where(*filters)
            .order_by(
                PassportOfferRedemption.redeemed_at.desc().nulls_last(),
                PassportOfferRedemption.created_at.desc(),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        rows = [
            AdminOfferRedemptionRow(
                redemption=redemption,
                passport=passport,
                user=user,
                profile=profile,
            )
            for redemption, passport, user, profile in result.all()
        ]
        return rows, total
