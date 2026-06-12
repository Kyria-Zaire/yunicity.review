"""YuniMonnaie earn hooks tests (PASSPORT-02B)."""

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
from app.core.yuni_wallet_constants import (
    PARTNER_REDEMPTION_YM,
    STAMP_EARNED_YM,
    YuniTransactionReferenceType,
    YuniTransactionType,
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
from app.models.yuni_wallet import YuniTransaction, YuniWallet
from app.repositories.passport_repository import PassportRepository
from app.services.passport_reputation_hooks import (
    award_reputation_for_partner_redemption,
    award_reputation_for_passport_stamp,
)
from app.services.passport_reputation_service import PassportReputationService
from app.services.yuni_wallet_hooks import (
    award_yuni_for_partner_redemption,
    award_yuni_for_passport_stamp,
)
from app.services.yuni_wallet_service import YuniWalletService
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def ym_hooks_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID], None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip YuniMonnaie hook tests")
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
            email=f"ym-hook-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="YM Hook Tester",
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
            slug=f"ym-hook-org-{uuid.uuid4().hex[:8]}",
            name="YM Hook Partner",
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
            passport_number=f"YUN-YMH-{uuid.uuid4().hex[:8]}",
            qr_token=f"qr-ymh-{uuid.uuid4().hex[:8]}",
            status=PassportStatus.ACTIVE,
        )
        session.add(passport)
        await session.commit()

        yield session, user.id, passport.id, org.id

    await dispose_db()
    get_settings.cache_clear()


