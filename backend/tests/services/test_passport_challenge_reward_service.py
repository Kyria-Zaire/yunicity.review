"""PassportChallengeRewardService tests (PASSPORT-04C)."""

from __future__ import annotations

import asyncio
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
from app.core.passport_challenge_reward_errors import (
    ChallengeNotCompletedError,
    ChallengeRewardWalletError,
    UserChallengeNotFoundError,
)
from app.core.passport_constants import (
    PassportStatus,
    PassportTierCode,
)
from app.core.yuni_wallet_constants import YuniTransactionReferenceType, YuniTransactionType
from app.db.base import Base
from app.db.seeds.passport_challenges import seed_passport_challenges
from app.db.session import dispose_db, get_engine, init_db
from app.models.organization import Organization
from app.models.passport import (
    Passport,
    PassportStamp,
    PassportTier,
)
from app.models.passport_challenge import PassportChallenge, UserPassportChallenge
from app.models.user import User
from app.models.yuni_wallet import YuniTransaction
from app.services.passport_challenge_progress_service import PassportChallengeProgressService
from app.services.passport_challenge_reward_service import PassportChallengeRewardService
from app.services.yuni_wallet_service import YuniWalletService
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def challenge_reward_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[tuple[AsyncSession, uuid.UUID, uuid.UUID], None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip passport challenge reward tests")
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
            email=f"challenge-reward-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Challenge Reward Tester",
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
            passport_number=f"YUN-CR-{uuid.uuid4().hex[:8]}",
            qr_token=f"qr-cr-{uuid.uuid4().hex[:8]}",
            status=PassportStatus.ACTIVE,
        )
        session.add(passport)
        await session.commit()

        await seed_passport_challenges(session)
        await session.commit()

        yield session, user.id, passport.id

    await dispose_db()
    get_settings.cache_clear()


def _reward_service(session: AsyncSession) -> PassportChallengeRewardService:
    return PassportChallengeRewardService(session)


def _progress_service(session: AsyncSession) -> PassportChallengeProgressService:
    return PassportChallengeProgressService(session)


