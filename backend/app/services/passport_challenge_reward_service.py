"""Passport V2 challenge reward claim service (PASSPORT-04C).

Credits YuniMonnaie for completed challenges. No API exposure in this ticket.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.passport_challenge_reward_errors import (
    ChallengeNotCompletedError,
    ChallengeNotFoundError,
    ChallengeRewardWalletError,
    UserChallengeNotFoundError,
)
from app.core.yuni_wallet_constants import (
    YuniTransactionReferenceType,
    YuniTransactionType,
)
from app.core.yuni_wallet_errors import YuniWalletSuspendedError
from app.models.passport_challenge import UserPassportChallenge
from app.models.yuni_wallet import YuniTransaction
from app.services.passport_challenge_catalog_service import PassportChallengeCatalogService
from app.services.yuni_wallet_service import YuniWalletService


@dataclass(frozen=True)
class ChallengeRewardClaimResult:
    challenge_code: str
    claimed: bool
    already_claimed: bool
    ym_awarded: int
    transaction_id: uuid.UUID | None
    message: str


class PassportChallengeRewardService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._catalog = PassportChallengeCatalogService(session)
        self._wallet = YuniWalletService(session)

    async def claim_reward(
        self,
        user_id: uuid.UUID,
        challenge_code: str,
    ) -> ChallengeRewardClaimResult:
        challenge = await self._catalog.get_challenge_by_code(challenge_code)
        if challenge is None:
            raise ChallengeNotFoundError(f"Défi introuvable : {challenge_code}.")

        user_challenge = await self._lock_user_challenge(user_id, challenge.id)
        if user_challenge is None:
            raise UserChallengeNotFoundError(
                f"Aucune progression pour le défi {challenge_code}."
            )

        if not user_challenge.completed:
            raise ChallengeNotCompletedError(
                f"Le défi {challenge_code} n'est pas encore terminé."
            )

        if user_challenge.reward_claimed:
            existing_tx = await self._get_reward_transaction(user_id, user_challenge.id)
            transaction_id = existing_tx.id if existing_tx is not None else None
            await self._session.rollback()
            return ChallengeRewardClaimResult(
                challenge_code=challenge_code,
                claimed=False,
                already_claimed=True,
                ym_awarded=0,
                transaction_id=transaction_id,
                message="Récompense déjà réclamée.",
            )

        transaction: YuniTransaction | None = None
        ym_awarded = 0

        if challenge.ym_reward > 0:
            try:
                transaction = await self._wallet.earn(
                    user_id,
                    challenge.ym_reward,
                    YuniTransactionReferenceType.CHALLENGE.value,
                    reference_id=user_challenge.id,
                    metadata={
                        "challenge_id": str(challenge.id),
                        "challenge_code": challenge.code,
                        "user_challenge_id": str(user_challenge.id),
                        "reason": "challenge_reward_claimed",
                    },
                )
                ym_awarded = challenge.ym_reward
            except YuniWalletSuspendedError as exc:
                await self._session.rollback()
                raise ChallengeRewardWalletError(
                    "Portefeuille YuniMonnaie suspendu — récompense non réclamée."
                ) from exc

        user_challenge.reward_claimed = True
        await self._session.commit()
        await self._session.refresh(user_challenge)

        return ChallengeRewardClaimResult(
            challenge_code=challenge_code,
            claimed=True,
            already_claimed=False,
            ym_awarded=ym_awarded,
            transaction_id=transaction.id if transaction is not None else None,
            message="Récompense réclamée avec succès.",
        )

    async def has_claimed_reward(self, user_id: uuid.UUID, challenge_code: str) -> bool:
        challenge = await self._catalog.get_challenge_by_code(challenge_code)
        if challenge is None:
            return False

        user_challenge = await self._get_user_challenge(user_id, challenge.id)
        return user_challenge is not None and user_challenge.reward_claimed

    async def get_claimable_challenges(
        self,
        user_id: uuid.UUID,
    ) -> list[UserPassportChallenge]:
        stmt = (
            select(UserPassportChallenge)
            .options(selectinload(UserPassportChallenge.challenge))
            .where(
                UserPassportChallenge.user_id == user_id,
                UserPassportChallenge.completed.is_(True),
                UserPassportChallenge.reward_claimed.is_(False),
            )
            .order_by(UserPassportChallenge.completed_at.asc())
        )
        return list((await self._session.execute(stmt)).scalars().all())

    async def _lock_user_challenge(
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
            .with_for_update()
        )
        return row

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

    async def _get_reward_transaction(
        self,
        user_id: uuid.UUID,
        user_challenge_id: uuid.UUID,
    ) -> YuniTransaction | None:
        row = await self._session.scalar(
            select(YuniTransaction)
            .where(
                YuniTransaction.user_id == user_id,
                YuniTransaction.transaction_type == YuniTransactionType.EARN.value,
                YuniTransaction.reference_type == YuniTransactionReferenceType.CHALLENGE.value,
                YuniTransaction.reference_id == user_challenge_id,
            )
            .limit(1)
        )
        return row
