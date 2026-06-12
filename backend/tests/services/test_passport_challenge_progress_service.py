"""PassportChallengeProgressService tests (PASSPORT-04B)."""

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
from app.core.passport_challenge_constants import (
    PassportChallengeCode,
    PassportChallengeProgressSourceType,
)
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
from app.models.passport_challenge import (
    PassportChallenge,
    PassportChallengeProgressEvent,
    UserPassportChallenge,
)
from app.models.user import User
from app.services.passport_challenge_progress_service import PassportChallengeProgressService
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def challenge_progress_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[tuple[AsyncSession, uuid.UUID, uuid.UUID], None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip passport challenge progress tests")
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
            email=f"challenge-progress-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Challenge Progress Tester",
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
            passport_number=f"YUN-CP-{uuid.uuid4().hex[:8]}",
            qr_token=f"qr-cp-{uuid.uuid4().hex[:8]}",
            status=PassportStatus.ACTIVE,
        )
        session.add(passport)
        await session.commit()

        await seed_passport_challenges(session)
        await session.commit()

        yield session, user.id, passport.id

    await dispose_db()
    get_settings.cache_clear()


def _service(session: AsyncSession) -> PassportChallengeProgressService:
    return PassportChallengeProgressService(session)


async def _create_org(session: AsyncSession, suffix: str) -> Organization:
    org = Organization(
        slug=f"cp-org-{suffix}-{uuid.uuid4().hex[:6]}",
        name=f"Org {suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PUBLIC,
    )
    session.add(org)
    await session.flush()
    return org


async def _create_stamp(
    session: AsyncSession,
    passport_id: uuid.UUID,
    suffix: str = "1",
) -> PassportStamp:
    org = await _create_org(session, suffix)
    stamp = PassportStamp(
        passport_id=passport_id,
        organization_id=org.id,
        stamped_at=datetime.now(UTC),
    )
    session.add(stamp)
    passport = await session.get(Passport, passport_id)
    assert passport is not None
    passport.stamps_count += 1
    await session.commit()
    await session.refresh(stamp)
    return stamp


async def _create_redemption(
    session: AsyncSession,
    passport_id: uuid.UUID,
    *,
    status: OfferRedemptionStatus = OfferRedemptionStatus.COMPLETED,
    suffix: str = "1",
) -> PassportOfferRedemption:
    org = await _create_org(session, suffix)
    offer = PartnerOffer(
        organization_id=org.id,
        title=f"Offer {suffix}",
        offer_type=PartnerOfferType.DISCOUNT,
    )
    session.add(offer)
    await session.flush()
    redemption = PassportOfferRedemption(
        passport_id=passport_id,
        partner_offer_id=offer.id,
        status=status,
        redeemed_at=datetime.now(UTC) if status == OfferRedemptionStatus.COMPLETED else None,
    )
    session.add(redemption)
    await session.commit()
    await session.refresh(redemption)
    return redemption


async def _get_user_challenge_by_code(
    session: AsyncSession,
    user_id: uuid.UUID,
    code: str,
) -> UserPassportChallenge | None:
    challenge = await session.scalar(
        select(PassportChallenge).where(PassportChallenge.code == code).limit(1)
    )
    assert challenge is not None
    row = await session.scalar(
        select(UserPassportChallenge).where(
            UserPassportChallenge.user_id == user_id,
            UserPassportChallenge.challenge_id == challenge.id,
        )
    )
    return row


