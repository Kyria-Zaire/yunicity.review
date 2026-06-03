"""Admin cockpit summary API tests (ADMIN-01A)."""

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
from app.core.partner_lead_constants import PartnerLeadSource, PartnerLeadStatus
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
from app.models.partner_lead import PartnerLead
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

BASE = "/api/v1/admin/cockpit/summary"


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


async def _seed_cockpit_fixtures(
    session: AsyncSession,
    *,
    city: str,
    event_author_id: uuid.UUID,
) -> None:
    suffix = uuid.uuid4().hex[:8]

    org_active = Organization(
        slug=f"cockpit-active-{suffix}",
        name="Cockpit Active Partner",
        type=OrganizationType.COMMERCE,
        city=city,
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PUBLIC,
    )
    org_signed = Organization(
        slug=f"cockpit-signed-{suffix}",
        name="Cockpit Signed Partner",
        type=OrganizationType.COMMERCE,
        city=city,
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PRIVATE,
    )
    org_pending = Organization(
        slug=f"cockpit-pending-{suffix}",
        name="Cockpit Pending Org",
        type=OrganizationType.COMMERCE,
        city=city,
        verification_status=VerificationStatus.PENDING,
        visibility=OrganizationVisibility.PRIVATE,
    )
    session.add_all([org_active, org_signed, org_pending])
    await session.flush()

    session.add_all(
        [
            PartnerProfile(
                organization_id=org_active.id,
                partner_status=PartnerStatus.ACTIVE,
                partnership_type=PartnershipType.LOCAL_BUSINESS,
            ),
            PartnerProfile(
                organization_id=org_signed.id,
                partner_status=PartnerStatus.SIGNED,
                partnership_type=PartnershipType.LOCAL_BUSINESS,
            ),
        ]
    )

    session.add(
        PartnerOffer(
            organization_id=org_active.id,
            title="Offre cockpit pending",
            slug=f"cockpit-offer-{suffix}",
            offer_type=PartnerOfferType.DRINK,
            status=PartnerOfferStatus.PENDING_REVIEW,
        )
    )
    session.add(
        PartnerCreatorContent(
            organization_id=org_active.id,
            title="Contenu cockpit pending",
            status=PartnerCreatorContentStatus.PENDING_REVIEW,
        )
    )
    session.add(
        LocalEvent(
            created_by_user_id=event_author_id,
            title="Événement cockpit pending",
            city=city,
            starts_at=datetime.now(UTC) + timedelta(days=3),
            location_name="Lieu cockpit",
            moderation_status=LocalEventModerationStatus.PENDING_REVIEW.value,
            visibility=LocalEventVisibility.PUBLIC.value,
        )
    )

    name_key, city_key, phone_key = PartnerLead.normalize_identity_key(
        name="Lead Cockpit",
        city=city,
        phone=None,
    )
    session.add(
        PartnerLead(
            name="Lead Cockpit",
            city=city,
            source=PartnerLeadSource.MANUAL.value,
            status=PartnerLeadStatus.NEW.value,
            name_normalized=name_key,
            city_normalized=city_key,
            phone_normalized=phone_key,
        )
    )

    tier = await _get_basic_tier(session)
    passport_user = User(
        email=f"cockpit-passport-{suffix}@example.com",
        hashed_password="hashed",
        full_name="Cockpit Passport User",
        city=city,
    )
    session.add(passport_user)
    await session.flush()

    passport = Passport(
        user_id=passport_user.id,
        tier_id=tier.id,
        city=city,
        passport_number=f"YUN-COCKPIT-{suffix}",
        qr_token=f"qr-cockpit-{suffix}",
        status=PassportStatus.ACTIVE,
    )
    session.add(passport)
    await session.flush()

    session.add(
        PassportStamp(
            passport_id=passport.id,
            organization_id=org_active.id,
            stamp_source=PassportStampSource.QR,
        )
    )

    offer_for_redemption = PartnerOffer(
        organization_id=org_active.id,
        title="Offre redemption cockpit",
        slug=f"cockpit-redeem-{suffix}",
        offer_type=PartnerOfferType.DISCOUNT,
        status=PartnerOfferStatus.PUBLISHED,
        is_active=True,
    )
    session.add(offer_for_redemption)
    await session.flush()

    session.add(
        PassportOfferRedemption(
            passport_id=passport.id,
            partner_offer_id=offer_for_redemption.id,
            status=OfferRedemptionStatus.COMPLETED,
            redeemed_at=datetime.now(UTC),
        )
    )


@pytest.mark.asyncio
async def test_moderator_can_access_cockpit_summary(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(BASE, headers=auth_header(moderator.access_token))
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["city"] == "Reims"
    assert "executive" in data
    assert "attention" in data
    assert "partners" in data
    assert "passport" in data
    assert "generated_at" in data


@pytest.mark.asyncio
async def test_regular_user_denied_cockpit_summary(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.get(BASE, headers=auth_header(user.access_token))
    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_cockpit_summary_default_city_is_reims(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(BASE, headers=auth_header(moderator.access_token))
    assert response.status_code == 200
    assert response.json()["city"] == "Reims"


@pytest.mark.asyncio
async def test_cockpit_summary_counts_match_isolated_city_fixtures(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    test_city = f"Reims-Cockpit-{uuid.uuid4().hex[:8]}"

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await _seed_cockpit_fixtures(
            session,
            city=test_city,
            event_author_id=moderator.user_id,
        )
        await session.commit()

    response = await auth_client.get(
        f"{BASE}?city={test_city}",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["city"] == test_city

    executive = data["executive"]
    assert executive["partners_total"] == 2
    assert executive["offers_total"] == 2
    assert executive["events_total"] == 1
    assert executive["creator_contents_total"] == 1
    assert executive["partner_leads_total"] == 1
    assert executive["passports_total"] == 1

    attention = data["attention"]
    assert attention["offers_pending"] == 1
    assert attention["creator_contents_pending"] == 1
    assert attention["events_pending"] == 1
    assert attention["partner_leads_open"] == 1
    assert attention["organizations_pending_review"] == 1

    partners = data["partners"]
    assert partners["active"] == 1
    assert partners["signed"] == 1
    assert partners["public"] == 1
    assert partners["private"] == 1
    assert partners["verified"] == 2
    assert partners["pending_review"] == 0

    passport = data["passport"]
    assert passport["passports_total"] == 1
    assert passport["stamps_total"] == 1
    assert passport["qr_stamps"] == 1
    assert passport["partner_stamps"] == 0
    assert passport["redemptions_total"] == 1
    assert passport["redemptions_completed"] == 1
