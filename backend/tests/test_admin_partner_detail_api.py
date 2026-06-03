"""Admin partner detail read API tests (ADMIN-02D1)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta

import pytest
from app.core.local_event_constants import (
    LocalEventModerationStatus,
    LocalEventVisibility,
)
from app.core.organization_constants import (
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.partner_constants import PartnershipType, PartnerStatus
from app.core.partner_creator_content_constants import PartnerCreatorContentStatus
from app.core.passport_constants import (
    OfferRedemptionStatus,
    PartnerOfferStatus,
    PartnerOfferType,
    PassportStampSource,
    PassportStatus,
    PassportTierCode,
)
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from app.models.local_event import LocalEvent
from app.models.organization import Organization
from app.models.partner_creator_content import PartnerCreatorContent
from app.models.partner_profile import PartnerProfile
from app.models.passport import (
    PartnerOffer,
    Passport,
    PassportOfferRedemption,
    PassportStamp,
    PassportTier,
)
from app.models.user import User
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/partners"


def _detail_url(organization_id: uuid.UUID) -> str:
    return f"{BASE}/{organization_id}"


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> AsyncIterator[None]:
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()
    yield
    if redis is not None:
        await redis.flushdb()


async def _get_basic_tier(session: AsyncSession) -> PassportTier:
    result = await session.execute(
        select(PassportTier).where(PassportTier.code == PassportTierCode.BASIC)
    )
    tier = result.scalar_one_or_none()
    if tier is None:
        tier = PassportTier(
            code=PassportTierCode.BASIC,
            name="Basic",
            display_order=10,
        )
        session.add(tier)
        await session.flush()
    return tier


async def _seed_org(
    session: AsyncSession,
    *,
    suffix: str,
    city: str = "Reims",
    verification_status: VerificationStatus = VerificationStatus.VERIFIED,
    with_partner_profile: bool = False,
    partner_status: PartnerStatus = PartnerStatus.SIGNED,
) -> Organization:
    org = Organization(
        slug=f"admin-partner-detail-{suffix}",
        name=f"Partner Detail {suffix}",
        type=OrganizationType.COMMERCE,
        city=city,
        verification_status=verification_status,
        visibility=OrganizationVisibility.PRIVATE,
    )
    session.add(org)
    await session.flush()
    if with_partner_profile:
        session.add(
            PartnerProfile(
                organization_id=org.id,
                partner_status=partner_status,
                partnership_type=PartnershipType.LOCAL_BUSINESS,
            )
        )
    return org


async def _seed_operational_counters(
    session: AsyncSession,
    *,
    org: Organization,
    event_author_id: uuid.UUID,
    suffix: str,
) -> None:
    session.add_all(
        [
            PartnerOffer(
                organization_id=org.id,
                title="Offre pending",
                slug=f"detail-offer-pending-{suffix}",
                offer_type=PartnerOfferType.DRINK,
                status=PartnerOfferStatus.PENDING_REVIEW,
            ),
            PartnerOffer(
                organization_id=org.id,
                title="Offre published",
                slug=f"detail-offer-published-{suffix}",
                offer_type=PartnerOfferType.DISCOUNT,
                status=PartnerOfferStatus.PUBLISHED,
                is_active=True,
            ),
            PartnerCreatorContent(
                organization_id=org.id,
                title="Contenu pending",
                status=PartnerCreatorContentStatus.PENDING_REVIEW,
            ),
            PartnerCreatorContent(
                organization_id=org.id,
                title="Contenu published",
                status=PartnerCreatorContentStatus.PUBLISHED,
            ),
            LocalEvent(
                organization_id=org.id,
                created_by_user_id=event_author_id,
                title="Événement pending",
                city=org.city,
                starts_at=datetime.now(UTC) + timedelta(days=2),
                location_name="Lieu test",
                moderation_status=LocalEventModerationStatus.PENDING_REVIEW.value,
                visibility=LocalEventVisibility.PUBLIC.value,
            ),
            LocalEvent(
                organization_id=org.id,
                created_by_user_id=event_author_id,
                title="Événement approved",
                city=org.city,
                starts_at=datetime.now(UTC) + timedelta(days=5),
                location_name="Lieu test 2",
                moderation_status=LocalEventModerationStatus.APPROVED.value,
                visibility=LocalEventVisibility.PUBLIC.value,
            ),
        ]
    )

    tier = await _get_basic_tier(session)
    passport_user = User(
        email=f"detail-passport-{suffix}@example.com",
        hashed_password="hashed",
        full_name="Detail Passport User",
        city=org.city,
    )
    session.add(passport_user)
    await session.flush()

    passport = Passport(
        user_id=passport_user.id,
        tier_id=tier.id,
        city=org.city,
        passport_number=f"YUN-DETAIL-{suffix}",
        qr_token=f"qr-detail-{suffix}",
        status=PassportStatus.ACTIVE,
    )
    session.add(passport)
    await session.flush()

    session.add(
        PassportStamp(
            passport_id=passport.id,
            organization_id=org.id,
            stamp_source=PassportStampSource.QR,
        )
    )

    redeem_completed = PartnerOffer(
        organization_id=org.id,
        title="Offre redemption completed",
        slug=f"detail-redeem-done-{suffix}",
        offer_type=PartnerOfferType.GIFT,
        status=PartnerOfferStatus.PUBLISHED,
        is_active=True,
    )
    redeem_pending = PartnerOffer(
        organization_id=org.id,
        title="Offre redemption pending",
        slug=f"detail-redeem-pending-{suffix}",
        offer_type=PartnerOfferType.GIFT,
        status=PartnerOfferStatus.PUBLISHED,
        is_active=True,
    )
    session.add_all([redeem_completed, redeem_pending])
    await session.flush()

    session.add_all(
        [
            PassportOfferRedemption(
                passport_id=passport.id,
                partner_offer_id=redeem_completed.id,
                status=OfferRedemptionStatus.COMPLETED,
                redeemed_at=datetime.now(UTC),
            ),
            PassportOfferRedemption(
                passport_id=passport.id,
                partner_offer_id=redeem_pending.id,
                status=OfferRedemptionStatus.PENDING,
            ),
        ]
    )


@pytest.mark.asyncio
async def test_moderator_can_read_partner_detail(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    suffix = uuid.uuid4().hex[:8]
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await _seed_org(session, suffix=suffix, with_partner_profile=True)
        await session.commit()
        org_id = org.id

    response = await auth_client.get(
        _detail_url(org_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["organization"]["id"] == str(org_id)
    assert data["partner_profile"] is not None


@pytest.mark.asyncio
async def test_regular_user_forbidden(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    unknown_id = uuid.uuid4()
    response = await auth_client.get(
        _detail_url(unknown_id),
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_organization_without_partner_profile(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    suffix = uuid.uuid4().hex[:8]
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await _seed_org(
            session,
            suffix=suffix,
            verification_status=VerificationStatus.VERIFIED,
            with_partner_profile=False,
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.get(
        _detail_url(org_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["partner_profile"] is None
    assert data["organization"]["slug"] == f"admin-partner-detail-{suffix}"


@pytest.mark.asyncio
async def test_organization_with_partner_profile(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    suffix = uuid.uuid4().hex[:8]
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await _seed_org(
            session,
            suffix=suffix,
            with_partner_profile=True,
            partner_status=PartnerStatus.ACTIVE,
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.get(
        _detail_url(org_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    profile = response.json()["partner_profile"]
    assert profile is not None
    assert profile["partner_status"] == PartnerStatus.ACTIVE.value
    assert profile["partnership_type"] == PartnershipType.LOCAL_BUSINESS.value


@pytest.mark.asyncio
async def test_counters_are_consistent(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    suffix = uuid.uuid4().hex[:8]
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        author = User(
            email=f"detail-event-author-{suffix}@example.com",
            hashed_password="hashed",
            full_name="Event Author",
            city="Reims",
        )
        session.add(author)
        await session.flush()
        org = await _seed_org(session, suffix=suffix, with_partner_profile=True)
        await _seed_operational_counters(
            session,
            org=org,
            event_author_id=author.id,
            suffix=suffix,
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.get(
        _detail_url(org_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    counters = response.json()["counters"]
    assert counters["offers_total"] == 4
    assert counters["offers_pending"] == 1
    assert counters["offers_published"] == 3
    assert counters["creator_contents_total"] == 2
    assert counters["creator_contents_pending"] == 1
    assert counters["events_total"] == 2
    assert counters["events_pending"] == 1
    assert counters["stamps_total"] == 1
    assert counters["redemptions_total"] == 2
    assert counters["redemptions_completed"] == 1


@pytest.mark.asyncio
async def test_links_are_present(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    suffix = uuid.uuid4().hex[:8]
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await _seed_org(session, suffix=suffix)
        await session.commit()
        org_id = org.id
        org_id_str = str(org_id)

    response = await auth_client.get(
        _detail_url(org_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    links = response.json()["links"]
    assert links["public_place_slug"] == f"admin-partner-detail-{suffix}"
    assert links["organization_id"] == org_id_str
    assert links["offers_admin"] == f"/passport-offers?organization_id={org_id_str}"
    assert links["creator_content_admin"] == "/creator-content"
    assert (
        links["verification_queue"]
        == f"/partners?tab=verification&organization_id={org_id_str}"
    )


@pytest.mark.asyncio
async def test_capabilities_without_profile_verified_org(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    suffix = uuid.uuid4().hex[:8]
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await _seed_org(
            session,
            suffix=suffix,
            verification_status=VerificationStatus.VERIFIED,
            with_partner_profile=False,
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.get(
        _detail_url(org_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    caps = response.json()["capabilities"]
    assert caps["can_create_profile"] is True
    assert caps["can_activate"] is False
    assert caps["can_pause"] is False
    assert caps["can_upgrade_premium"] is False


@pytest.mark.asyncio
async def test_capabilities_signed_partner(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    suffix = uuid.uuid4().hex[:8]
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await _seed_org(
            session,
            suffix=suffix,
            with_partner_profile=True,
            partner_status=PartnerStatus.SIGNED,
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.get(
        _detail_url(org_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    caps = response.json()["capabilities"]
    assert caps["can_activate"] is True
    assert caps["can_pause"] is False
    assert caps["can_upgrade_premium"] is False
    assert caps["can_create_profile"] is False


@pytest.mark.asyncio
async def test_capabilities_active_partner(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    suffix = uuid.uuid4().hex[:8]
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await _seed_org(
            session,
            suffix=suffix,
            with_partner_profile=True,
            partner_status=PartnerStatus.ACTIVE,
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.get(
        _detail_url(org_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    caps = response.json()["capabilities"]
    assert caps["can_activate"] is False
    assert caps["can_pause"] is True
    assert caps["can_upgrade_premium"] is True
    assert caps["can_create_profile"] is False


@pytest.mark.asyncio
async def test_unknown_organization_returns_404(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    unknown_id = uuid.uuid4()
    response = await auth_client.get(
        _detail_url(unknown_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 404
    assert response.json()["code"] == "ORGANIZATION_NOT_FOUND"
