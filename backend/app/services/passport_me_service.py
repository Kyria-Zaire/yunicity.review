"""Citizen Passport read/claim orchestration (PASSPORT-05A).

Aggregates existing Passport V2 services — no duplicated business rules.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import AppError
from app.models.passport import Passport
from app.models.passport_badge import PassportBadge, UserPassportBadge
from app.models.passport_challenge import PassportChallenge, UserPassportChallenge
from app.models.user import User
from app.repositories.passport_repository import PassportRepository
from app.schemas.passport_me import (
    ChallengeClaimResponse,
    PassportBadgeResponse,
    PassportBadgesResponse,
    PassportChallengeResponse,
    PassportChallengesResponse,
    PassportOverviewPassportResponse,
    PassportOverviewResponse,
    PassportReputationResponse,
    PassportSummaryResponse,
    PassportWalletResponse,
)
from app.services.passport_badge_catalog_service import PassportBadgeCatalogService
from app.services.passport_challenge_catalog_service import PassportChallengeCatalogService
from app.services.passport_challenge_progress_service import PassportChallengeProgressService
from app.services.passport_challenge_reward_service import PassportChallengeRewardService
from app.services.passport_reputation_service import PassportReputationService
from app.services.yuni_wallet_service import YuniWalletService


class PassportMeService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._passports = PassportRepository(session)
        self._badge_catalog = PassportBadgeCatalogService(session)
        self._challenge_catalog = PassportChallengeCatalogService(session)
        self._challenge_progress = PassportChallengeProgressService(session)
        self._challenge_rewards = PassportChallengeRewardService(session)
        self._reputation = PassportReputationService(session)
        self._wallet = YuniWalletService(session)

    async def get_overview(self, user: User) -> PassportOverviewResponse:
        passport = await self._require_active_passport(user.id)
        reputation_snapshot = await self._reputation.get_reputation(user.id)
        wallet = await self._wallet.get_wallet(user.id)

        earned_badges = await self._count_earned_badges(user.id)
        active_challenges = await self._count_active_challenges(user.id)
        claimable_rewards = await self._count_claimable_rewards(user.id)

        tier_code = None
        if passport.tier is not None:
            tier_code = (
                passport.tier.code.value
                if hasattr(passport.tier.code, "value")
                else str(passport.tier.code)
            )

        return PassportOverviewResponse(
            summary=PassportSummaryResponse(
                passport_tier=tier_code,
                reputation=reputation_snapshot.total_points,
                wallet_balance=wallet.balance if wallet is not None else 0,
                earned_badges=earned_badges,
                active_challenges=active_challenges,
                claimable_rewards=claimable_rewards,
            ),
            passport=PassportOverviewPassportResponse(
                status=(
                    passport.status.value
                    if hasattr(passport.status, "value")
                    else str(passport.status)
                ),
                created_at=passport.created_at,
            ),
            wallet=PassportWalletResponse(
                balance=wallet.balance if wallet is not None else 0,
                lifetime_earned=wallet.lifetime_earned if wallet is not None else 0,
                lifetime_spent=wallet.lifetime_spent if wallet is not None else 0,
            ),
            reputation=PassportReputationResponse(
                total_points=reputation_snapshot.total_points,
            ),
        )

    async def get_badges(self, user: User) -> PassportBadgesResponse:
        await self._require_active_passport(user.id)

        earned_rows = list(
            (
                await self._session.execute(
                    select(UserPassportBadge)
                    .options(selectinload(UserPassportBadge.badge))
                    .where(UserPassportBadge.user_id == user.id)
                    .order_by(UserPassportBadge.earned_at.asc())
                )
            )
            .scalars()
            .all()
        )
        earned_codes = {row.badge.code for row in earned_rows if row.badge is not None}
        earned = [
            self._badge_response(row.badge, earned_at=row.earned_at)
            for row in earned_rows
            if row.badge is not None
        ]

        visible_catalog = await self._badge_catalog.list_active_badges(include_secret=False)
        locked = [
            self._badge_response(badge)
            for badge in visible_catalog
            if badge.code not in earned_codes
        ]

        return PassportBadgesResponse(earned=earned, locked=locked)

    async def get_challenges(self, user: User) -> PassportChallengesResponse:
        await self._require_active_passport(user.id)

        catalog = await self._challenge_catalog.list_active_challenges()
        progress_rows = await self._challenge_progress.get_user_progress(user.id)
        progress_by_challenge_id = {row.challenge_id: row for row in progress_rows}

        active: list[PassportChallengeResponse] = []
        completed: list[PassportChallengeResponse] = []
        claimable: list[PassportChallengeResponse] = []

        for challenge in catalog:
            row = progress_by_challenge_id.get(challenge.id)
            item = self._challenge_response(challenge, row)
            if item.completed:
                completed.append(item)
                if not item.reward_claimed:
                    claimable.append(item)
            else:
                active.append(item)

        return PassportChallengesResponse(
            active=active,
            completed=completed,
            claimable=claimable,
        )

    async def claim_challenge_reward(
        self,
        user: User,
        challenge_code: str,
    ) -> ChallengeClaimResponse:
        user_id = user.id
        await self._require_active_passport(user_id)

        result = await self._challenge_rewards.claim_reward(user_id, challenge_code)
        wallet = await self._wallet.get_wallet(user_id)
        new_balance = wallet.balance if wallet is not None else 0

        return ChallengeClaimResponse(
            challenge_code=result.challenge_code,
            claimed=result.claimed,
            ym_awarded=result.ym_awarded,
            new_balance=new_balance,
            message=result.message,
        )

    async def _require_active_passport(self, user_id: uuid.UUID) -> Passport:
        passport = await self._passports.get_active_for_user(user_id)
        if passport is None:
            raise AppError(
                status_code=404,
                code="PASSPORT_NOT_ACTIVE",
                detail="Aucun Passport actif pour cet utilisateur.",
            )
        return passport

    async def _count_earned_badges(self, user_id: uuid.UUID) -> int:
        count = await self._session.scalar(
            select(func.count())
            .select_from(UserPassportBadge)
            .where(UserPassportBadge.user_id == user_id)
        )
        return int(count or 0)

    async def _count_active_challenges(self, user_id: uuid.UUID) -> int:
        count = await self._session.scalar(
            select(func.count())
            .select_from(UserPassportChallenge)
            .where(
                UserPassportChallenge.user_id == user_id,
                UserPassportChallenge.completed.is_(False),
            )
        )
        return int(count or 0)

    async def _count_claimable_rewards(self, user_id: uuid.UUID) -> int:
        count = await self._session.scalar(
            select(func.count())
            .select_from(UserPassportChallenge)
            .where(
                UserPassportChallenge.user_id == user_id,
                UserPassportChallenge.completed.is_(True),
                UserPassportChallenge.reward_claimed.is_(False),
            )
        )
        return int(count or 0)

    @staticmethod
    def _badge_response(
        badge: PassportBadge,
        *,
        earned_at: datetime | None = None,
    ) -> PassportBadgeResponse:
        return PassportBadgeResponse(
            code=badge.code,
            name=badge.name,
            description=badge.description,
            rarity=badge.rarity,
            family=badge.family,
            earned_at=earned_at,
        )

    @staticmethod
    def _challenge_response(
        challenge: PassportChallenge,
        user_challenge: UserPassportChallenge | None,
    ) -> PassportChallengeResponse:
        progress = user_challenge.progress if user_challenge is not None else 0
        target = (
            user_challenge.target_value
            if user_challenge is not None
            else challenge.target_value
        )
        completed = user_challenge.completed if user_challenge is not None else False
        reward_claimed = (
            user_challenge.reward_claimed if user_challenge is not None else False
        )
        return PassportChallengeResponse(
            code=challenge.code,
            name=challenge.name,
            description=challenge.description,
            progress=progress,
            target=target,
            completed=completed,
            reward_claimed=reward_claimed,
            ym_reward=challenge.ym_reward,
        )