async def test_ensure_user_challenge_creates_progress(
    challenge_progress_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, _ = challenge_progress_db
    challenge = await session.scalar(
        select(PassportChallenge).where(
            PassportChallenge.code == PassportChallengeCode.EXPLORER_CENTRE_VILLE.value
        )
    )
    assert challenge is not None

    row = await _service(session).ensure_user_challenge(
        user_id,
        PassportChallengeCode.EXPLORER_CENTRE_VILLE.value,
    )

    assert row.progress == 0
    assert row.target_value == challenge.target_value
    assert row.completed is False
    assert row.reward_claimed is False


async def test_stamp_progress_increments_explorer(
    challenge_progress_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_progress_db
    stamp = await _create_stamp(session, passport_id)

    await _service(session).increment_stamp_progress(user_id, stamp)

    row = await _get_user_challenge_by_code(
        session, user_id, PassportChallengeCode.EXPLORER_CENTRE_VILLE.value
    )
    assert row is not None
    assert row.progress == 1


async def test_redemption_progress_increments_soutien_local(
    challenge_progress_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_progress_db
    redemption = await _create_redemption(session, passport_id)

    await _service(session).increment_redemption_progress(user_id, redemption)

    row = await _get_user_challenge_by_code(
        session, user_id, PassportChallengeCode.SOUTIEN_LOCAL_HEBDO.value
    )
    assert row is not None
    assert row.progress == 1


async def test_pending_redemption_does_not_increment(
    challenge_progress_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_progress_db
    redemption = await _create_redemption(
        session,
        passport_id,
        status=OfferRedemptionStatus.PENDING,
    )

    results = await _service(session).increment_redemption_progress(user_id, redemption)

    assert results == []
    row = await _get_user_challenge_by_code(
        session, user_id, PassportChallengeCode.SOUTIEN_LOCAL_HEBDO.value
    )
    assert row is None


async def test_inactive_event_challenge_is_ignored(
    challenge_progress_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, _ = challenge_progress_db

    result = await _service(session).increment_progress(
        user_id,
        PassportChallengeCode.SORTIES_REMOISES.value,
        source_type="event",
        source_id=uuid.uuid4(),
    )

    assert result is None
    row = await _get_user_challenge_by_code(
        session, user_id, PassportChallengeCode.SORTIES_REMOISES.value
    )
    assert row is None


async def test_manual_challenge_is_ignored(
    challenge_progress_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_progress_db
    stamp = await _create_stamp(session, passport_id)

    await _service(session).increment_stamp_progress(user_id, stamp)

    row = await _get_user_challenge_by_code(
        session, user_id, PassportChallengeCode.PREMIER_CERCLE.value
    )
    assert row is None


async def test_progress_is_capped_at_target(
    challenge_progress_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_progress_db
    service = _service(session)

    for idx in range(6):
        stamp = await _create_stamp(session, passport_id, suffix=str(idx))
        await service.increment_stamp_progress(user_id, stamp)

    row = await _get_user_challenge_by_code(
        session, user_id, PassportChallengeCode.EXPLORER_CENTRE_VILLE.value
    )
    assert row is not None
    assert row.progress == 5
    assert row.completed is True


async def test_completed_at_set_once(
    challenge_progress_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_progress_db
    service = _service(session)

    for idx in range(5):
        stamp = await _create_stamp(session, passport_id, suffix=str(idx))
        await service.increment_stamp_progress(user_id, stamp)

    row = await _get_user_challenge_by_code(
        session, user_id, PassportChallengeCode.EXPLORER_CENTRE_VILLE.value
    )
    assert row is not None
    assert row.completed_at is not None
    first_completed_at = row.completed_at

    extra_stamp = await _create_stamp(session, passport_id, suffix="extra")
    await service.increment_stamp_progress(user_id, extra_stamp)

    await session.refresh(row)
    assert row.completed_at == first_completed_at


async def test_completed_challenge_does_not_increment_again(
    challenge_progress_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_progress_db
    service = _service(session)

    stamps: list[PassportStamp] = []
    for idx in range(5):
        stamps.append(await _create_stamp(session, passport_id, suffix=str(idx)))
    for stamp in stamps:
        await service.increment_stamp_progress(user_id, stamp)

    row = await _get_user_challenge_by_code(
        session, user_id, PassportChallengeCode.EXPLORER_CENTRE_VILLE.value
    )
    assert row is not None
    assert row.progress == 5

    await service.increment_progress(
        user_id,
        PassportChallengeCode.EXPLORER_CENTRE_VILLE.value,
        source_type=PassportChallengeProgressSourceType.PASSPORT_STAMP.value,
        source_id=stamps[0].id,
    )

    await session.refresh(row)
    assert row.progress == 5


async def test_reward_claimed_remains_false_on_completion(
    challenge_progress_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_progress_db
    service = _service(session)

    for idx in range(5):
        stamp = await _create_stamp(session, passport_id, suffix=str(idx))
        await service.increment_stamp_progress(user_id, stamp)

    row = await _get_user_challenge_by_code(
        session, user_id, PassportChallengeCode.EXPLORER_CENTRE_VILLE.value
    )
    assert row is not None
    assert row.completed is True
    assert row.reward_claimed is False


async def test_source_idempotence_prevents_double_progress(
    challenge_progress_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_progress_db
    stamp = await _create_stamp(session, passport_id)
    service = _service(session)

    await service.increment_stamp_progress(user_id, stamp)
    await service.increment_stamp_progress(user_id, stamp)

    row = await _get_user_challenge_by_code(
        session, user_id, PassportChallengeCode.EXPLORER_CENTRE_VILLE.value
    )
    assert row is not None
    assert row.progress == 1

    event_count = await session.scalar(
        select(func.count())
        .select_from(PassportChallengeProgressEvent)
        .where(
            PassportChallengeProgressEvent.user_id == user_id,
            PassportChallengeProgressEvent.source_id == stamp.id,
        )
    )
    assert event_count == 1
