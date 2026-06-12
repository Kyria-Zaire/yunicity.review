"""Passport badge earning service (PASSPORT-03B).

Automatic MVP rules + idempotent manual award. No reputation/YM side effects.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import UTC
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.passport_badge_constants import (
    EXPLORATEUR_REIMS_STAMP_THRESHOLD,
    PASSPORT_PIONEER_CUTOFF,
    SOUTIEN_LOCAL_REDEMPTION_THRESHOLD,
    PassportBadgeCode,
    PassportBadgeSourceType,
)
from app.core.passport_constants import OfferRedemptionStatus, PassportStatus
from app.models.passport import Passport, PassportOfferRedemption, PassportStamp
from app.models.passport_badge import PassportBadge, UserPassportBadge
from app.models.user import User
from app.services.passport_badge_catalog_service import PassportBadgeCatalogService


@dataclass
class BadgeAwardReport:
    awarded: list[str] = field(default_factory=list)
    already_earned: list[str] = field(default_factory=list)
    not_eligible: list[str] = field(default_factory=list)


class PassportBadgeEarningService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._catalog = PassportBadgeCatalogService(session)

    async def evaluate_user(self, user_id: uuid.UUID) -> BadgeAwardReport:
        report = BadgeAwardReport()
        evaluators = (
            (PassportBadgeCode.EXPLORATEUR_REIMS.value, self.evaluate_explorateur_reims),
            (PassportBadgeCode.SOUTIEN_LOCAL.value, self.evaluate_soutien_local),
            (PassportBadgeCode.PIONNIER_YUNICITY.value, self.evaluate_pionnier_yunicity),
        )
        for code, evaluator in evaluators:
            had_badge = await self.has_badge(user_id, code)
            result = await evaluator(user_id)
            if had_badge:
                report.already_earned.append(code)
            elif result is not None:
                report.awarded.append(code)
            else:
                report.not_eligible.append(code)
        return report

    async def evaluate_explorateur_reims(
        self,
        user_id: uuid.UUID,
    ) -> UserPassportBadge | None:
        code = PassportBadgeCode.EXPLORATEUR_REIMS.value
        existing = await self._get_user_badge(user_id, code)
        if existing is not None:
            return existing

        stamp_count = await self._count_passport_stamps(user_id)
        if stamp_count < EXPLORATEUR_REIMS_STAMP_THRESHOLD:
            return None

        return await self.award_badge(
            user_id,
            code,
            source_type=PassportBadgeSourceType.PASSPORT_STAMPS.value,
            metadata={
                "stamp_count": stamp_count,
                "threshold": EXPLORATEUR_REIMS_STAMP_THRESHOLD,
                "reason": "explorer_threshold_reached",
            },
        )

    async def evaluate_soutien_local(
        self,
        user_id: uuid.UUID,
    ) -> UserPassportBadge | None:
        code = PassportBadgeCode.SOUTIEN_LOCAL.value
        existing = await self._get_user_badge(user_id, code)
        if existing is not None:
            return existing

        redemption_count = await self._count_completed_redemptions(user_id)
        if redemption_count < SOUTIEN_LOCAL_REDEMPTION_THRESHOLD:
            return None

        return await self.award_badge(
            user_id,
            code,
            source_type=PassportBadgeSourceType.PARTNER_OFFER_REDEMPTION.value,
            metadata={
                "redemption_count": redemption_count,
                "threshold": SOUTIEN_LOCAL_REDEMPTION_THRESHOLD,
                "reason": "local_support_threshold_reached",
            },
        )

    async def evaluate_pionnier_yunicity(
        self,
        user_id: uuid.UUID,
    ) -> UserPassportBadge | None:
        code = PassportBadgeCode.PIONNIER_YUNICITY.value
        existing = await self._get_user_badge(user_id, code)
        if existing is not None:
            return existing

        user = await self._session.get(User, user_id)
        if user is None:
            return None

        registered_at = user.created_at
        if registered_at.tzinfo is None:
            registered_at = registered_at.replace(tzinfo=UTC)
        if registered_at > PASSPORT_PIONEER_CUTOFF:
            return None

        return await self.award_badge(
            user_id,
            code,
            source_type=PassportBadgeSourceType.USER_REGISTRATION.value,
            source_id=user_id,
            metadata={
                "registered_at": registered_at.isoformat(),
                "cutoff": PASSPORT_PIONEER_CUTOFF.isoformat(),
                "reason": "pioneer_cutoff_eligible",
            },
        )

    async def evaluate_amateur_spectacles(
        self,
        user_id: uuid.UUID,
    ) -> UserPassportBadge | None:
        """Reserved for future event integration — never auto-awarded in MVP."""
        _ = user_id
        return None

    async def award_badge(
        self,
        user_id: uuid.UUID,
        badge_code: str,
        *,
        source_type: str | None = None,
        source_id: uuid.UUID | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> UserPassportBadge | None:
        badge = await self._catalog.get_badge_by_code(badge_code)
        if badge is None or not badge.is_active:
            return None

        existing = await self._get_user_badge(user_id, badge_code)
        if existing is not None:
            return existing

        earned = UserPassportBadge(
            user_id=user_id,
            badge_id=badge.id,
            source_type=source_type,
            source_id=source_id,
            metadata_=metadata,
        )
        self._session.add(earned)
        try:
            await self._session.flush()
        except IntegrityError:
            await self._session.rollback()
            return await self._get_user_badge(user_id, badge_code)

        await self._session.commit()
        await self._session.refresh(earned)
        return earned

    async def has_badge(self, user_id: uuid.UUID, badge_code: str) -> bool:
        return await self._get_user_badge(user_id, badge_code) is not None

    async def _get_user_badge(
        self,
        user_id: uuid.UUID,
        badge_code: str,
    ) -> UserPassportBadge | None:
        result = await self._session.scalar(
            select(UserPassportBadge)
            .join(PassportBadge, UserPassportBadge.badge_id == PassportBadge.id)
            .where(
                UserPassportBadge.user_id == user_id,
                PassportBadge.code == badge_code,
            )
            .limit(1)
        )
        return result

    async def _count_passport_stamps(self, user_id: uuid.UUID) -> int:
        count = await self._session.scalar(
            select(func.count())
            .select_from(PassportStamp)
            .join(Passport, PassportStamp.passport_id == Passport.id)
            .where(
                Passport.user_id == user_id,
                Passport.status == PassportStatus.ACTIVE.value,
            )
        )
        return int(count or 0)

    async def _count_completed_redemptions(self, user_id: uuid.UUID) -> int:
        count = await self._session.scalar(
            select(func.count())
            .select_from(PassportOfferRedemption)
            .join(Passport, PassportOfferRedemption.passport_id == Passport.id)
            .where(
                Passport.user_id == user_id,
                Passport.status == PassportStatus.ACTIVE.value,
                PassportOfferRedemption.status == OfferRedemptionStatus.COMPLETED.value,
            )
        )
        return int(count or 0)
