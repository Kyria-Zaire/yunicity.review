"""Passport challenge progress backfill service tests (PASSPORT-04B)."""

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
from app.core.passport_challenge_constants import PassportChallengeCode
from app.core.passport_constants import (
    OfferRedemptionStatus,
    PartnerOfferType,
    PassportStatus,
    PassportTierCode,
)
from app.db.base import Base
from app.db.seeds.passport_challenges import seed_passport_challenges
from app.db.session import dispose_db, get_engine, init_db
from app.models.organization import Organization
from app.models.passport import (
    PartnerOffer,
    Passport,
    PassportOfferRedemption,
    PassportStamp,
    PassportTier,
)
from app.models.passport_challenge import PassportChallenge, UserPassportChallenge
from app.models.user import User
from app.services.passport_challenge_backfill_service import PassportChallengeBackfillService
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def challenge_backfill_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[tuple[AsyncSession, uuid.UUID, uuid.UUID], None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip passport challenge backfill tests")
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
            email=f"challenge-backfill-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Challenge Backfill Tester",
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

        passport = Passport(
            user_id=user.id,
            tier_id=tier.id,
            city="Reims",
            passport_number=f"YUN-CB-{uuid.uuid4().hex[:8]}",
            qr_token=f"qr-cb-{uuid.uuid4().hex[:8]}",
            status=PassportStatus.ACTIVE,
        )
        session.add(passport)
        await session.commit()

        await seed_passport_challenges(session)
        await session.commit()

        yield session, user.id, passport.id

    await dispose_db()
    get_settings.cache_clear()


async def _create_org(session: AsyncSession, suffix: str) -> Organization:
    org = Organization(
        slug=f"cb-org-{suffix}-{uuid.uuid4().hex[:6]}",
        name=f"Org {suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PUBLIC,
    )
    session.add(org)
    await session.flush()
    return org


async def _seed_stamps(session: AsyncSession, passport_id: uuid.UUID, count: int) -> None:
    passport = await session.get(Passport, passport_id)
    assert passport is not None
    for idx in range(count):
        org = await _create_org(session, f"s{idx}")
        session.add(
            PassportStamp(
                passport_id=passport_id,
                organization_id=org.id,
                stamped_at=datetime.now(UTC),
            )
        )
        passport.stamps_count += 1
    await session.commit()


async def _seed_redemptions(session: AsyncSession, passport_id: uuid.UUID, count: int) -> None:
    for idx in range(count):
        org = await _create_org(session, f"r{idx}")
        offer = PartnerOffer(
            organization_id=org.id,
            title=f"Offer {idx}",
            offer_type=PartnerOfferType.DISCOUNT,
        )
        session.add(offer)
        await session.flush()
        session.add(
            PassportOfferRedemption(
                passport_id=passport_id,
                partner_offer_id=offer.id,
                status=OfferRedemptionStatus.COMPLETED,
                redeemed_at=datetime.now(UTC),
            )
        )
    await session.commit()


async def _progress_count(session: AsyncSession, user_id: uuid.UUID) -> int:
    return int(
        await session.scalar(
            select(func.count())
            .select_from(UserPassportChallenge)
            .where(UserPassportChallenge.user_id == user_id)
        )
        or 0
    )


async def _explorer_progress(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> UserPassportChallenge | None:
    challenge = await session.scalar(
        select(PassportChallenge).where(
            PassportChallenge.code == PassportChallengeCode.EXPLORER_CENTRE_VILLE.value
        )
    )
    assert challenge is not None
    row = await session.scalar(
        select(UserPassportChallenge).where(
            UserPassportChallenge.user_id == user_id,
            UserPassportChallenge.challenge_id == challenge.id,
        )
    )
    return row


async def test_preview_stamps_does_not_write(
    challenge_backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_backfill_db
    await _seed_stamps(session, passport_id, 2)

    before = await _progress_count(session, user_id)
    report = await PassportChallengeBackfillService(session).preview_stamps()
    after = await _progress_count(session, user_id)

    assert report.scanned >= 2
    assert report.progressed >= 2
    assert before == after == 0


async def test_execute_stamps_creates_progress(
    challenge_backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_backfill_db
    await _seed_stamps(session, passport_id, 2)

    report = await PassportChallengeBackfillService(session).execute_stamps()

    assert report.progressed >= 2
    row = await _explorer_progress(session, user_id)
    assert row is not None
    assert row.progress == 2


async def test_execute_stamps_is_idempotent_on_rerun(
    challenge_backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_backfill_db
    await _seed_stamps(session, passport_id, 3)
    service = PassportChallengeBackfillService(session)

    first = await service.execute_stamps()
    row = await _explorer_progress(session, user_id)
    assert row is not None
    assert row.progress == 3
    progress_after_first = row.progress

    second = await service.execute_stamps()

    assert first.progressed >= 3
    assert second.skipped_existing >= 3
    await session.refresh(row)
    assert row.progress == progress_after_first == 3


async def test_execute_redemptions_creates_progress(
    challenge_backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_backfill_db
    await _seed_redemptions(session, passport_id, 2)

    report = await PassportChallengeBackfillService(session).execute_redemptions()

    assert report.progressed >= 2
    challenge = await session.scalar(
        select(PassportChallenge).where(
            PassportChallenge.code == PassportChallengeCode.SOUTIEN_LOCAL_HEBDO.value
        )
    )
    assert challenge is not None
    row = await session.scalar(
        select(UserPassportChallenge).where(
            UserPassportChallenge.user_id == user_id,
            UserPassportChallenge.challenge_id == challenge.id,
        )
    )
    assert row is not None
    assert row.progress == 2


async def test_backfill_limit_is_respected(
    challenge_backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_backfill_db
    await _seed_stamps(session, passport_id, 5)

    report = await PassportChallengeBackfillService(session).execute_stamps(limit=2)

    assert report.scanned == 2
    row = await _explorer_progress(session, user_id)
    if row is not None:
        assert row.progress <= 2
