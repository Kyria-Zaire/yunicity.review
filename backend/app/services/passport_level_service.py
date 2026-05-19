"""Passport level & local reputation (TICKET-502)."""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.passport_constants import PassportTierCode
from app.core.passport_level_rules import (
    GOLD_REPUTATION_THRESHOLD,
    NEWCOMER_ACCOUNT_MAX_AGE_DAYS,
    PASSPORT_LEVEL_FEED_ANNOUNCEMENTS,
    REPUTATION_PER_POST,
    REPUTATION_PER_REDEMPTION,
    REPUTATION_PER_STAMP,
    REPUTATION_TENURE_BONUS,
    REPUTATION_TENURE_DAYS,
    REPUTATION_VERIFIED_ACCOUNT,
    SILVER_REPUTATION_THRESHOLD,
    SPECIAL_TIER_CODES,
    engagement_tier_for_score,
)
from app.models.passport import Passport, PassportTierEvent
from app.models.user import User
from app.repositories.passport_repository import PassportRepository
from app.repositories.post_repository import PostRepository
from app.schemas.passport_level import PassportProgressionHint

logger = logging.getLogger(__name__)

TIER_DISPLAY_LABELS: dict[str, str] = {
    PassportTierCode.BASIC.value: "Citoyen·ne",
    PassportTierCode.SILVER.value: "Silver",
    PassportTierCode.GOLD.value: "Gold",
    PassportTierCode.NEO_ARRIVANT.value: "Néo-arrivant",
    PassportTierCode.PRESS_CREATOR.value: "Créateur·rice local·e",
    PassportTierCode.BUSINESS.value: "Business",
}

_ENGAGEMENT_RANK: dict[str, int] = {
    PassportTierCode.BASIC.value: 0,
    PassportTierCode.SILVER.value: 1,
    PassportTierCode.GOLD.value: 2,
}


@dataclass(frozen=True)
class TierPromotionResult:
    from_tier_code: str
    to_tier_code: str
    reputation_score: int


