"""Historical passport challenge progress backfill (PASSPORT-04B)."""

from __future__ import annotations

from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.passport_challenge_constants import (
    MVP_AUTO_REDEMPTION_CHALLENGE_CODES,
    MVP_AUTO_STAMP_CHALLENGE_CODES,
    PassportChallengeProgressSourceType,
    PassportChallengeType,
)
from app.core.passport_constants import OfferRedemptionStatus
from app.models.passport import PassportOfferRedemption, PassportStamp
from app.models.passport_challenge import PassportChallenge
from app.services.passport_challenge_progress_service import PassportChallengeProgressService


@dataclass
class BackfillReport:
    scanned: int = 0
    eligible: int = 0
    progressed: int = 0
    completed: int = 0
    skipped_existing: int = 0
    skipped_invalid: int = 0
    errors: int = 0
    error_details: list[str] = field(default_factory=list)

    def merge(self, other: BackfillReport) -> None:
        self.scanned += other.scanned
        self.eligible += other.eligible
        self.progressed += other.progressed
        self.completed += other.completed
        self.skipped_existing += other.skipped_existing
        self.skipped_invalid += other.skipped_invalid
        self.errors += other.errors
        self.error_details.extend(other.error_details)


class PassportChallengeBackfillService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._progress = PassportChallengeProgressService(session)

    async def preview_stamps(self, *, limit: int | None = None) -> BackfillReport:
        return await self._process_stamps(limit=limit, execute=False)

    async def execute_stamps(self, *, limit: int | None = None) -> BackfillReport:
        return await self._process_stamps(limit=limit, execute=True)

    async def preview_redemptions(self, *, limit: int | None = None) -> BackfillReport:
        return await self._process_redemptions(limit=limit, execute=False)

    async def execute_redemptions(self, *, limit: int | None = None) -> BackfillReport:
        return await self._process_redemptions(limit=limit, execute=True)

    async def _stamp_challenge_map(self) -> dict[str, PassportChallenge]:
        challenges = list(
            (
                await self._session.execute(
                    select(PassportChallenge).where(
                        PassportChallenge.is_active.is_(True),
                        PassportChallenge.challenge_type == PassportChallengeType.STAMPS.value,
                        PassportChallenge.code.in_(MVP_AUTO_STAMP_CHALLENGE_CODES),
                    )
                )
            )
            .scalars()
            .all()
        )
        return {challenge.code: challenge for challenge in challenges}

    async def _redemption_challenge_map(self) -> dict[str, PassportChallenge]:
        challenges = list(
            (
                await self._session.execute(
                    select(PassportChallenge).where(
                        PassportChallenge.is_active.is_(True),
                        PassportChallenge.challenge_type
                        == PassportChallengeType.REDEMPTIONS.value,
                        PassportChallenge.code.in_(MVP_AUTO_REDEMPTION_CHALLENGE_CODES),
                    )
                )
            )
            .scalars()
            .all()
        )
        return {challenge.code: challenge for challenge in challenges}

    async def _process_stamps(self, *, limit: int | None, execute: bool) -> BackfillReport:
        report = BackfillReport()
        challenge_map = await self._stamp_challenge_map()
        if not challenge_map:
            return report

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

            for challenge in challenge_map.values():
                already = await self._progress.has_progress_event(
                    user_id,
                    challenge.id,
                    PassportChallengeProgressSourceType.PASSPORT_STAMP.value,
                    stamp.id,
                )
                if already:
                    report.skipped_existing += 1
                    continue

                if not execute:
                    report.progressed += 1
                    continue

                try:
                    before = await self._progress.get_user_challenge_row(user_id, challenge.id)
                    was_completed = before.completed if before is not None else False
                    updated_list = await self._progress.increment_stamp_progress(
                        user_id,
                        stamp,
                    )
                    report.progressed += 1
                    for updated in updated_list:
                        if updated.completed and not was_completed:
                            report.completed += 1
                            was_completed = True
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
        challenge_map = await self._redemption_challenge_map()
        if not challenge_map:
            return report

        stmt = (
            select(PassportOfferRedemption)
            .options(selectinload(PassportOfferRedemption.passport))
            .where(PassportOfferRedemption.status == OfferRedemptionStatus.COMPLETED)
            .order_by(PassportOfferRedemption.redeemed_at.asc())
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

            for challenge in challenge_map.values():
                already = await self._progress.has_progress_event(
                    user_id,
                    challenge.id,
                    PassportChallengeProgressSourceType.PARTNER_OFFER_REDEMPTION.value,
                    redemption.id,
                )
                if already:
                    report.skipped_existing += 1
                    continue

                if not execute:
                    report.progressed += 1
                    continue

                try:
                    before = await self._progress.get_user_challenge_row(user_id, challenge.id)
                    was_completed = before.completed if before is not None else False
                    updated_list = await self._progress.increment_redemption_progress(
                        user_id,
                        redemption,
                    )
                    if not updated_list:
                        continue
                    report.progressed += 1
                    for updated in updated_list:
                        if updated.completed and not was_completed:
                            report.completed += 1
                            was_completed = True
                except Exception as exc:  # noqa: BLE001 — backfill must continue
                    report.errors += 1
                    report.error_details.append(f"redemption {redemption.id}: {exc}")

        return report