async def test_stamp_creation_awards_yuni(
    ym_hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = ym_hooks_db
    repo = PassportRepository(session)
    new_stamp = await repo.add_stamp_if_missing(
        passport_id=passport_id,
        organization_id=org_id,
        stamped_at=datetime.now(UTC),
    )
    assert new_stamp is not None
    await session.commit()

    tx = await award_yuni_for_passport_stamp(
        session,
        stamp_id=new_stamp.id,
        user_id=user_id,
    )

    assert tx is not None
    assert tx.transaction_type == YuniTransactionType.EARN.value
    assert tx.amount == STAMP_EARNED_YM
    wallet = await YuniWalletService(session).get_wallet(user_id)
    assert wallet is not None
    assert wallet.balance == STAMP_EARNED_YM


async def test_stamp_yuni_hook_is_idempotent(
    ym_hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = ym_hooks_db
    repo = PassportRepository(session)
    new_stamp = await repo.add_stamp_if_missing(
        passport_id=passport_id,
        organization_id=org_id,
        stamped_at=datetime.now(UTC),
    )
    assert new_stamp is not None
    stamp_id = new_stamp.id
    await session.commit()

    await award_yuni_for_passport_stamp(session, stamp_id=stamp_id, user_id=user_id)
    await award_yuni_for_passport_stamp(session, stamp_id=stamp_id, user_id=user_id)

    count = await session.scalar(
        select(func.count())
        .select_from(YuniTransaction)
        .where(
            YuniTransaction.user_id == user_id,
            YuniTransaction.reference_type
            == YuniTransactionReferenceType.PASSPORT_STAMP.value,
            YuniTransaction.reference_id == stamp_id,
        )
    )
    assert count == 1
    wallet = await YuniWalletService(session).get_wallet(user_id)
    assert wallet is not None
    assert wallet.balance == STAMP_EARNED_YM


async def test_stamp_yuni_metadata_is_stored(
    ym_hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = ym_hooks_db
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

    await award_yuni_for_passport_stamp(session, stamp_id=stamp.id, user_id=user_id)

    tx = await session.scalar(
        select(YuniTransaction).where(
            YuniTransaction.reference_id == stamp.id,
            YuniTransaction.reference_type
            == YuniTransactionReferenceType.PASSPORT_STAMP.value,
        )
    )
    assert tx is not None
    assert tx.metadata_ is not None
    assert tx.metadata_["stamp_id"] == str(stamp.id)
    assert tx.metadata_["organization_id"] == str(org_id)
    assert tx.metadata_["reason"] == "passport_stamp_created"


async def test_suspended_wallet_blocks_stamp_yuni(
    ym_hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = ym_hooks_db
    wallet_service = YuniWalletService(session)
    await wallet_service.get_or_create_wallet(user_id)
    await wallet_service.suspend_wallet(user_id, reason="test suspend")

    stamp = PassportStamp(
        passport_id=passport_id,
        organization_id=org_id,
        stamped_at=datetime.now(UTC),
    )
    session.add(stamp)
    await session.commit()

    tx = await award_yuni_for_passport_stamp(session, stamp_id=stamp.id, user_id=user_id)
    assert tx is None

    count = await session.scalar(
        select(func.count())
        .select_from(YuniTransaction)
        .where(YuniTransaction.user_id == user_id)
    )
    assert count == 0


async def test_completed_redemption_awards_yuni(
    ym_hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = ym_hooks_db
    offer = PartnerOffer(
        organization_id=org_id,
        title="YM hook offer",
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

    tx = await award_yuni_for_partner_redemption(
        session,
        redemption_id=redemption.id,
        user_id=user_id,
    )

    assert tx is not None
    assert tx.amount == PARTNER_REDEMPTION_YM
    wallet = await YuniWalletService(session).get_wallet(user_id)
    assert wallet is not None
    assert wallet.balance == PARTNER_REDEMPTION_YM


async def test_pending_redemption_does_not_award_yuni(
    ym_hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = ym_hooks_db
    offer = PartnerOffer(
        organization_id=org_id,
        title="Pending YM offer",
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

    tx = await award_yuni_for_partner_redemption(
        session,
        redemption_id=redemption.id,
        user_id=user_id,
    )
    assert tx is None

    wallet = await YuniWalletService(session).get_wallet(user_id)
    assert wallet is None


async def test_redemption_yuni_hook_is_idempotent(
    ym_hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = ym_hooks_db
    offer = PartnerOffer(
        organization_id=org_id,
        title="Idempotent YM offer",
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

    await award_yuni_for_partner_redemption(
        session, redemption_id=redemption.id, user_id=user_id
    )
    await award_yuni_for_partner_redemption(
        session, redemption_id=redemption.id, user_id=user_id
    )

    count = await session.scalar(
        select(func.count())
        .select_from(YuniTransaction)
        .where(
            YuniTransaction.reference_id == redemption.id,
            YuniTransaction.reference_type
            == YuniTransactionReferenceType.PARTNER_OFFER_REDEMPTION.value,
        )
    )
    assert count == 1


async def test_reputation_and_yuni_coexist_on_stamp(
    ym_hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = ym_hooks_db
    stamp = PassportStamp(
        passport_id=passport_id,
        organization_id=org_id,
        stamped_at=datetime.now(UTC),
    )
    session.add(stamp)
    await session.commit()

    await award_reputation_for_passport_stamp(
        session, stamp_id=stamp.id, user_id=user_id
    )
    await award_yuni_for_passport_stamp(session, stamp_id=stamp.id, user_id=user_id)

    rep_count = await session.scalar(
        select(func.count())
        .select_from(ReputationEvent)
        .where(ReputationEvent.source_id == stamp.id)
    )
    ym_count = await session.scalar(
        select(func.count())
        .select_from(YuniTransaction)
        .where(YuniTransaction.reference_id == stamp.id)
    )
    assert rep_count == 1
    assert ym_count == 1

    snapshot = await PassportReputationService(session).get_reputation(user_id)
    assert snapshot.total_points == STAMP_EARNED_POINTS
    wallet = await YuniWalletService(session).get_wallet(user_id)
    assert wallet is not None
    assert wallet.balance == STAMP_EARNED_YM


async def test_suspended_wallet_reputation_still_awarded(
    ym_hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    """Réputation et YM sont indépendants : wallet suspendu bloque YM seulement."""
    session, user_id, passport_id, org_id = ym_hooks_db
    wallet_service = YuniWalletService(session)
    await wallet_service.get_or_create_wallet(user_id)
    await wallet_service.suspend_wallet(user_id, reason="separation test")

    stamp = PassportStamp(
        passport_id=passport_id,
        organization_id=org_id,
        stamped_at=datetime.now(UTC),
    )
    session.add(stamp)
    await session.commit()

    await award_reputation_for_passport_stamp(
        session, stamp_id=stamp.id, user_id=user_id
    )
    ym_tx = await award_yuni_for_passport_stamp(
        session, stamp_id=stamp.id, user_id=user_id
    )

    assert ym_tx is None
    snapshot = await PassportReputationService(session).get_reputation(user_id)
    assert snapshot.total_points == STAMP_EARNED_POINTS

    ym_count = await session.scalar(
        select(func.count())
        .select_from(YuniTransaction)
        .where(
            YuniTransaction.user_id == user_id,
            YuniTransaction.transaction_type == YuniTransactionType.EARN.value,
        )
    )
    assert ym_count == 0

    wallet = await session.scalar(
        select(YuniWallet).where(YuniWallet.user_id == user_id)
    )
    assert wallet is not None
    assert wallet.balance == 0


async def test_reputation_and_yuni_coexist_on_redemption(
    ym_hooks_db: tuple[AsyncSession, uuid.UUID, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id, org_id = ym_hooks_db
    offer = PartnerOffer(
        organization_id=org_id,
        title="Coexist offer",
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
        session, redemption_id=redemption.id, user_id=user_id
    )
    await award_yuni_for_partner_redemption(
        session, redemption_id=redemption.id, user_id=user_id
    )

    rep_event = await session.scalar(
        select(ReputationEvent).where(
            ReputationEvent.event_type
            == PassportReputationEventType.PARTNER_REDEMPTION.value,
            ReputationEvent.source_id == redemption.id,
        )
    )
    ym_tx = await session.scalar(
        select(YuniTransaction).where(
            YuniTransaction.reference_id == redemption.id,
            YuniTransaction.reference_type
            == YuniTransactionReferenceType.PARTNER_OFFER_REDEMPTION.value,
        )
    )
    assert rep_event is not None
    assert rep_event.points == PARTNER_REDEMPTION_POINTS
    assert ym_tx is not None
    assert ym_tx.amount == PARTNER_REDEMPTION_YM
