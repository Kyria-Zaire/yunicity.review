"""Admin analytics summary API tests (ADMIN-ANALYTICS-01)."""

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

BASE = "/api/v1/admin/analytics/summary"

EXPECTED_TOP_LEVEL_KEYS = {
    "generated_at",
    "scope",
    "growth",
    "passport",
    "partners",
    "offers",
    "events",
    "creators",
    "crm",
    "attention",
}


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


async def _seed_analytics_fixtures(
    session: AsyncSession,
    *,
    city: str,
    owner: User,
    event_author_id: uuid.UUID,
) -> None:
    suffix = uuid.uuid4().hex[:8]
    now = datetime.now(UTC)

    org_active = Organization(
        slug=f"analytics-active-{suffix}",
        name="Analytics Active Partner",
        type=OrganizationType.COMMERCE,
        city=city,
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PUBLIC,
    )
    org_pending = Organization(
        slug=f"analytics-pending-{suffix}",
        name="Analytics Pending Org",
        type=OrganizationType.COMMERCE,
        city=city,
        verification_status=VerificationStatus.PENDING,
        visibility=OrganizationVisibility.PRIVATE,
    )
    session.add_all([org_active, org_pending])
    await session.flush()

    session.add_all(
        [
            PartnerProfile(
                organization_id=org_active.id,
                partnership_type=PartnershipType.LOCAL_BUSINESS,
                partner_status=PartnerStatus.ACTIVE,
            ),
            PartnerProfile(
                organization_id=org_pending.id,
                partnership_type=PartnershipType.LOCAL_BUSINESS,
                partner_status=PartnerStatus.SIGNED,
            ),
        ]
    )

    tier = await _get_basic_tier(session)
    passport = Passport(
        user_id=owner.id,
        tier_id=tier.id,
        city=city,
        passport_number=f"YC-AN-{suffix}",
        qr_token=f"qr-analytics-{suffix}",
        status=PassportStatus.ACTIVE,
        created_at=now - timedelta(days=3),
    )
    session.add(passport)
    await session.flush()

    offer_published = PartnerOffer(
        organization_id=org_active.id,
        title="Analytics Published Offer",
        slug=f"analytics-published-{suffix}",
        offer_type=PartnerOfferType.DISCOUNT,
        status=PartnerOfferStatus.PUBLISHED,
        is_active=True,
    )
    offer_pending = PartnerOffer(
        organization_id=org_active.id,
        title="Analytics Pending Offer",
        slug=f"analytics-pending-{suffix}",
        offer_type=PartnerOfferType.DISCOUNT,
        status=PartnerOfferStatus.PENDING_REVIEW,
    )
    session.add_all([offer_published, offer_pending])
    await session.flush()

    session.add(
        PassportStamp(
            passport_id=passport.id,
            organization_id=org_active.id,
            stamp_source=PassportStampSource.QR,
            stamped_at=now - timedelta(days=2),
        )
    )
    session.add(
        PassportOfferRedemption(
            passport_id=passport.id,
            partner_offer_id=offer_published.id,
            status=OfferRedemptionStatus.COMPLETED,
            redeemed_at=now - timedelta(days=1),
        )
    )

    session.add(
        LocalEvent(
            organization_id=org_active.id,
            created_by_user_id=event_author_id,
            title="Analytics Approved Event",
            city=city,
            starts_at=now + timedelta(days=10),
            location_name="Reims Centre",
            moderation_status=LocalEventModerationStatus.APPROVED,
            visibility=LocalEventVisibility.PUBLIC,
        )
    )
    session.add(
        LocalEvent(
            organization_id=org_active.id,
            created_by_user_id=event_author_id,
            title="Analytics Pending Event",
            city=city,
            starts_at=now + timedelta(days=12),
            location_name="Reims Centre",
            moderation_status=LocalEventModerationStatus.PENDING_REVIEW,
            visibility=LocalEventVisibility.PUBLIC,
        )
    )

    session.add(
        PartnerCreatorContent(
            organization_id=org_active.id,
            title="Analytics Published Content",
            status=PartnerCreatorContentStatus.PUBLISHED,
            is_active=True,
            created_by_user_id=event_author_id,
        )
    )
    session.add(
        PartnerCreatorContent(
            organization_id=org_active.id,
            title="Analytics Pending Content",
            status=PartnerCreatorContentStatus.PENDING_REVIEW,
            is_active=False,
            created_by_user_id=event_author_id,
        )
    )

    lead_name = f"Analytics Lead {suffix}"
    name_key, city_key, phone_key = PartnerLead.normalize_identity_key(
        name=lead_name,
        city=city,
        phone=None,
    )
    session.add(
        PartnerLead(
            name=lead_name,
            city=city,
            source=PartnerLeadSource.PHYSICAL_PROSPECTING.value,
            status=PartnerLeadStatus.NEW.value,
            name_normalized=name_key,
            city_normalized=city_key,
            phone_normalized=phone_key,
        )
    )
    await session.flush()


