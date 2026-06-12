"""Passport V2 challenge progress engine (PASSPORT-04B).

Reward claim and YM payout: future tickets — not in PASSPORT-04B.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import AppError
from app.core.passport_challenge_constants import (
    MVP_AUTO_REDEMPTION_CHALLENGE_CODES,
    MVP_AUTO_STAMP_CHALLENGE_CODES,
    PassportChallengeProgressSourceType,
    PassportChallengeType,
)
from app.core.passport_constants import OfferRedemptionStatus
from app.models.passport import PassportOfferRedemption, PassportStamp
from app.models.passport_challenge import (
    PassportChallenge,
    PassportChallengeProgressEvent,
    UserPassportChallenge,
)
from app.services.passport_challenge_catalog_service import PassportChallengeCatalogService


class PassportChallengeProgressService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._catalog = PassportChallengeCatalogService(session)

    async def ensure_user_challenge(
        self,
        user_id: uuid.UUID,
        challenge_code: str,
    ) -> UserPassportChallenge:
        challenge = await self._catalog.get_challenge_by_code(challenge_code)
        if challenge is None or not challenge.is_active:
            raise AppError(
                status_code=404,
                code="PASSPORT_CHALLENGE_NOT_ACTIVE",
                detail="Défi introuvable ou inactif.",
            )

        existing = await self._get_user_challenge(user_id, challenge.id)
        if existing is not None:
            return existing

        user_challenge = UserPassportChallenge(
            user_id=user_id,
            challenge_id=challenge.id,
            progress=0,
            target_value=challenge.target_value,
            completed=False,
            reward_claimed=False,
        )
        self._session.add(user_challenge)
        try:
            await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            existing = await self._get_user_challenge(user_id, challenge.id)
            if existing is None:
                raise AppError(
                    status_code=409,
                    code="PASSPORT_CHALLENGE_PROGRESS_CONFLICT",
                    detail="Conflit lors de la création de progression.",
                ) from exc
            return existing

        await self._session.commit()
        await self._session.refresh(user_challenge)
        return user_challenge

    async def increment_progress(
        self,
        user_id: uuid.UUID,
        challenge_code: str,
        amount: int = 1,
        *,
        source_type: str | None = None,
        source_id: uuid.UUID | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> UserPassportChallenge | None:
        if amount <= 0:
            raise AppError(
                status_code=400,
                code="PASSPORT_CHALLENGE_INVALID_AMOUNT",
                detail="Le montant de progression doit être positif.",
            )

        challenge = await self._catalog.get_challenge_by_code(challenge_code)
        if challenge is None or not challenge.is_active:
            if challenge is None:
                return None
            return await self._get_user_challenge(user_id, challenge.id)

        user_challenge = await self._ensure_user_challenge_row(user_id, challenge)
        if user_challenge.completed:
            return user_challenge

        if source_type is not None and source_id is not None:
            if await self._has_progress_event(
                user_id=user_id,
                challenge_id=challenge.id,
                source_type=source_type,
                source_id=source_id,
            ):
                return user_challenge

            event = PassportChallengeProgressEvent(
                user_challenge_id=user_challenge.id,
                user_id=user_id,
                challenge_id=challenge.id,
                source_type=source_type,
                source_id=source_id,
                amount=amount,
                metadata_=metadata,
            )
            self._session.add(event)
            try:
                await self._session.flush()
            except IntegrityError:
                await self._session.rollback()
                refreshed = await self._get_user_challenge(user_id, challenge.id)
                return refreshed

        new_progress = min(user_challenge.progress + amount, user_challenge.target_value)
        user_challenge.progress = new_progress
        if new_progress >= user_challenge.target_value and not user_challenge.completed:
            user_challenge.completed = True
            user_challenge.completed_at = datetime.now(UTC)

        await self._session.commit()
        await self._session.refresh(user_challenge)
        return user_challenge

    async def increment_stamp_progress(
        self,
        user_id: uuid.UUID,
        stamp: PassportStamp,
    ) -> list[UserPassportChallenge]:
        active = await self._catalog.list_active_challenges()
        stamp_challenges = [
            challenge
            for challenge in active
            if challenge.challenge_type == PassportChallengeType.STAMPS.value
            and challenge.code in MVP_AUTO_STAMP_CHALLENGE_CODES
        ]
        results: list[UserPassportChallenge] = []
        for challenge in stamp_challenges:
            updated = await self.increment_progress(
                user_id,
                challenge.code,
                amount=1,
                source_type=PassportChallengeProgressSourceType.PASSPORT_STAMP.value,
                source_id=stamp.id,
                metadata={
                    "organization_id": str(stamp.organization_id),
                    "stamp_id": str(stamp.id),
                    "reason": "passport_stamp_created",
                },
            )
            if updated is not None:
                results.append(updated)
        return results

    async def increment_redemption_progress(
        self,
        user_id: uuid.UUID,
        redemption: PassportOfferRedemption,
    ) -> list[UserPassportChallenge]:
        status = (
            redemption.status.value
            if isinstance(redemption.status, OfferRedemptionStatus)
            else str(redemption.status)
        )
        if status != OfferRedemptionStatus.COMPLETED.value:
            return []

        active = await self._catalog.list_active_challenges()
        redemption_challenges = [
            challenge
            for challenge in active
            if challenge.challenge_type == PassportChallengeType.REDEMPTIONS.value
            and challenge.code in MVP_AUTO_REDEMPTION_CHALLENGE_CODES
        ]
        results: list[UserPassportChallenge] = []
        for challenge in redemption_challenges:
            updated = await self.increment_progress(
                user_id,
                challenge.code,
                amount=1,
                source_type=PassportChallengeProgressSourceType.PARTNER_OFFER_REDEMPTION.value,
                source_id=redemption.id,
                metadata={
                    "redemption_id": str(redemption.id),
                    "offer_id": str(redemption.partner_offer_id),
                    "reason": "partner_redemption_completed",
                },
            )
            if updated is not None:
                results.append(updated)
        return results

    async def get_user_progress(self, user_id: uuid.UUID) -> list[UserPassportChallenge]:
        stmt = (
            select(UserPassportChallenge)
            .options(selectinload(UserPassportChallenge.challenge))
            .where(UserPassportChallenge.user_id == user_id)
            .order_by(UserPassportChallenge.created_at.asc())
        )
        return list((await self._session.execute(stmt)).scalars().all())

    async def get_user_challenge_row(
        self,
        user_id: uuid.UUID,
        challenge_id: uuid.UUID,
    ) -> UserPassportChallenge | None:
        return await self._get_user_challenge(user_id, challenge_id)

    async def has_progress_event(
        self,
        user_id: uuid.UUID,
        challenge_id: uuid.UUID,
        source_type: str,
        source_id: uuid.UUID,
    ) -> bool:
        return await self._has_progress_event(
            user_id=user_id,
            challenge_id=challenge_id,
            source_type=source_type,
            source_id=source_id,
        )

    async def _ensure_user_challenge_row(
        self,
        user_id: uuid.UUID,
        challenge: PassportChallenge,
    ) -> UserPassportChallenge:
        existing = await self._get_user_challenge(user_id, challenge.id)
        if existing is not None:
            return existing

        user_challenge = UserPassportChallenge(
            user_id=user_id,
            challenge_id=challenge.id,
            progress=0,
            target_value=challenge.target_value,
            completed=False,
            reward_claimed=False,
        )
        self._session.add(user_challenge)
        try:
            await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            existing = await self._get_user_challenge(user_id, challenge.id)
            if existing is None:
                raise AppError(
                    status_code=409,
                    code="PASSPORT_CHALLENGE_PROGRESS_CONFLICT",
                    detail="Conflit lors de la création de progression.",
                ) from exc
            return existing
        return user_challenge

    async def _get_user_challenge(
        self,
        user_id: uuid.UUID,
        challenge_id: uuid.UUID,
    ) -> UserPassportChallenge | None:
        row = await self._session.scalar(
            select(UserPassportChallenge)
            .where(
                UserPassportChallenge.user_id == user_id,
                UserPassportChallenge.challenge_id == challenge_id,
            )
            .limit(1)
        )
        return row

    async def _has_progress_event(
        self,
        *,
        user_id: uuid.UUID,
        challenge_id: uuid.UUID,
        source_type: str,
        source_id: uuid.UUID,
    ) -> bool:
        existing = await self._session.scalar(
            select(PassportChallengeProgressEvent.id)
            .where(
                PassportChallengeProgressEvent.user_id == user_id,
                PassportChallengeProgressEvent.challenge_id == challenge_id,
                PassportChallengeProgressEvent.source_type == source_type,
                PassportChallengeProgressEvent.source_id == source_id,
            )
            .limit(1)
        )
        return existing is not None