async def _create_org(session: AsyncSession, suffix: str) -> Organization:
    org = Organization(
        slug=f"cr-org-{suffix}-{uuid.uuid4().hex[:6]}",
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
    suffix: str,
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


async def _complete_explorer_challenge(
    session: AsyncSession,
    user_id: uuid.UUID,
    passport_id: uuid.UUID,
) -> UserPassportChallenge:
    progress = _progress_service(session)
    for idx in range(5):
        stamp = await _create_stamp(session, passport_id, suffix=str(idx))
        await progress.increment_stamp_progress(user_id, stamp)

    row = await session.scalar(
        select(UserPassportChallenge)
        .join(PassportChallenge)
        .where(
            UserPassportChallenge.user_id == user_id,
            PassportChallenge.code == PassportChallengeCode.EXPLORER_CENTRE_VILLE.value,
        )
    )
    assert row is not None
    assert row.completed is True
    assert row.reward_claimed is False
    return row


async def _start_explorer_challenge(
    session: AsyncSession,
    user_id: uuid.UUID,
    passport_id: uuid.UUID,
) -> None:
    stamp = await _create_stamp(session, passport_id, suffix="partial")
    await _progress_service(session).increment_stamp_progress(user_id, stamp)


async def test_completed_challenge_claim_awards_yuni(
    challenge_reward_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_reward_db
    user_challenge = await _complete_explorer_challenge(session, user_id, passport_id)
    reward = _reward_service(session)

    result = await reward.claim_reward(
        user_id,
        PassportChallengeCode.EXPLORER_CENTRE_VILLE.value,
    )

    assert result.claimed is True
    assert result.already_claimed is False
    assert result.ym_awarded == 10
    assert result.transaction_id is not None

    await session.refresh(user_challenge)
    assert user_challenge.reward_claimed is True

    wallet = await YuniWalletService(session).get_wallet(user_id)
    assert wallet is not None
    assert wallet.balance == 10

    tx = await session.get(YuniTransaction, result.transaction_id)
    assert tx is not None
    assert tx.transaction_type == YuniTransactionType.EARN.value
    assert tx.reference_type == YuniTransactionReferenceType.CHALLENGE.value


async def test_cannot_claim_unstarted_challenge(
    challenge_reward_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, _ = challenge_reward_db

    with pytest.raises(UserChallengeNotFoundError):
        await _reward_service(session).claim_reward(
            user_id,
            PassportChallengeCode.EXPLORER_CENTRE_VILLE.value,
        )


async def test_cannot_claim_in_progress_challenge(
    challenge_reward_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_reward_db
    await _start_explorer_challenge(session, user_id, passport_id)

    with pytest.raises(ChallengeNotCompletedError):
        await _reward_service(session).claim_reward(
            user_id,
            PassportChallengeCode.EXPLORER_CENTRE_VILLE.value,
        )


async def test_claim_is_idempotent(
    challenge_reward_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_reward_db
    await _complete_explorer_challenge(session, user_id, passport_id)
    reward = _reward_service(session)

    first = await reward.claim_reward(
        user_id,
        PassportChallengeCode.EXPLORER_CENTRE_VILLE.value,
    )
    second = await reward.claim_reward(
        user_id,
        PassportChallengeCode.EXPLORER_CENTRE_VILLE.value,
    )

    assert first.claimed is True
    assert second.claimed is False
    assert second.already_claimed is True

    wallet = await YuniWalletService(session).get_wallet(user_id)
    assert wallet is not None
    assert wallet.balance == 10

    tx_count = await session.scalar(
        select(func.count())
        .select_from(YuniTransaction)
        .where(
            YuniTransaction.user_id == user_id,
            YuniTransaction.reference_type == YuniTransactionReferenceType.CHALLENGE.value,
        )
    )
    assert tx_count == 1


async def test_concurrent_claims_award_once(
    challenge_reward_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    _session, user_id, passport_id = challenge_reward_db
    await _complete_explorer_challenge(_session, user_id, passport_id)

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    code = PassportChallengeCode.EXPLORER_CENTRE_VILLE.value

    async def claim_once() -> None:
        async with factory() as session:
            await PassportChallengeRewardService(session).claim_reward(user_id, code)

    await asyncio.gather(claim_once(), claim_once())

    async with factory() as session:
        wallet = await YuniWalletService(session).get_wallet(user_id)
        assert wallet is not None
        assert wallet.balance == 10

        tx_count = await session.scalar(
            select(func.count())
            .select_from(YuniTransaction)
            .where(
                YuniTransaction.user_id == user_id,
                YuniTransaction.transaction_type == YuniTransactionType.EARN.value,
                YuniTransaction.reference_type
                == YuniTransactionReferenceType.CHALLENGE.value,
            )
        )
        assert tx_count == 1

        user_challenge = await session.scalar(
            select(UserPassportChallenge)
            .join(PassportChallenge)
            .where(
                UserPassportChallenge.user_id == user_id,
                PassportChallenge.code == code,
            )
        )
        assert user_challenge is not None
        assert user_challenge.reward_claimed is True


async def test_wallet_suspended_does_not_mark_claimed(
    challenge_reward_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_reward_db
    user_challenge = await _complete_explorer_challenge(session, user_id, passport_id)
    await YuniWalletService(session).get_or_create_wallet(user_id)
    await YuniWalletService(session).suspend_wallet(user_id, reason="claim blocked")

    with pytest.raises(ChallengeRewardWalletError):
        await _reward_service(session).claim_reward(
            user_id,
            PassportChallengeCode.EXPLORER_CENTRE_VILLE.value,
        )

    await session.refresh(user_challenge)
    assert user_challenge.reward_claimed is False

    tx_count = await session.scalar(
        select(func.count())
        .select_from(YuniTransaction)
        .where(YuniTransaction.user_id == user_id)
    )
    assert tx_count == 0


async def test_zero_ym_reward_marks_claimed_without_transaction(
    challenge_reward_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_reward_db
    challenge = await session.scalar(
        select(PassportChallenge).where(
            PassportChallenge.code == PassportChallengeCode.EXPLORER_CENTRE_VILLE.value
        )
    )
    assert challenge is not None
    challenge.ym_reward = 0
    await session.commit()

    user_challenge = await _complete_explorer_challenge(session, user_id, passport_id)

    result = await _reward_service(session).claim_reward(
        user_id,
        PassportChallengeCode.EXPLORER_CENTRE_VILLE.value,
    )

    assert result.claimed is True
    assert result.ym_awarded == 0
    assert result.transaction_id is None

    await session.refresh(user_challenge)
    assert user_challenge.reward_claimed is True

    wallet = await YuniWalletService(session).get_wallet(user_id)
    assert wallet is None or wallet.balance == 0

    challenge.ym_reward = 10
    await session.commit()


async def test_get_claimable_challenges_returns_completed_unclaimed_only(
    challenge_reward_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_reward_db
    reward = _reward_service(session)

    assert await reward.get_claimable_challenges(user_id) == []

    await _start_explorer_challenge(session, user_id, passport_id)
    assert await reward.get_claimable_challenges(user_id) == []

    await _complete_explorer_challenge(session, user_id, passport_id)
    claimable = await reward.get_claimable_challenges(user_id)
    assert len(claimable) == 1
    assert claimable[0].completed is True
    assert claimable[0].reward_claimed is False

    await reward.claim_reward(user_id, PassportChallengeCode.EXPLORER_CENTRE_VILLE.value)
    assert await reward.get_claimable_challenges(user_id) == []


async def test_has_claimed_reward_true_after_claim(
    challenge_reward_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_reward_db
    await _complete_explorer_challenge(session, user_id, passport_id)
    reward = _reward_service(session)
    code = PassportChallengeCode.EXPLORER_CENTRE_VILLE.value

    assert await reward.has_claimed_reward(user_id, code) is False
    await reward.claim_reward(user_id, code)
    assert await reward.has_claimed_reward(user_id, code) is True


async def test_reference_id_is_user_challenge_id(
    challenge_reward_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = challenge_reward_db
    user_challenge = await _complete_explorer_challenge(session, user_id, passport_id)

    result = await _reward_service(session).claim_reward(
        user_id,
        PassportChallengeCode.EXPLORER_CENTRE_VILLE.value,
    )
    assert result.transaction_id is not None

    tx = await session.get(YuniTransaction, result.transaction_id)
    assert tx is not None
    assert tx.reference_id == user_challenge.id
    assert tx.reference_type == YuniTransactionReferenceType.CHALLENGE.value
