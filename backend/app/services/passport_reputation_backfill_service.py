"""Historical passport reputation backfill (PASSPORT-01B)."""

from __future__ import annotations

from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.passport_constants import OfferRedemptionStatus
from app.core.passport_reputation_constants import (
    PARTNER_REDEMPTION_POINTS,
    STAMP_EARNED_POINTS,
    PassportReputationEventType,
    PassportReputationSourceType,
)
from app.models.passport import PassportOfferRedemption, PassportStamp
from app.services.passport_reputation_service import PassportReputationService


@dataclass
class BackfillReport:
    scanned: int = 0
    eligible: int = 0
    created: int = 0
    skipped_existing: int = 0
    skipped_invalid: int = 0
    errors: int = 0
    error_details: list[str] = field(default_factory=list)

    def merge(self, other: BackfillReport) -> None:
        self.scanned += other.scanned
        self.eligible += other.eligible
        self.created += other.created
        self.skipped_existing += other.skipped_existing
        self.skipped_invalid += other.skipped_invalid
        self.errors += other.errors
        self.error_details.extend(other.error_details)


class PassportReputationBackfillService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._reputation = PassportReputationService(session)

    async def preview_stamps(self, *, limit: int | None = None) -> BackfillReport:
        return await self._process_stamps(limit=limit, execute=False)

    async def execute_stamps(self, *, limit: int | None = None) -> BackfillReport:
        return await self._process_stamps(limit=limit, execute=True)

    async def preview_redemptions(self, *, limit: int | None = None) -> BackfillReport:
        return await self._process_redemptions(limit=limit, execute=False)

    async def execute_redemptions(self, *, limit: int | None = None) -> BackfillReport:
        return await self._process_redemptions(limit=limit, execute=True)

    async def _process_stamps(self, *, limit: int | None, execute: bool) -> BackfillReport:
        report = BackfillReport()
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

            already = await self._reputation.has_existing_event(
                user_id,
                PassportReputationEventType.STAMP_EARNED.value,
                PassportReputationSourceType.PASSPORT_STAMP.value,
                stamp.id,
            )
            if already:
                report.skipped_existing += 1
                continue

            if not execute:
                report.created += 1
                continue

            try:
                await self._reputation.award_points(
                    user_id,
                    PassportReputationEventType.STAMP_EARNED.value,
                    PassportReputationSourceType.PASSPORT_STAMP.value,
                    STAMP_EARNED_POINTS,
                    source_id=stamp.id,
                    metadata={
                        "organization_id": str(stamp.organization_id),
                        "stamp_id": str(stamp.id),
                        "reason": "passport_stamp_backfill",
                    },
                )
                report.created += 1
            except Exception as exc:  # noqa: BLE001 — backfill must continue
                report.errors += 1
                report.error_details.append(f"stamp {stamp.id}: {exc}")

        return report

    async def _process_redemptions(
        self,
        *,
        limit: int | None,
        execute: bool,
    ) -> BackfillReport:
        report = BackfillReport()
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

            already = await self._reputation.has_existing_event(
                user_id,
                PassportReputationEventType.PARTNER_REDEMPTION.value,
                PassportReputationSourceType.PARTNER_OFFER_REDEMPTION.value,
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
                    "offer_id": str(redemption.partner_offer_id),
                    "organization_id": str(offer.organization_id) if offer else "",
                    "reason": "partner_redemption_backfill",
                }
                await self._reputation.award_points(
                    user_id,
                    PassportReputationEventType.PARTNER_REDEMPTION.value,
                    PassportReputationSourceType.PARTNER_OFFER_REDEMPTION.value,
                    PARTNER_REDEMPTION_POINTS,
                    source_id=redemption.id,
                    metadata=metadata,
                )
                report.created += 1
            except Exception as exc:  # noqa: BLE001 — backfill must continue
                report.errors += 1
                report.error_details.append(f"redemption {redemption.id}: {exc}")

        return report
