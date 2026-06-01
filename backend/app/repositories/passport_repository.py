"""Passport persistence layer."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.passport_constants import PassportStampSource, PassportStatus, PassportTierCode
from app.models.passport import (
    Passport,
    PassportOfferRedemption,
    PassportStamp,
    PassportTier,
    PassportTierEvent,
)


class PassportRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_active_by_qr_token(self, qr_token: str) -> Passport | None:
        result = await self._session.execute(
            select(Passport)
            .options(selectinload(Passport.tier), selectinload(Passport.user))
            .where(
                Passport.qr_token == qr_token,
                Passport.status == PassportStatus.ACTIVE.value,
            )
        )
        return result.scalar_one_or_none()

    async def get_active_for_user(self, user_id: uuid.UUID) -> Passport | None:
        result = await self._session.execute(
            select(Passport)
            .options(selectinload(Passport.tier))
            .where(
                Passport.user_id == user_id,
                Passport.status == PassportStatus.ACTIVE.value,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_id_for_user(
        self,
        passport_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Passport | None:
        result = await self._session.execute(
            select(Passport)
            .options(selectinload(Passport.tier))
            .where(Passport.id == passport_id, Passport.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_tier_by_code(self, code: PassportTierCode) -> PassportTier | None:
        result = await self._session.execute(
            select(PassportTier).where(PassportTier.code == code.value)
        )
        return result.scalar_one_or_none()

    async def list_public_tiers(self) -> list[PassportTier]:
        result = await self._session.execute(
            select(PassportTier)
            .where(
                PassportTier.is_active.is_(True),
                PassportTier.is_publicly_visible.is_(True),
            )
            .order_by(PassportTier.display_order.asc())
        )
        return list(result.scalars().all())

    async def create_passport(self, passport: Passport) -> Passport:
        self._session.add(passport)
        await self._session.flush()
        await self._session.refresh(passport, attribute_names=["tier"])
        return passport

    async def list_stamps_for_passport(self, passport_id: uuid.UUID) -> list[PassportStamp]:
        result = await self._session.execute(
            select(PassportStamp)
            .options(selectinload(PassportStamp.organization))
            .where(PassportStamp.passport_id == passport_id)
            .order_by(PassportStamp.stamped_at.desc())
        )
        return list(result.scalars().all())

    async def get_redemption(
        self,
        *,
        passport_id: uuid.UUID,
        partner_offer_id: uuid.UUID,
    ) -> PassportOfferRedemption | None:
        result = await self._session.execute(
            select(PassportOfferRedemption).where(
                PassportOfferRedemption.passport_id == passport_id,
                PassportOfferRedemption.partner_offer_id == partner_offer_id,
            )
        )
        return result.scalar_one_or_none()

    async def create_redemption(
        self,
        redemption: PassportOfferRedemption,
    ) -> PassportOfferRedemption:
        self._session.add(redemption)
        await self._session.flush()
        return redemption

    async def increment_redemptions_count(self, passport: Passport) -> None:
        passport.redemptions_count = passport.redemptions_count + 1
        await self._session.flush()

    async def add_stamp_if_missing(
        self,
        *,
        passport_id: uuid.UUID,
        organization_id: uuid.UUID,
        stamped_at: datetime,
        stamp_source: PassportStampSource = PassportStampSource.ORGANIZATION,
        metadata: dict[str, object] | None = None,
    ) -> bool:
        existing = await self._session.execute(
            select(PassportStamp.id).where(
                PassportStamp.passport_id == passport_id,
                PassportStamp.organization_id == organization_id,
            )
        )
        if existing.scalar_one_or_none() is not None:
            return False

        passport = await self._session.get(Passport, passport_id)
        if passport is None:
            return False

        stamp = PassportStamp(
            passport_id=passport_id,
            organization_id=organization_id,
            stamp_source=stamp_source,
            stamped_at=stamped_at,
            metadata_=metadata or {},
        )
        self._session.add(stamp)
        passport.stamps_count = passport.stamps_count + 1
        passport.last_stamp_at = stamped_at
        await self._session.flush()
        return True

    async def get_stamp_with_org(
        self,
        *,
        passport_id: uuid.UUID,
        organization_id: uuid.UUID,
    ) -> PassportStamp | None:
        result = await self._session.execute(
            select(PassportStamp)
            .options(selectinload(PassportStamp.organization))
            .where(
                PassportStamp.passport_id == passport_id,
                PassportStamp.organization_id == organization_id,
            )
        )
        return result.scalar_one_or_none()

    async def touch_activated(self, passport: Passport, *, activated_at: datetime) -> None:
        passport.activated_at = activated_at
        passport.onboarding_completed = True
        passport.onboarding_step = "activated"
        await self._session.flush()

    async def get_active_by_id(self, passport_id: uuid.UUID) -> Passport | None:
        result = await self._session.execute(
            select(Passport)
            .options(selectinload(Passport.tier), selectinload(Passport.user))
            .where(
                Passport.id == passport_id,
                Passport.status == PassportStatus.ACTIVE.value,
            )
        )
        return result.scalar_one_or_none()

    async def add_tier_event(self, event: PassportTierEvent) -> PassportTierEvent:
        self._session.add(event)
        await self._session.flush()
        return event

    async def update_tier(
        self,
        passport: Passport,
        *,
        tier: PassportTier,
        unlocked_at: datetime,
    ) -> None:
        passport.tier_id = tier.id
        passport.tier = tier
        passport.tier_unlocked_at = unlocked_at
        await self._session.flush()