class PassportLevelService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._passports = PassportRepository(session)
        self._posts = PostRepository(session)

    @staticmethod
    def initial_tier_code_for_user(
        user: User,
        *,
        now: datetime | None = None,
    ) -> PassportTierCode:
        now = now or datetime.now(UTC)
        created = user.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=UTC)
        if (now - created).days <= NEWCOMER_ACCOUNT_MAX_AGE_DAYS:
            return PassportTierCode.NEO_ARRIVANT
        return PassportTierCode.BASIC

    @staticmethod
    def compute_reputation_score(
        passport: Passport,
        user: User,
        *,
        posts_count: int,
        now: datetime | None = None,
    ) -> int:
        now = now or datetime.now(UTC)
        score = 0
        score += passport.redemptions_count * REPUTATION_PER_REDEMPTION
        score += passport.stamps_count * REPUTATION_PER_STAMP
        score += posts_count * REPUTATION_PER_POST
        if user.is_verified:
            score += REPUTATION_VERIFIED_ACCOUNT
        activated = passport.activated_at
        if activated is not None:
            if activated.tzinfo is None:
                activated = activated.replace(tzinfo=UTC)
            if (now - activated).days >= REPUTATION_TENURE_DAYS:
                score += REPUTATION_TENURE_BONUS
        return score

    @staticmethod
    def build_progression_hint(
        *,
        current_tier_code: str,
        reputation_score: int,
    ) -> PassportProgressionHint:
        if current_tier_code in {c.value for c in SPECIAL_TIER_CODES} and current_tier_code not in (
            PassportTierCode.NEO_ARRIVANT.value,
        ):
            return PassportProgressionHint(
                next_tier_code=None,
                next_tier_label=None,
                hint="Votre niveau reflète votre rôle sur le territoire.",
                reputation_score=reputation_score,
                points_to_next=None,
            )

        if current_tier_code == PassportTierCode.GOLD.value:
            return PassportProgressionHint(
                next_tier_code=None,
                next_tier_label=None,
                hint="Merci pour votre engagement local.",
                reputation_score=reputation_score,
                points_to_next=None,
            )

        if current_tier_code in (
            PassportTierCode.BASIC.value,
            PassportTierCode.NEO_ARRIVANT.value,
        ):
            next_code = PassportTierCode.SILVER
            threshold = SILVER_REPUTATION_THRESHOLD
        else:
            next_code = PassportTierCode.GOLD
            threshold = GOLD_REPUTATION_THRESHOLD

        points_to_next = max(0, threshold - reputation_score)
        if points_to_next == 0:
            hint = "Votre contribution locale est reconnue."
        else:
            hint = "Continuez à explorer la ville — chaque sortie compte."

        return PassportProgressionHint(
            next_tier_code=next_code,
            next_tier_label=TIER_DISPLAY_LABELS[next_code.value],
            hint=hint,
            reputation_score=reputation_score,
            points_to_next=points_to_next if points_to_next > 0 else None,
        )

    async def evaluate_and_maybe_promote(
        self,
        passport_id: uuid.UUID,
    ) -> TierPromotionResult | None:
        passport = await self._passports.get_active_by_id(passport_id)
        if passport is None or passport.tier is None or passport.user is None:
            return None

        user = passport.user
        posts_count = await self._posts.count_citizen_posts_for_user(user.id)
        now = datetime.now(UTC)
        score = self.compute_reputation_score(passport, user, posts_count=posts_count, now=now)
        passport.reputation_score = score

        current_code = (
            passport.tier.code.value
            if isinstance(passport.tier.code, PassportTierCode)
            else str(passport.tier.code)
        )

        if current_code in {
            PassportTierCode.PRESS_CREATOR.value,
            PassportTierCode.BUSINESS.value,
        }:
            await self._session.flush()
            return None

        eligible = engagement_tier_for_score(score)
        target = self._resolve_target_tier(current_code, eligible)

        if target.value == current_code:
            await self._session.flush()
            return None

        new_tier = await self._passports.get_tier_by_code(target)
        if new_tier is None:
            await self._session.flush()
            return None

        await self._passports.add_tier_event(
            PassportTierEvent(
                passport_id=passport.id,
                from_tier_code=current_code,
                to_tier_code=target.value,
                reason="reputation_progression",
            )
        )
        await self._passports.update_tier(passport, tier=new_tier, unlocked_at=now)
        await self._session.commit()

        logger.info(
            "passport_tier_promoted",
            extra={
                "passport_id": str(passport.id),
                "user_id": str(user.id),
                "from_tier": current_code,
                "to_tier": target.value,
                "reputation_score": score,
            },
        )

        from app.services.social_notification_service import SocialNotificationService

        await SocialNotificationService(self._session).notify_passport_level_unlocked(
            target_user_id=user.id,
            tier_code=target.value,
            tier_label=TIER_DISPLAY_LABELS.get(target.value, target.value),
        )

        if PASSPORT_LEVEL_FEED_ANNOUNCEMENTS:
            logger.info(
                "passport_tier_feed_announcement_skipped_flag",
                extra={"passport_id": str(passport.id), "tier": target.value},
            )

        return TierPromotionResult(
            from_tier_code=current_code,
            to_tier_code=target.value,
            reputation_score=score,
        )

    @staticmethod
    def _resolve_target_tier(
        current_code: str,
        eligible: PassportTierCode,
    ) -> PassportTierCode:
        if current_code == PassportTierCode.NEO_ARRIVANT.value:
            eligible_rank = _ENGAGEMENT_RANK.get(eligible.value, 0)
            if eligible_rank >= _ENGAGEMENT_RANK[PassportTierCode.SILVER.value]:
                return eligible
            return PassportTierCode.NEO_ARRIVANT

        current_rank = _ENGAGEMENT_RANK.get(current_code, 0)
        eligible_rank = _ENGAGEMENT_RANK.get(eligible.value, 0)
        if eligible_rank > current_rank:
            return eligible
        return PassportTierCode(current_code)
