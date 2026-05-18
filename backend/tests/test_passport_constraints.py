"""Passport DB constraint integration tests."""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncGenerator

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
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def passport_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[AsyncSession, None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip passport constraint tests")
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
            email=f"passport-test-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Passport Tester",
            city="Reims",
        )
        session.add(user)
        await session.flush()

        tier_result = await session.execute(
            select(PassportTier).where(PassportTier.code == PassportTierCode.BASIC)
        )
        tier = tier_result.scalar_one_or_none()
        if tier is None:
            tier = PassportTier(
                code=PassportTierCode.BASIC,
                name="Basic",
                display_order=10,
            )
            session.add(tier)
            await session.flush()

        verified_org = Organization(
            slug=f"verified-{uuid.uuid4().hex[:8]}",
            name="Verified Partner",
            type=OrganizationType.COMMERCE,
            city="Reims",
            verification_status=VerificationStatus.VERIFIED,
            visibility=OrganizationVisibility.PUBLIC,
        )
        pending_org = Organization(
            slug=f"pending-{uuid.uuid4().hex[:8]}",
            name="Pending Partner",
            type=OrganizationType.COMMERCE,
            city="Reims",
            verification_status=VerificationStatus.PENDING,
            visibility=OrganizationVisibility.PRIVATE,
        )
        session.add_all([verified_org, pending_org])
        await session.commit()

        session.info["test_user_id"] = user.id
        session.info["basic_tier_id"] = tier.id
        session.info["verified_org_id"] = verified_org.id
        session.info["pending_org_id"] = pending_org.id
        yield session

    await dispose_db()
    get_settings.cache_clear()


async def _create_passport(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    tier_id: uuid.UUID,
    status: PassportStatus = PassportStatus.ACTIVE,
) -> Passport:
    unique = uuid.uuid4().hex[:8]
    passport = Passport(
        user_id=user_id,
        tier_id=tier_id,
        city="Reims",
        passport_number=f"YUN-REIMS-{unique}",
        qr_token=f"qr-placeholder-{unique}",
        status=status,
    )
    session.add(passport)
    await session.flush()
    return passport


@pytest.mark.asyncio
async def test_only_one_active_passport_per_user(passport_db: AsyncSession) -> None:
    user_id = passport_db.info["test_user_id"]
    tier_id = passport_db.info["basic_tier_id"]

    await _create_passport(passport_db, user_id=user_id, tier_id=tier_id)
    await passport_db.commit()

    passport_db.add(
        Passport(
            user_id=user_id,
            tier_id=tier_id,
            city="Reims",
            passport_number=f"YUN-REIMS-{uuid.uuid4().hex[:8]}",
            qr_token=f"qr-placeholder-{uuid.uuid4().hex[:8]}",
            status=PassportStatus.ACTIVE,
        )
    )
    with pytest.raises(IntegrityError):
        await passport_db.commit()
    await passport_db.rollback()


@pytest.mark.asyncio
async def test_suspended_then_new_active_passport_allowed(passport_db: AsyncSession) -> None:
    user_id = passport_db.info["test_user_id"]
    tier_id = passport_db.info["basic_tier_id"]

    first = await _create_passport(
        passport_db, user_id=user_id, tier_id=tier_id, status=PassportStatus.ACTIVE
    )
    first.status = PassportStatus.SUSPENDED
    await passport_db.flush()

    await _create_passport(passport_db, user_id=user_id, tier_id=tier_id)
    await passport_db.commit()

    result = await passport_db.execute(
        select(Passport).where(
            Passport.user_id == user_id, Passport.status == PassportStatus.ACTIVE
        )
    )
    assert len(result.scalars().all()) == 1


@pytest.mark.asyncio
async def test_stamp_unique_per_organization(passport_db: AsyncSession) -> None:
    user_id = passport_db.info["test_user_id"]
    tier_id = passport_db.info["basic_tier_id"]
    org_id = passport_db.info["verified_org_id"]

    passport = await _create_passport(passport_db, user_id=user_id, tier_id=tier_id)
    passport_db.add(PassportStamp(passport_id=passport.id, organization_id=org_id))
    await passport_db.commit()

    passport_db.add(PassportStamp(passport_id=passport.id, organization_id=org_id))
    with pytest.raises(IntegrityError):
        await passport_db.commit()
    await passport_db.rollback()


@pytest.mark.asyncio
async def test_redemption_unique_per_passport_and_offer(passport_db: AsyncSession) -> None:
    user_id = passport_db.info["test_user_id"]
    tier_id = passport_db.info["basic_tier_id"]
    org_id = passport_db.info["verified_org_id"]

    passport = await _create_passport(passport_db, user_id=user_id, tier_id=tier_id)
    offer = PartnerOffer(
        organization_id=org_id,
        title="10% off",
        offer_type=PartnerOfferType.DISCOUNT,
    )
    passport_db.add(offer)
    await passport_db.flush()

    passport_db.add(
        PassportOfferRedemption(
            passport_id=passport.id,
            partner_offer_id=offer.id,
            status=OfferRedemptionStatus.COMPLETED,
        )
    )
    await passport_db.commit()

    passport_db.add(
        PassportOfferRedemption(
            passport_id=passport.id,
            partner_offer_id=offer.id,
            status=OfferRedemptionStatus.PENDING,
        )
    )
    with pytest.raises(IntegrityError):
        await passport_db.commit()
    await passport_db.rollback()


@pytest.mark.asyncio
async def test_passport_cascade_deletes_stamps_and_redemptions(passport_db: AsyncSession) -> None:
    user_id = passport_db.info["test_user_id"]
    tier_id = passport_db.info["basic_tier_id"]
    org_id = passport_db.info["verified_org_id"]

    passport = await _create_passport(passport_db, user_id=user_id, tier_id=tier_id)
    offer = PartnerOffer(
        organization_id=org_id,
        title="Gift",
        offer_type=PartnerOfferType.GIFT,
    )
    passport_db.add_all(
        [
            offer,
            PassportStamp(passport_id=passport.id, organization_id=org_id),
        ]
    )
    await passport_db.flush()
    passport_db.add(
        PassportOfferRedemption(
            passport_id=passport.id,
            partner_offer_id=offer.id,
            status=OfferRedemptionStatus.COMPLETED,
        )
    )
    await passport_db.commit()

    passport_id = passport.id
    await passport_db.delete(passport)
    await passport_db.commit()

    stamps = await passport_db.execute(
        select(PassportStamp).where(PassportStamp.passport_id == passport_id)
    )
    redemptions = await passport_db.execute(
        select(PassportOfferRedemption).where(PassportOfferRedemption.passport_id == passport_id)
    )
    assert stamps.scalars().all() == []
    assert redemptions.scalars().all() == []
