"""Admin partner offer read persistence (ADMIN-04E-A / 04E-B1)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.offer_admin_action import OfferAdminAction
from app.models.passport import PartnerOffer, Passport, PassportOfferRedemption
from app.models.user import User
from app.models.user_profile import UserProfile


@dataclass(frozen=True, slots=True)
class AdminOfferRedemptionRow:
    redemption: PassportOfferRedemption
    passport: Passport
    user: User
    profile: UserProfile | None


@dataclass(frozen=True, slots=True)
class AdminOfferActionRow:
    action: OfferAdminAction
    actor: User | None
    actor_profile: UserProfile | None


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

    async def count_admin_actions(self, partner_offer_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(OfferAdminAction)
            .where(OfferAdminAction.partner_offer_id == partner_offer_id)
        )
        return int((await self._session.execute(stmt)).scalar_one())

    async def record_admin_action(
        self,
        *,
        partner_offer_id: uuid.UUID,
        action: str,
        actor_user_id: uuid.UUID,
        previous_status: str | None,
        new_status: str | None,
        reason: str | None,
        metadata: dict[str, Any] | None = None,
        created_at: datetime | None = None,
    ) -> OfferAdminAction:
        entry = OfferAdminAction(
            partner_offer_id=partner_offer_id,
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
        partner_offer_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[AdminOfferActionRow], int]:
        filters = [OfferAdminAction.partner_offer_id == partner_offer_id]
        count_stmt = select(func.count()).select_from(OfferAdminAction).where(*filters)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        stmt = (
            select(OfferAdminAction, User, UserProfile)
            .outerjoin(User, OfferAdminAction.actor_user_id == User.id)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
            .where(*filters)
            .order_by(OfferAdminAction.created_at.desc(), OfferAdminAction.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        rows = [
            AdminOfferActionRow(
                action=row[0],
                actor=row[1] if isinstance(row[1], User) else None,
                actor_profile=row[2] if isinstance(row[2], UserProfile) else None,
            )
            for row in result.all()
        ]
        return rows, total