@pytest.mark.asyncio
async def test_analytics_summary_requires_authentication(auth_client: AsyncClient) -> None:
    response = await auth_client.get(BASE)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_analytics_summary_forbidden_without_staff_role(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.get(BASE, headers=auth_header(user.access_token))
    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_analytics_summary_ok_for_super_admin(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.get(BASE, headers=auth_header(admin.access_token))
    assert response.status_code == 200
    data = response.json()
    assert EXPECTED_TOP_LEVEL_KEYS.issubset(data.keys())
    assert data["scope"]["city"] == "Reims"
    assert data["scope"]["period"] == "30d"
    assert data["scope"]["compare_enabled"] is True


@pytest.mark.asyncio
async def test_analytics_summary_ok_for_moderator(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(BASE, headers=auth_header(moderator.access_token))
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_analytics_summary_period_filters(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    for period in ("7d", "30d", "90d"):
        response = await auth_client.get(
            f"{BASE}?period={period}",
            headers=auth_header(moderator.access_token),
        )
        assert response.status_code == 200, response.text
        assert response.json()["scope"]["period"] == period


@pytest.mark.asyncio
async def test_analytics_summary_compare_can_be_disabled(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        f"{BASE}?compare=false",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["scope"]["compare_enabled"] is False
    assert data["growth"]["new_users_previous_period"] == 0
    assert data["growth"]["growth_rate_percent"] is None


@pytest.mark.asyncio
async def test_analytics_summary_city_filter_counts(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    test_city = f"Reims-Analytics-{uuid.uuid4().hex[:8]}"

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        owner = await session.get(User, moderator.user_id)
        assert owner is not None
        await _seed_analytics_fixtures(
            session,
            city=test_city,
            owner=owner,
            event_author_id=moderator.user_id,
        )
        await session.commit()

    response = await auth_client.get(
        f"{BASE}?city={test_city}&period=30d",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["scope"]["city"] == test_city

    assert data["growth"]["active_users"] == 1
    assert data["growth"]["new_users"] == 1
    assert data["passport"]["active_passports"] == 1
    assert data["passport"]["activated_in_period"] == 1
    assert data["passport"]["stamps_total"] == 1
    assert data["passport"]["stamps_in_period"] == 1
    assert data["passport"]["qr_claims_in_period"] == 1
    assert data["passport"]["redemptions_in_period"] == 1

    assert data["partners"]["total_partners"] == 2
    assert data["partners"]["active"] == 1
    assert data["partners"]["signed"] == 1
    assert data["partners"]["public_visible"] == 1
    assert data["partners"]["pending_verification"] == 1

    assert data["offers"]["total"] == 2
    assert data["offers"]["published"] == 1
    assert data["offers"]["pending_review"] == 1

    assert data["events"]["total"] == 2
    assert data["events"]["approved"] == 1
    assert data["events"]["pending_review"] == 1

    assert data["creators"]["contents_total"] == 2
    assert data["creators"]["published"] == 1
    assert data["creators"]["pending_review"] == 1
    assert data["creators"]["active_creators"] == 1

    assert data["crm"]["total_leads"] == 1
    assert data["crm"]["new"] == 1

    attention = data["attention"]
    assert attention["pending_offers"] == 1
    assert attention["pending_events"] == 1
    assert attention["pending_creator_contents"] == 1
    assert attention["pending_partner_verifications"] == 1
    assert attention["open_leads"] == 1


@pytest.mark.asyncio
async def test_analytics_summary_exposes_no_personal_data(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(BASE, headers=auth_header(moderator.access_token))
    assert response.status_code == 200
    payload = response.text.lower()
    assert "email" not in payload
    assert "hashed_password" not in payload
    assert "full_name" not in payload
    assert "notes" not in payload


@pytest.mark.asyncio
async def test_analytics_summary_json_structure_complete(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(BASE, headers=auth_header(moderator.access_token))
    assert response.status_code == 200
    data = response.json()

    assert set(data["growth"].keys()) == {
        "active_users",
        "new_users",
        "new_users_previous_period",
        "growth_rate_percent",
    }
    assert set(data["passport"].keys()) == {
        "active_passports",
        "activated_in_period",
        "stamps_total",
        "stamps_in_period",
        "qr_claims_in_period",
        "partner_claims_in_period",
        "redemptions_in_period",
    }
    assert set(data["crm"].keys()) == {
        "total_leads",
        "new",
        "contacted",
        "interested",
        "meeting_scheduled",
        "converted",
        "rejected",
        "archived",
    }
