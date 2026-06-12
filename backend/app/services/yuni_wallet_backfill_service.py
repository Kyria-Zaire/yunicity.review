"""Historical YuniMonnaie backfill (PASSPORT-02B)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.passport_constants import OfferRedemptionStatus
from app.core.yuni_wallet_constants import (
    PARTNER_REDEMPTION_YM,
    STAMP_EARNED_YM,
    YuniTransactionReferenceType,
    YuniWalletStatus,
)
from app.core.yuni_wallet_errors import YuniWalletSuspendedError
from app.models.passport import PassportOfferRedemption, PassportStamp
from app.models.yuni_wallet import YuniTransaction, YuniWallet
from app.services.yuni_wallet_service import YuniWalletService


@dataclass
class YuniBackfillReport:
    scanned: int = 0
    eligible: int = 0
    created: int = 0
    skipped_existing: int = 0
    skipped_invalid: int = 0
    skipped_suspended: int = 0
    errors: int = 0
    error_details: list[str] = field(default_factory=list)

    def merge(self, other: YuniBackfillReport) -> None:
        self.scanned += other.scanned
        self.eligible += other.eligible
        self.created += other.created
        self.skipped_existing += other.skipped_existing
        self.skipped_invalid += other.skipped_invalid
        self.skipped_suspended += other.skipped_suspended
        self.errors += other.errors
        self.error_details.extend(other.error_details)


class YuniWalletBackfillService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._wallet = YuniWalletService(session)

    async def preview_stamps(self, *, limit: int | None = None) -> YuniBackfillReport:
        return await self._process_stamps(limit=limit, execute=False)

    async def execute_stamps(self, *, limit: int | None = None) -> YuniBackfillReport:
        return await self._process_stamps(limit=limit, execute=True)

    async def preview_redemptions(self, *, limit: int | None = None) -> YuniBackfillReport:
        return await self._process_redemptions(limit=limit, execute=False)

    async def execute_redemptions(self, *, limit: int | None = None) -> YuniBackfillReport:
        return await self._process_redemptions(limit=limit, execute=True)

    async def _process_stamps(self, *, limit: int | None, execute: bool) -> YuniBackfillReport:
        report = YuniBackfillReport()
        stmt = (
            select(PassportStamp)
            .options(selectinload(PassportStamp.passport))
            .order_by(PassportStamp.stamped_at.asc())
        )
        if limit is not None:
            stmt = stmt.limit(limit)
        stamps = list((await self._session.execute(stmt)).scalars().all())
        report.scanned = len(stamps)

        for stamp in stamps:
            passport = stamp.passport
            if passport is None:
                report.skipped_invalid += 1
                continue
            user_id = passport.user_id
            report.eligible += 1

            if await self._is_suspended(user_id):
                report.skipped_suspended += 1
                continue

            already = await self._wallet.has_existing_earn(
                user_id,
                YuniTransactionReferenceType.PASSPORT_STAMP.value,
                stamp.id,
            )
            if already:
                report.skipped_existing += 1
                continue

            if not execute:
                report.created += 1
                continue

            try:
                await self._wallet.earn(
                    user_id,
                    STAMP_EARNED_YM,
                    YuniTransactionReferenceType.PASSPORT_STAMP.value,
                    reference_id=stamp.id,
                    metadata={
                        "stamp_id": str(stamp.id),
                        "organization_id": str(stamp.organization_id),
                        "reason": "passport_stamp_backfill",
                    },
                )
                report.created += 1
            except YuniWalletSuspendedError:
                report.skipped_suspended += 1
            except Exception as exc:  # noqa: BLE001 — backfill must continue
                report.errors += 1
                report.error_details.append(f"stamp {stamp.id}: {exc}")

        return report

    async def _process_redemptions(
        self,
        *,
        limit: int | None,
        execute: bool,
    ) -> YuniBackfillReport:
        report = YuniBackfillReport()
        stmt = (
            select(PassportOfferRedemption)
            .options(
                selectinload(PassportOfferRedemption.passport),
                selectinload(PassportOfferRedemption.offer),
            )
            .where(PassportOfferRedemption.status == OfferRedemptionStatus.COMPLETED.value)
            .order_by(PassportOfferRedemption.redeemed_at.asc().nulls_last())
        )
        if limit is not None:
            stmt = stmt.limit(limit)
        redemptions = list((await self._session.execute(stmt)).scalars().all())
        report.scanned = len(redemptions)

        for redemption in redemptions:
            passport = redemption.passport
            if passport is None:
                report.skipped_invalid += 1
                continue
            user_id = passport.user_id
            report.eligible += 1

            if await self._is_suspended(user_id):
                report.skipped_suspended += 1
                continue

            already = await self._wallet.has_existing_earn(
                user_id,
                YuniTransactionReferenceType.PARTNER_OFFER_REDEMPTION.value,
                redemption.id,
            )
            if already:
                report.skipped_existing += 1
                continue

            if not execute:
                report.created += 1
                continue

            try:
                offer = redemption.offer
                metadata: dict[str, str] = {
                    "redemption_id": str(redemption.id),
                    "offer_id": str(redemption.partner_offer_id),
                    "organization_id": str(offer.organization_id) if offer else "",
                    "reason": "partner_redemption_backfill",
                }
                await self._wallet.earn(
                    user_id,
                    PARTNER_REDEMPTION_YM,
                    YuniTransactionReferenceType.PARTNER_OFFER_REDEMPTION.value,
                    reference_id=redemption.id,
                    metadata=metadata,
                )
                report.created += 1
            except YuniWalletSuspendedError:
                report.skipped_suspended += 1
            except Exception as exc:  # noqa: BLE001 — backfill must continue
                report.errors += 1
                report.error_details.append(f"redemption {redemption.id}: {exc}")

        return report

    async def _is_suspended(self, user_id: uuid.UUID) -> bool:
        wallet = await self._wallet.get_wallet(user_id)
        return wallet is not None and wallet.status == YuniWalletStatus.SUSPENDED.value

    async def count_wallets(self) -> int:
        return int(await self._session.scalar(select(func.count()).select_from(YuniWallet)) or 0)

    async def count_transactions(self) -> int:
        return int(
            await self._session.scalar(select(func.count()).select_from(YuniTransaction)) or 0
        )
