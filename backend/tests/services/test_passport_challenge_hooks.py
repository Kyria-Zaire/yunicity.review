"""Passport challenge progress hooks tests (PASSPORT-04B)."""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

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
from app.repositories.passport_repository import PassportRepository
from app.services.passport_challenge_hooks import (
    update_challenges_for_partner_redemption,
    update_challenges_for_passport_stamp,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def challenge_hooks_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID], None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip passport challenge hook tests")
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
            email=f"challenge-hook-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Challenge Hook Tester",
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
            slug=f"ch-hook-org-{uuid.uuid4().hex[:8]}",
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
            passport_number=f"YUN-CH-{uuid.uuid4().hex[:8]}",
            qr_token=f"qr-ch-{uuid.uuid4().hex[:8]}",
            status=PassportStatus.ACTIVE,
        )
        session.add(passport)
        await session.commit()

        await seed_passport_challenges(session)
        await session.commit()

        yield session, user.id, passport.id, org.id

    await dispose_db()
    get_settings.cache_clear()


async def _get_progress(
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


async def test_stamp_hook_updates_challenge_progress(
    challenge_hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = challenge_hooks_db
    repo = PassportRepository(session)
    new_stamp = await repo.add_stamp_if_missing(
        passport_id=passport_id,
        organization_id=org_id,
        stamped_at=datetime.now(UTC),
    )
    assert new_stamp is not None
    await session.commit()

    await update_challenges_for_passport_stamp(session, new_stamp)

    row = await _get_progress(
        session, user_id, PassportChallengeCode.EXPLORER_CENTRE_VILLE.value
    )
    assert row is not None
    assert row.progress == 1


async def test_redemption_hook_updates_challenge_progress(
    challenge_hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = challenge_hooks_db
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

    await update_challenges_for_partner_redemption(session, redemption)

    row = await _get_progress(
        session, user_id, PassportChallengeCode.SOUTIEN_LOCAL_HEBDO.value
    )
    assert row is not None
    assert row.progress == 1


async def test_hook_failure_does_not_break_business_flow(
    challenge_hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = challenge_hooks_db
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

    with patch(
        "app.services.passport_challenge_hooks.PassportChallengeProgressService"
    ) as mock_cls:
        mock_instance = mock_cls.return_value
        mock_instance.increment_stamp_progress = AsyncMock(
            side_effect=RuntimeError("challenge engine down")
        )

        await update_challenges_for_passport_stamp(session, stamp)

    row = await _get_progress(
        session, user_id, PassportChallengeCode.EXPLORER_CENTRE_VILLE.value
    )
    assert row is None
