"""PassportBadgeEarningService tests (PASSPORT-03B)."""

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
from app.core.passport_badge_constants import (
    EXPLORATEUR_REIMS_STAMP_THRESHOLD,
    MVP_SECRET_BADGE_CODES,
    PASSPORT_PIONEER_CUTOFF,
    SOUTIEN_LOCAL_REDEMPTION_THRESHOLD,
    PassportBadgeCode,
    PassportBadgeSourceType,
)
from app.core.passport_constants import (
    OfferRedemptionStatus,
    PartnerOfferType,
    PassportStatus,
    PassportTierCode,
)
from app.core.passport_reputation_constants import PassportReputationSourceType
from app.db.base import Base
from app.db.seeds.passport_badges import seed_passport_badges
from app.db.session import dispose_db, get_engine, init_db
from app.models.organization import Organization
from app.models.passport import (
    PartnerOffer,
    Passport,
    PassportOfferRedemption,
    PassportStamp,
    PassportTier,
)
from app.models.passport_badge import PassportBadge, UserPassportBadge
from app.models.passport_reputation import ReputationEvent
from app.models.user import User
from app.models.yuni_wallet import YuniTransaction
from app.services.passport_badge_earning_service import PassportBadgeEarningService
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def badge_earning_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[tuple[AsyncSession, uuid.UUID, uuid.UUID], None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip passport badge earning tests")
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
            email=f"badge-earn-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Badge Earn Tester",
            city="Reims",
            created_at=datetime(2026, 5, 15, tzinfo=UTC),
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
            passport_number=f"YUN-BE-{uuid.uuid4().hex[:8]}",
            qr_token=f"qr-be-{uuid.uuid4().hex[:8]}",
            status=PassportStatus.ACTIVE,
        )
        session.add(passport)
        await session.commit()

        await seed_passport_badges(session)
        await session.commit()

        yield session, user.id, passport.id

    await dispose_db()
    get_settings.cache_clear()


def _service(session: AsyncSession) -> PassportBadgeEarningService:
    return PassportBadgeEarningService(session)


async def _create_org(session: AsyncSession, suffix: str) -> Organization:
    org = Organization(
        slug=f"badge-org-{suffix}-{uuid.uuid4().hex[:6]}",
        name=f"Org {suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PUBLIC,
    )
    session.add(org)
    await session.flush()
    return org


async def _add_stamps(
    session: AsyncSession,
    passport_id: uuid.UUID,
    count: int,
) -> None:
    passport = await session.get(Passport, passport_id)
    assert passport is not None
    for idx in range(count):
        org = await _create_org(session, f"stamp-{idx}")
        session.add(
            PassportStamp(
                passport_id=passport_id,
                organization_id=org.id,
                stamped_at=datetime.now(UTC),
            )
        )
        passport.stamps_count += 1
    await session.commit()


async def _add_redemptions(
    session: AsyncSession,
    passport_id: uuid.UUID,
    count: int,
) -> None:
    for idx in range(count):
        org = await _create_org(session, f"red-{idx}")
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


