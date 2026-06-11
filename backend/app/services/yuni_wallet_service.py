"""YuniMonnaie wallet ledger service (PASSPORT-02A).

Automatic earn hooks from stamps/redemptions are PASSPORT-02B — not in this ticket.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.yuni_wallet_constants import (
    YUNI_TRANSACTION_REFERENCE_TYPES,
    YuniTransactionReferenceType,
    YuniTransactionType,
    YuniWalletStatus,
)
from app.core.yuni_wallet_errors import (
    YuniWalletError,
    YuniWalletInsufficientBalanceError,
    YuniWalletInvalidAmountError,
    YuniWalletInvalidReferenceTypeError,
    YuniWalletInvalidReversalError,
    YuniWalletSuspendedError,
    YuniWalletTransactionNotFoundError,
)
from app.models.yuni_wallet import YuniTransaction, YuniWallet


class YuniWalletService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_or_create_wallet(self, user_id: uuid.UUID) -> YuniWallet:
        wallet = await self._lock_wallet(user_id)
        await self._session.commit()
        await self._session.refresh(wallet)
        return wallet

    async def get_wallet(self, user_id: uuid.UUID) -> YuniWallet | None:
        result = await self._session.execute(
            select(YuniWallet).where(YuniWallet.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def earn(
        self,
        user_id: uuid.UUID,
        amount: int,
        reference_type: str,
        *,
        reference_id: uuid.UUID | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> YuniTransaction:
        normalized_reference = self._validate_reference_type(reference_type)
        self._validate_amount(amount)

        wallet = await self._lock_wallet(user_id)
        self._assert_wallet_active(wallet)

        if reference_id is not None:
            existing = await self._find_transaction(
                user_id=user_id,
                transaction_type=YuniTransactionType.EARN.value,
                reference_type=normalized_reference,
                reference_id=reference_id,
            )
            if existing is not None:
                return existing

        wallet.balance += amount
        wallet.lifetime_earned += amount
        wallet.updated_at = datetime.now(UTC)

        transaction = YuniTransaction(
            wallet_id=wallet.id,
            user_id=user_id,
            transaction_type=YuniTransactionType.EARN.value,
            amount=amount,
            balance_after=wallet.balance,
            reference_type=normalized_reference,
            reference_id=reference_id,
            metadata_=metadata,
        )
        self._session.add(transaction)
        try:
            await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            if reference_id is None:
                raise YuniWalletError("Conflit lors de l'attribution YuniMonnaie.") from exc
            existing = await self._find_transaction(
                user_id=user_id,
                transaction_type=YuniTransactionType.EARN.value,
                reference_type=normalized_reference,
                reference_id=reference_id,
            )
            if existing is None:
                raise YuniWalletError("Conflit lors de l'attribution YuniMonnaie.") from exc
            return existing

        await self._session.commit()
        await self._session.refresh(transaction)
        return transaction

    async def spend(
        self,
        user_id: uuid.UUID,
        amount: int,
        reference_type: str,
        *,
        reference_id: uuid.UUID | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> YuniTransaction:
        normalized_reference = self._validate_reference_type(reference_type)
        self._validate_amount(amount)

        wallet = await self._lock_wallet(user_id)
        self._assert_wallet_active(wallet)

        if reference_id is not None:
            existing = await self._find_transaction(
                user_id=user_id,
                transaction_type=YuniTransactionType.SPEND.value,
                reference_type=normalized_reference,
                reference_id=reference_id,
            )
            if existing is not None:
                return existing

        if wallet.balance < amount:
            raise YuniWalletInsufficientBalanceError(
                "Solde YuniMonnaie insuffisant pour cette opération."
            )

        wallet.balance -= amount
        wallet.lifetime_spent += amount
        wallet.updated_at = datetime.now(UTC)

        transaction = YuniTransaction(
            wallet_id=wallet.id,
            user_id=user_id,
            transaction_type=YuniTransactionType.SPEND.value,
            amount=amount,
            balance_after=wallet.balance,
            reference_type=normalized_reference,
            reference_id=reference_id,
            metadata=metadata,
        )
        self._session.add(transaction)
        try:
            await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            if reference_id is None:
                raise YuniWalletError("Conflit lors de la dépense YuniMonnaie.") from exc
            existing = await self._find_transaction(
                user_id=user_id,
                transaction_type=YuniTransactionType.SPEND.value,
                reference_type=normalized_reference,
                reference_id=reference_id,
            )
            if existing is None:
                raise YuniWalletError("Conflit lors de la dépense YuniMonnaie.") from exc
            return existing

        await self._session.commit()
        await self._session.refresh(transaction)
        return transaction

    async def reverse(
        self,
        user_id: uuid.UUID,
        original_transaction_id: uuid.UUID,
        reference_type: str,
        *,
        reference_id: uuid.UUID | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> YuniTransaction:
        _ = self._validate_reference_type(reference_type)
        wallet = await self._lock_wallet(user_id)
        self._assert_wallet_active(wallet)

        original = await self._session.get(YuniTransaction, original_transaction_id)
        if original is None or original.user_id != user_id:
            raise YuniWalletTransactionNotFoundError("Transaction source introuvable.")
        if original.transaction_type != YuniTransactionType.SPEND.value:
            raise YuniWalletInvalidReversalError(
                "Seules les transactions SPEND peuvent être reversées."
            )

        reversal_reference_id = reference_id or original_transaction_id
        existing = await self._find_transaction(
            user_id=user_id,
            transaction_type=YuniTransactionType.REVERSAL.value,
            reference_type=YuniTransactionReferenceType.SPEND_REVERSAL.value,
            reference_id=reversal_reference_id,
        )
        if existing is not None:
            return existing

        reversal_metadata = dict(metadata or {})
        reversal_metadata["original_transaction_id"] = str(original_transaction_id)
        reversal_metadata["original_reference_type"] = original.reference_type

        wallet.balance += original.amount
        wallet.updated_at = datetime.now(UTC)

        transaction = YuniTransaction(
            wallet_id=wallet.id,
            user_id=user_id,
            transaction_type=YuniTransactionType.REVERSAL.value,
            amount=original.amount,
            balance_after=wallet.balance,
            reference_type=YuniTransactionReferenceType.SPEND_REVERSAL.value,
            reference_id=reversal_reference_id,
            metadata_=reversal_metadata,
        )
        self._session.add(transaction)
        try:
            await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            existing_after_conflict = await self._find_transaction(
                user_id=user_id,
                transaction_type=YuniTransactionType.REVERSAL.value,
                reference_type=YuniTransactionReferenceType.SPEND_REVERSAL.value,
                reference_id=reversal_reference_id,
            )
            if existing_after_conflict is None:
                raise YuniWalletError("Conflit lors du reversal YuniMonnaie.") from exc
            return existing_after_conflict

        await self._session.commit()
        await self._session.refresh(transaction)
        return transaction

    async def suspend_wallet(self, user_id: uuid.UUID, *, reason: str | None = None) -> YuniWallet:
        _ = reason
        wallet = await self._lock_wallet(user_id)
        wallet.status = YuniWalletStatus.SUSPENDED.value
        wallet.updated_at = datetime.now(UTC)
        await self._session.commit()
        await self._session.refresh(wallet)
        return wallet

    async def reactivate_wallet(self, user_id: uuid.UUID) -> YuniWallet:
        wallet = await self._lock_wallet(user_id)
        wallet.status = YuniWalletStatus.ACTIVE.value
        wallet.updated_at = datetime.now(UTC)
        await self._session.commit()
        await self._session.refresh(wallet)
        return wallet

    async def _lock_wallet(self, user_id: uuid.UUID) -> YuniWallet:
        result = await self._session.execute(
            select(YuniWallet)
            .where(YuniWallet.user_id == user_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        wallet = result.scalar_one_or_none()
        if wallet is not None:
            return wallet

        wallet = YuniWallet(user_id=user_id, status=YuniWalletStatus.ACTIVE.value)
        self._session.add(wallet)
        try:
            await self._session.flush()
            return wallet
        except IntegrityError as exc:
            await self._session.rollback()
            retry = await self._session.execute(
                select(YuniWallet)
                .where(YuniWallet.user_id == user_id)
                .with_for_update()
                .execution_options(populate_existing=True)
            )
            locked = retry.scalar_one_or_none()
            if locked is None:
                raise YuniWalletError(
                    "Impossible de verrouiller le wallet YuniMonnaie."
                ) from exc
            return locked

    async def _find_transaction(
        self,
        *,
        user_id: uuid.UUID,
        transaction_type: str,
        reference_type: str,
        reference_id: uuid.UUID,
    ) -> YuniTransaction | None:
        result = await self._session.execute(
            select(YuniTransaction).where(
                YuniTransaction.user_id == user_id,
                YuniTransaction.transaction_type == transaction_type,
                YuniTransaction.reference_type == reference_type,
                YuniTransaction.reference_id == reference_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    def _assert_wallet_active(wallet: YuniWallet) -> None:
        if wallet.status != YuniWalletStatus.ACTIVE.value:
            raise YuniWalletSuspendedError("Wallet YuniMonnaie suspendu.")

    @staticmethod
    def _validate_amount(amount: int) -> None:
        if amount <= 0:
            raise YuniWalletInvalidAmountError(
                "Le montant YuniMonnaie doit être strictement positif."
            )

    @staticmethod
    def _validate_reference_type(reference_type: str) -> str:
        normalized = reference_type.strip()
        if normalized not in YUNI_TRANSACTION_REFERENCE_TYPES:
            raise YuniWalletInvalidReferenceTypeError(
                "Type de référence YuniMonnaie invalide."
            )
        return normalized
