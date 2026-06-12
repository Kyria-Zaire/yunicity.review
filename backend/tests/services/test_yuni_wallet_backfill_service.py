"""YuniMonnaie backfill service tests (PASSPORT-02B)."""

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
from app.core.yuni_wallet_constants import (
    STAMP_EARNED_YM,
    YuniTransactionReferenceType,
    YuniWalletStatus,
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
from app.models.user import User
from app.models.yuni_wallet import YuniTransaction
from app.services.yuni_wallet_backfill_service import YuniWalletBackfillService
from app.services.yuni_wallet_service import YuniWalletService
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def ym_backfill_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[tuple[AsyncSession, uuid.UUID, uuid.UUID], None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip YuniMonnaie backfill tests")
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
            email=f"ym-backfill-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="YM Backfill Tester",
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
            slug=f"ym-bf-org-{uuid.uuid4().hex[:8]}",
            name="YM Backfill Partner",
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
            passport_number=f"YUN-YMB-{uuid.uuid4().hex[:8]}",
            qr_token=f"qr-ymb-{uuid.uuid4().hex[:8]}",
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
            slug=f"ym-bf-extra-{uuid.uuid4().hex[:8]}",
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


async def test_preview_stamps_does_not_create_wallet_or_transaction(
    ym_backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = ym_backfill_db
    await _seed_distinct_stamps(session, passport_id, 2)
    service = YuniWalletBackfillService(session)

    wallets_before = await service.count_wallets()
    txs_before = await service.count_transactions()

    report = await service.preview_stamps()
    assert report.scanned >= 2
    assert report.created >= 1

    wallets_after = await service.count_wallets()
    txs_after = await service.count_transactions()
    assert wallets_before == wallets_after
    assert txs_before == txs_after

    wallet = await YuniWalletService(session).get_wallet(user_id)
    assert wallet is None


async def test_execute_stamps_creates_wallets_and_transactions(
    ym_backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, _passport_id = ym_backfill_db
    service = YuniWalletBackfillService(session)

    report = await service.execute_stamps()
    assert report.created >= 1

    wallet = await YuniWalletService(session).get_wallet(user_id)
    assert wallet is not None
    assert wallet.balance >= STAMP_EARNED_YM


async def test_execute_stamps_is_idempotent_on_rerun(
    ym_backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, _, _ = ym_backfill_db
    service = YuniWalletBackfillService(session)

    first = await service.execute_stamps()
    second = await service.execute_stamps()

    assert first.created >= 1
    assert second.created == 0
    assert second.skipped_existing >= first.created


async def test_execute_stamps_skips_suspended_wallet(
    ym_backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, _passport_id = ym_backfill_db
    wallet_service = YuniWalletService(session)
    await wallet_service.get_or_create_wallet(user_id)
    await wallet_service.suspend_wallet(user_id, reason="backfill skip test")

    service = YuniWalletBackfillService(session)
    report = await service.execute_stamps()

    assert report.skipped_suspended >= 1
    assert report.created == 0

    wallet = await wallet_service.get_wallet(user_id)
    assert wallet is not None
    assert wallet.status == YuniWalletStatus.SUSPENDED.value
    assert wallet.balance == 0


async def test_preview_redemptions_does_not_write(
    ym_backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = ym_backfill_db
    org = await session.scalar(select(Organization).limit(1))
    assert org is not None
    offer = PartnerOffer(
        organization_id=org.id,
        title="Preview redemption",
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

    wallet_service = YuniWalletService(session)
    assert not await wallet_service.has_existing_earn(
        user_id,
        YuniTransactionReferenceType.PARTNER_OFFER_REDEMPTION.value,
        redemption.id,
    )

    service = YuniWalletBackfillService(session)
    txs_before = await service.count_transactions()
    report = await service.preview_redemptions()
    txs_after = await service.count_transactions()

    assert report.scanned >= 1
    assert txs_before == txs_after
    assert not await wallet_service.has_existing_earn(
        user_id,
        YuniTransactionReferenceType.PARTNER_OFFER_REDEMPTION.value,
        redemption.id,
    )


async def test_execute_redemptions_creates_transactions(
    ym_backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, user_id, passport_id = ym_backfill_db
    org = await session.scalar(select(Organization).limit(1))
    assert org is not None
    offer = PartnerOffer(
        organization_id=org.id,
        title="Execute redemption",
        offer_type=PartnerOfferType.GIFT,
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

    service = YuniWalletBackfillService(session)
    await service.execute_redemptions()

    tx = await session.scalar(
        select(YuniTransaction).where(
            YuniTransaction.user_id == user_id,
            YuniTransaction.reference_id == redemption.id,
            YuniTransaction.reference_type
            == YuniTransactionReferenceType.PARTNER_OFFER_REDEMPTION.value,
        )
    )
    assert tx is not None
    assert tx.amount == 1


async def test_backfill_limit_is_respected(
    ym_backfill_db: tuple[AsyncSession, uuid.UUID, uuid.UUID],
) -> None:
    session, _, passport_id = ym_backfill_db
    await _seed_distinct_stamps(session, passport_id, 4)
    service = YuniWalletBackfillService(session)

    report = await service.preview_stamps(limit=2)
    assert report.scanned == 2