async def test_explorateur_awarded_at_five_stamps(
    badge_earning_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = badge_earning_db
    await _add_stamps(session, passport_id, EXPLORATEUR_REIMS_STAMP_THRESHOLD)

    earned = await _service(session).evaluate_explorateur_reims(user_id)
    assert earned is not None
    assert await _service(session).has_badge(
        user_id, PassportBadgeCode.EXPLORATEUR_REIMS.value
    )


async def test_explorateur_not_awarded_before_threshold(
    badge_earning_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = badge_earning_db
    await _add_stamps(session, passport_id, EXPLORATEUR_REIMS_STAMP_THRESHOLD - 1)

    earned = await _service(session).evaluate_explorateur_reims(user_id)
    assert earned is None
    assert not await _service(session).has_badge(
        user_id, PassportBadgeCode.EXPLORATEUR_REIMS.value
    )


async def test_soutien_local_awarded_at_three_redemptions(
    badge_earning_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = badge_earning_db
    await _add_redemptions(session, passport_id, SOUTIEN_LOCAL_REDEMPTION_THRESHOLD)

    earned = await _service(session).evaluate_soutien_local(user_id)
    assert earned is not None
    assert await _service(session).has_badge(user_id, PassportBadgeCode.SOUTIEN_LOCAL.value)


async def test_soutien_local_not_awarded_before_threshold(
    badge_earning_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = badge_earning_db
    await _add_redemptions(session, passport_id, SOUTIEN_LOCAL_REDEMPTION_THRESHOLD - 1)

    earned = await _service(session).evaluate_soutien_local(user_id)
    assert earned is None


async def test_pionnier_awarded_before_cutoff(
    badge_earning_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, _ = badge_earning_db
    user = await session.get(User, user_id)
    assert user is not None
    user.created_at = PASSPORT_PIONEER_CUTOFF
    await session.commit()

    earned = await _service(session).evaluate_pionnier_yunicity(user_id)
    assert earned is not None


async def test_pionnier_not_awarded_after_cutoff(
    badge_earning_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, _ = badge_earning_db
    user = await session.get(User, user_id)
    assert user is not None
    user.created_at = datetime(2026, 6, 2, tzinfo=UTC)
    await session.commit()

    earned = await _service(session).evaluate_pionnier_yunicity(user_id)
    assert earned is None


async def test_amateur_spectacles_not_auto_awarded(
    badge_earning_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = badge_earning_db
    await _add_stamps(session, passport_id, 10)
    await _add_redemptions(session, passport_id, 10)

    service = _service(session)
    assert await service.evaluate_amateur_spectacles(user_id) is None
    report = await service.evaluate_user(user_id)
    assert PassportBadgeCode.AMATEUR_SPECTACLES.value not in report.awarded
    assert not await service.has_badge(user_id, PassportBadgeCode.AMATEUR_SPECTACLES.value)


async def test_secret_badges_not_auto_awarded(
    badge_earning_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = badge_earning_db
    await _add_stamps(session, passport_id, 10)
    await _add_redemptions(session, passport_id, 10)

    report = await _service(session).evaluate_user(user_id)
    for secret_code in MVP_SECRET_BADGE_CODES:
        assert secret_code not in report.awarded
        assert not await _service(session).has_badge(user_id, secret_code)


async def test_award_badge_is_idempotent(
    badge_earning_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = badge_earning_db
    await _add_stamps(session, passport_id, EXPLORATEUR_REIMS_STAMP_THRESHOLD)
    service = _service(session)

    first = await service.award_badge(
        user_id,
        PassportBadgeCode.EXPLORATEUR_REIMS.value,
        source_type=PassportBadgeSourceType.PASSPORT_STAMPS.value,
        metadata={"reason": "test"},
    )
    second = await service.award_badge(
        user_id,
        PassportBadgeCode.EXPLORATEUR_REIMS.value,
        source_type=PassportBadgeSourceType.PASSPORT_STAMPS.value,
        metadata={"reason": "test"},
    )

    assert first is not None
    assert second is not None
    assert first.id == second.id
    count = await session.scalar(
        select(func.count())
        .select_from(UserPassportBadge)
        .where(UserPassportBadge.user_id == user_id)
    )
    assert count == 1


async def test_evaluate_user_returns_expected_report(
    badge_earning_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = badge_earning_db
    await _add_stamps(session, passport_id, EXPLORATEUR_REIMS_STAMP_THRESHOLD)

    report = await _service(session).evaluate_user(user_id)

    assert PassportBadgeCode.EXPLORATEUR_REIMS.value in report.awarded
    assert PassportBadgeCode.SOUTIEN_LOCAL.value in report.not_eligible
    assert PassportBadgeCode.PIONNIER_YUNICITY.value in report.awarded


async def test_existing_badges_not_duplicated_on_rerun(
    badge_earning_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = badge_earning_db
    await _add_stamps(session, passport_id, EXPLORATEUR_REIMS_STAMP_THRESHOLD)
    service = _service(session)

    first = await service.evaluate_user(user_id)
    second = await service.evaluate_user(user_id)

    assert PassportBadgeCode.EXPLORATEUR_REIMS.value in first.awarded
    assert PassportBadgeCode.EXPLORATEUR_REIMS.value in second.already_earned
    assert PassportBadgeCode.EXPLORATEUR_REIMS.value not in second.awarded

    count = await session.scalar(
        select(func.count())
        .select_from(UserPassportBadge)
        .where(UserPassportBadge.user_id == user_id)
    )
    assert count == 2


async def test_source_metadata_is_stored(
    badge_earning_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = badge_earning_db
    await _add_stamps(session, passport_id, EXPLORATEUR_REIMS_STAMP_THRESHOLD)

    earned = await _service(session).evaluate_explorateur_reims(user_id)
    assert earned is not None
    assert earned.source_type == PassportBadgeSourceType.PASSPORT_STAMPS.value
    assert earned.metadata_ is not None
    assert earned.metadata_["stamp_count"] == EXPLORATEUR_REIMS_STAMP_THRESHOLD
    assert earned.metadata_["reason"] == "explorer_threshold_reached"


async def test_unique_constraint_respected(
    badge_earning_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, _ = badge_earning_db
    badge = await session.scalar(
        select(PassportBadge).where(
            PassportBadge.code == PassportBadgeCode.SOUTIEN_LOCAL.value
        )
    )
    assert badge is not None

    session.add(UserPassportBadge(user_id=user_id, badge_id=badge.id))
    await session.commit()
    session.add(UserPassportBadge(user_id=user_id, badge_id=badge.id))
    with pytest.raises(IntegrityError):
        await session.commit()
    await session.rollback()


async def test_no_reputation_reward_granted(
    badge_earning_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = badge_earning_db
    badge = await session.scalar(
        select(PassportBadge).where(
            PassportBadge.code == PassportBadgeCode.EXPLORATEUR_REIMS.value
        )
    )
    assert badge is not None
    badge.reputation_reward = 50
    await session.commit()

    rep_before = await session.scalar(
        select(func.count())
        .select_from(ReputationEvent)
        .where(ReputationEvent.user_id == user_id)
    )
    await _add_stamps(session, passport_id, EXPLORATEUR_REIMS_STAMP_THRESHOLD)
    await _service(session).evaluate_explorateur_reims(user_id)

    rep_after = await session.scalar(
        select(func.count())
        .select_from(ReputationEvent)
        .where(ReputationEvent.user_id == user_id)
    )
    badge_rep = await session.scalar(
        select(func.count())
        .select_from(ReputationEvent)
        .where(
            ReputationEvent.user_id == user_id,
            ReputationEvent.source_type == PassportReputationSourceType.BADGE.value,
        )
    )
    assert rep_before == rep_after == 0
    assert badge_rep == 0


async def test_no_ym_reward_granted(
    badge_earning_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = badge_earning_db
    badge = await session.scalar(
        select(PassportBadge).where(
            PassportBadge.code == PassportBadgeCode.EXPLORATEUR_REIMS.value
        )
    )
    assert badge is not None
    badge.ym_reward = 25
    await session.commit()

    ym_before = await session.scalar(
        select(func.count())
        .select_from(YuniTransaction)
        .where(YuniTransaction.user_id == user_id)
    )
    await _add_stamps(session, passport_id, EXPLORATEUR_REIMS_STAMP_THRESHOLD)
    await _service(session).evaluate_explorateur_reims(user_id)

    ym_after = await session.scalar(
        select(func.count())
        .select_from(YuniTransaction)
        .where(YuniTransaction.user_id == user_id)
    )
    assert ym_before == ym_after == 0
