"""Passport reputation hooks tests (PASSPORT-01B)."""

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
from app.core.passport_reputation_constants import (
    PARTNER_REDEMPTION_POINTS,
    STAMP_EARNED_POINTS,
    PassportReputationEventType,
)
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
from app.repositories.passport_repository import PassportRepository
from app.services.passport_reputation_hooks import (
    award_reputation_for_partner_redemption,
    award_reputation_for_passport_stamp,
)
from app.services.passport_reputation_service import PassportReputationService
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def hooks_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID], None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip passport reputation hook tests")
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
            email=f"rep-hook-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Hook Tester",
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
            slug=f"hook-org-{uuid.uuid4().hex[:8]}",
            name="Hook Partner",
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
            passport_number=f"YUN-HOOK-{uuid.uuid4().hex[:8]}",
            qr_token=f"qr-hook-{uuid.uuid4().hex[:8]}",
            status=PassportStatus.ACTIVE,
        )
        session.add(passport)
        await session.commit()

        yield session, user.id, passport.id, org.id

    await dispose_db()
    get_settings.cache_clear()


async def test_stamp_creation_awards_reputation(
    hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = hooks_db
    now = datetime.now(UTC)
    repo = PassportRepository(session)

    new_stamp = await repo.add_stamp_if_missing(
        passport_id=passport_id,
        organization_id=org_id,
        stamped_at=now,
    )
    assert new_stamp is not None
    await session.commit()

    partner_profile_id = uuid.uuid4()
    await award_reputation_for_passport_stamp(
        session,
        stamp_id=new_stamp.id,
        user_id=user_id,
        partner_profile_id=partner_profile_id,
    )

    event = await session.scalar(
        select(ReputationEvent).where(
            ReputationEvent.user_id == user_id,
            ReputationEvent.event_type == PassportReputationEventType.STAMP_EARNED.value,
            ReputationEvent.source_id == new_stamp.id,
        )
    )
    assert event is not None
    assert event.points == STAMP_EARNED_POINTS
    assert event.metadata_ is not None
    assert event.metadata_["organization_id"] == str(org_id)
    assert event.metadata_["partner_profile_id"] == str(partner_profile_id)

    snapshot = await PassportReputationService(session).get_reputation(user_id)
    assert snapshot.total_points == STAMP_EARNED_POINTS


async def test_stamp_hook_is_idempotent_on_retry(
    hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = hooks_db
    repo = PassportRepository(session)
    new_stamp = await repo.add_stamp_if_missing(
        passport_id=passport_id,
        organization_id=org_id,
        stamped_at=datetime.now(UTC),
    )
    assert new_stamp is not None
    stamp_id = new_stamp.id
    await session.commit()

    await award_reputation_for_passport_stamp(
        session, stamp_id=stamp_id, user_id=user_id
    )
    await award_reputation_for_passport_stamp(
        session, stamp_id=stamp_id, user_id=user_id
    )

    count = await session.scalar(
        select(func.count())
        .select_from(ReputationEvent)
        .where(
            ReputationEvent.user_id == user_id,
            ReputationEvent.source_id == stamp_id,
        )
    )
    assert count == 1
    snapshot = await PassportReputationService(session).get_reputation(user_id)
    assert snapshot.total_points == STAMP_EARNED_POINTS


async def test_stamp_hook_metadata_is_stored(
    hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = hooks_db
    stamp = PassportStamp(
        passport_id=passport_id,
        organization_id=org_id,
        stamped_at=datetime.now(UTC),
    )
    session.add(stamp)
    passport = await session.get(Passport, passport_id)
    assert passport is not None
    passport.stamps_count += 1
    await session.commit()

    await award_reputation_for_passport_stamp(
        session, stamp_id=stamp.id, user_id=user_id
    )

    event = await session.scalar(
        select(ReputationEvent).where(ReputationEvent.source_id == stamp.id)
    )
    assert event is not None
    assert event.metadata_ is not None
    assert event.metadata_["stamp_id"] == str(stamp.id)
    assert event.metadata_["reason"] == "passport_stamp_created"


async def test_redemption_confirmed_awards_reputation(
    hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = hooks_db
    offer = PartnerOffer(
        organization_id=org_id,
        title="Hook offer",
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

    await award_reputation_for_partner_redemption(
        session,
        redemption_id=redemption.id,
        user_id=user_id,
    )

    event = await session.scalar(
        select(ReputationEvent).where(
            ReputationEvent.event_type
            == PassportReputationEventType.PARTNER_REDEMPTION.value,
            ReputationEvent.source_id == redemption.id,
        )
    )
    assert event is not None
    assert event.points == PARTNER_REDEMPTION_POINTS
    snapshot = await PassportReputationService(session).get_reputation(user_id)
    assert snapshot.total_points == PARTNER_REDEMPTION_POINTS


async def test_redemption_pending_does_not_award(
    hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = hooks_db
    offer = PartnerOffer(
        organization_id=org_id,
        title="Pending offer",
        offer_type=PartnerOfferType.GIFT,
    )
    session.add(offer)
    await session.flush()

    redemption = PassportOfferRedemption(
        passport_id=passport_id,
        partner_offer_id=offer.id,
        status=OfferRedemptionStatus.PENDING,
    )
    session.add(redemption)
    await session.commit()

    await award_reputation_for_partner_redemption(
        session,
        redemption_id=redemption.id,
        user_id=user_id,
    )

    count = await session.scalar(
        select(func.count())
        .select_from(ReputationEvent)
        .where(
            ReputationEvent.user_id == user_id,
            ReputationEvent.source_id == redemption.id,
        )
    )
    assert count == 0
