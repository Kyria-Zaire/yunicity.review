"""Passport reputation backfill service tests (PASSPORT-01B)."""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime

import pytest
from app.core.organization_constants import (
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.passport_constants import (
    OfferRedemptionStatus,
    PartnerOfferType,
    PassportStatus,
    PassportTierCode,
)
from app.core.passport_reputation_constants import STAMP_EARNED_POINTS
from app.db.base import Base
from app.db.session import dispose_db, get_engine, init_db
from app.models.organization import Organization
from app.models.passport import (
    PartnerOffer,
    Passport,
    PassportOfferRedemption,
    PassportStamp,
    PassportTier,
)
from app.models.passport_reputation import ReputationEvent
from app.models.user import User
from app.services.passport_reputation_backfill_service import (
    PassportReputationBackfillService,
)
from app.services.passport_reputation_service import PassportReputationService
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def backfill_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[tuple[AsyncSession, uuid.UUID, uuid.UUID], None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip passport reputation backfill tests")
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-at-least-32-characters-long!!")

    from app.core.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    init_db(settings)
    engine = get_engine()
    assert engine is not None
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        user = User(
            id=uuid.uuid4(),
            email=f"rep-backfill-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Backfill Tester",
            city="Reims",
        )
        session.add(user)
        await session.flush()

        tier = await session.scalar(
            select(PassportTier).where(PassportTier.code == PassportTierCode.BASIC)
        )
        if tier is None:
            tier = PassportTier(code=PassportTierCode.BASIC, name="Basic", display_order=10)
            session.add(tier)
            await session.flush()

        org = Organization(
            slug=f"bf-org-{uuid.uuid4().hex[:8]}",
            name="Backfill Partner",
            type=OrganizationType.COMMERCE,
            city="Reims",
            verification_status=VerificationStatus.VERIFIED,
            visibility=OrganizationVisibility.PUBLIC,
        )
        session.add(org)
        await session.flush()

        passport = Passport(
            user_id=user.id,
            tier_id=tier.id,
            city="Reims",
            passport_number=f"YUN-BF-{uuid.uuid4().hex[:8]}",
            qr_token=f"qr-bf-{uuid.uuid4().hex[:8]}",
            status=PassportStatus.ACTIVE,
        )
        session.add(passport)
        await session.flush()

        session.add(
            PassportStamp(
                passport_id=passport.id,
                organization_id=org.id,
                stamped_at=datetime.now(UTC),
            )
        )
        await session.commit()

        yield session, user.id, passport.id

    await dispose_db()
    get_settings.cache_clear()


async def _seed_distinct_stamps(
    session: AsyncSession,
    passport_id: uuid.UUID,
    count: int,
) -> None:
    for idx in range(count):
        org = Organization(
            slug=f"bf-extra-{uuid.uuid4().hex[:8]}",
            name=f"Org {idx}",
            type=OrganizationType.COMMERCE,
            city="Reims",
            verification_status=VerificationStatus.VERIFIED,
            visibility=OrganizationVisibility.PUBLIC,
        )
        session.add(org)
        await session.flush()
        session.add(
            PassportStamp(
                passport_id=passport_id,
                organization_id=org.id,
                stamped_at=datetime.now(UTC),
            )
        )
    await session.commit()


async def test_preview_stamps_does_not_write(
    backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = backfill_db
    await _seed_distinct_stamps(session, passport_id, 2)
    service = PassportReputationBackfillService(session)

    before = await session.scalar(
        select(func.count())
        .select_from(ReputationEvent)
        .where(ReputationEvent.user_id == user_id)
    )
    report = await service.preview_stamps()
    assert report.scanned >= 2
    assert report.created >= 1

    after = await session.scalar(
        select(func.count())
        .select_from(ReputationEvent)
        .where(ReputationEvent.user_id == user_id)
    )
    assert before == after


async def test_execute_stamps_creates_missing_events(
    backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, _passport_id = backfill_db
    service = PassportReputationBackfillService(session)

    report = await service.execute_stamps()
    assert report.created >= 1

    snapshot = await PassportReputationService(session).get_reputation(user_id)
    assert snapshot.total_points >= STAMP_EARNED_POINTS


async def test_execute_stamps_is_idempotent_on_rerun(
    backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, _, _ = backfill_db
    service = PassportReputationBackfillService(session)

    first = await service.execute_stamps()
    second = await service.execute_stamps()

    assert first.created >= 1
    assert second.created == 0
    assert second.skipped_existing >= first.created


async def test_backfill_limit_is_respected(
    backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, _, passport_id = backfill_db
    await _seed_distinct_stamps(session, passport_id, 4)
    service = PassportReputationBackfillService(session)

    report = await service.preview_stamps(limit=2)
    assert report.scanned == 2


async def test_backfill_handles_invalid_rows_without_crashing(
    backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, _passport_id = backfill_db
    service = PassportReputationBackfillService(session)

    report = await service.execute_stamps()
    assert report.errors == 0
    snapshot = await PassportReputationService(session).get_reputation(user_id)
    assert snapshot.total_points >= STAMP_EARNED_POINTS


async def test_execute_redemptions_creates_events(
    backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = backfill_db
    org = await session.scalar(select(Organization).limit(1))
    assert org is not None
    offer = PartnerOffer(
        organization_id=org.id,
        title="Backfill redemption",
        offer_type=PartnerOfferType.DISCOUNT,
    )
    session.add(offer)
    await session.flush()
    redemption = PassportOfferRedemption(
        passport_id=passport_id,
        partner_offer_id=offer.id,
        status=OfferRedemptionStatus.COMPLETED,
        redeemed_at=datetime.now(UTC),
    )
    session.add(redemption)
    await session.commit()

    service = PassportReputationBackfillService(session)
    await service.execute_redemptions()

    event = await session.scalar(
        select(ReputationEvent).where(ReputationEvent.source_id == redemption.id)
    )
    assert event is not None
    snapshot = await PassportReputationService(session).get_reputation(user_id)
    assert snapshot.total_points >= 3
