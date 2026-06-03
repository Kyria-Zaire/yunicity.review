"""Admin passport ops read API tests (ADMIN-03A)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import UTC, datetime

import pytest
from app.core.organization_constants import (
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.partner_constants import PartnershipType, PartnerStatus
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
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile
from app.models.passport import (
    PartnerOffer,
    Passport,
    PassportOfferRedemption,
    PassportStamp,
    PassportTier,
)
from app.models.user import User
from app.models.user_profile import UserProfile
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/passports"


@dataclass(frozen=True, slots=True)
class PassportFixtureIds:
    passport_id: uuid.UUID
    email: str
    passport_number: str
    qr_token: str
    display_name: str
    org_id: uuid.UUID


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> AsyncIterator[None]:
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()
    yield
    if redis is not None:
        await redis.flushdb()


async def _session_factory() -> async_sessionmaker[AsyncSession]:
    engine = get_engine()
    assert engine is not None
    return async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


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


async def _seed_passport_fixture(session: AsyncSession) -> PassportFixtureIds:
    suffix = uuid.uuid4().hex[:8]
    email = f"Passport.Ops.{suffix}@Example.COM"
    passport_number = f"YUN-OPS-{suffix}"
    qr_token = f"qr-ops-fragment-{suffix}-token-12chars"
    display_name = f"Rodolphe Ops {suffix}"

    org_primary = Organization(
        slug=f"passport-ops-org-a-{suffix}",
        name=f"Passport Ops Org A {suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PUBLIC,
    )
    org_secondary = Organization(
        slug=f"passport-ops-org-b-{suffix}",
        name=f"Passport Ops Org B {suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PUBLIC,
    )
    session.add_all([org_primary, org_secondary])
    await session.flush()

    user = User(
        email=email,
        hashed_password="hashed",
        full_name="Fallback Full Name",
        city="Reims",
    )
    session.add(user)
    await session.flush()

    profile = UserProfile(
        user_id=user.id,
        username=f"ops{suffix}"[:30],
        display_name=display_name,
        city="Reims",
    )
    session.add(profile)
    await session.flush()

    tier = await _get_basic_tier(session)
    passport = Passport(
        user_id=user.id,
        tier_id=tier.id,
        city="Reims",
        passport_number=passport_number,
        qr_token=qr_token,
        status=PassportStatus.ACTIVE,
        stamps_count=2,
        redemptions_count=2,
        activated_at=datetime.now(UTC),
    )
    session.add(passport)
    await session.flush()

    session.add(
        PassportStamp(
            passport_id=passport.id,
            organization_id=org_primary.id,
            stamp_source=PassportStampSource.QR,
        )
    )
    session.add(
        PassportStamp(
            passport_id=passport.id,
            organization_id=org_secondary.id,
            stamp_source=PassportStampSource.ORGANIZATION,
        )
    )

    offer_completed = PartnerOffer(
        organization_id=org_primary.id,
        title="Offre completed ops",
        slug=f"ops-complete-{suffix}",
        offer_type=PartnerOfferType.DISCOUNT,
        status=PartnerOfferStatus.PUBLISHED,
        is_active=True,
    )
    offer_pending = PartnerOffer(
        organization_id=org_primary.id,
        title="Offre pending ops",
        slug=f"ops-pending-{suffix}",
        offer_type=PartnerOfferType.GIFT,
        status=PartnerOfferStatus.PUBLISHED,
        is_active=True,
    )
    session.add_all([offer_completed, offer_pending])
    await session.flush()

    session.add(
        PassportOfferRedemption(
            passport_id=passport.id,
            partner_offer_id=offer_completed.id,
            status=OfferRedemptionStatus.COMPLETED,
            redeemed_at=datetime.now(UTC),
        )
    )
    session.add(
        PassportOfferRedemption(
            passport_id=passport.id,
            partner_offer_id=offer_pending.id,
            status=OfferRedemptionStatus.PENDING,
        )
    )

    return PassportFixtureIds(
        passport_id=passport.id,
        email=email,
        passport_number=passport_number,
        qr_token=qr_token,
        display_name=display_name,
        org_id=org_primary.id,
    )


@pytest.fixture
async def passport_fixture() -> PassportFixtureIds:
    factory = await _session_factory()
    async with factory() as session:
        ids = await _seed_passport_fixture(session)
        await session.commit()
        return ids


def _detail_url(passport_id: uuid.UUID) -> str:
    return f"{BASE}/{passport_id}"


def _stamps_url(passport_id: uuid.UUID) -> str:
    return f"{BASE}/{passport_id}/stamps"


def _redemptions_url(passport_id: uuid.UUID) -> str:
    return f"{BASE}/{passport_id}/redemptions"


@pytest.mark.asyncio
async def test_moderator_can_list_passports(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    passport_fixture: PassportFixtureIds,
) -> None:
    _ = passport_fixture
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        BASE,
        params={"city": "Reims"},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["page"] == 1
    assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_regular_user_denied_list(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.get(BASE, headers=auth_header(user.access_token))
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_partner_user_without_staff_denied(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    passport_fixture: PassportFixtureIds,
) -> None:
    _ = passport_fixture
    partner_user = await rbac_user_factory()
    factory = await _session_factory()
    async with factory() as session:
        session.add(
            PartnerProfile(
                organization_id=passport_fixture.org_id,
                partner_status=PartnerStatus.ACTIVE,
                partnership_type=PartnershipType.LOCAL_BUSINESS,
            )
        )
        await session.commit()

    response = await auth_client.get(BASE, headers=auth_header(partner_user.access_token))
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_by_city_includes_fixture(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    passport_fixture: PassportFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        BASE,
        params={"city": "Reims", "page_size": 100},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    ids = {item["id"] for item in response.json()["items"]}
    assert str(passport_fixture.passport_id) in ids


@pytest.mark.asyncio
async def test_list_filter_status_active(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    passport_fixture: PassportFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        BASE,
        params={
            "city": "Reims",
            "status": "active",
            "q": passport_fixture.passport_number,
            "search_mode": "passport_number",
        },
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) >= 1
    assert all(item["status"] == "active" for item in items)


@pytest.mark.asyncio
async def test_search_email_case_insensitive(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    passport_fixture: PassportFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        BASE,
        params={
            "q": passport_fixture.email.lower(),
            "search_mode": "email",
        },
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    assert any(item["id"] == str(passport_fixture.passport_id) for item in response.json()["items"])


@pytest.mark.asyncio
async def test_search_passport_number_exact(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    passport_fixture: PassportFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        BASE,
        params={
            "q": passport_fixture.passport_number,
            "search_mode": "passport_number",
        },
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["passport_number"] == passport_fixture.passport_number


@pytest.mark.asyncio
async def test_search_display_name_min_two_chars(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    passport_fixture: PassportFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    fragment = passport_fixture.display_name[:8]
    assert len(fragment) >= 2
    response = await auth_client.get(
        BASE,
        params={"q": fragment, "search_mode": "display_name"},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    assert any(item["id"] == str(passport_fixture.passport_id) for item in response.json()["items"])


@pytest.mark.asyncio
async def test_search_qr_fragment_min_twelve_chars(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    passport_fixture: PassportFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    fragment = passport_fixture.qr_token[-16:]
    assert len(fragment) >= 12
    response = await auth_client.get(
        BASE,
        params={"q": fragment, "search_mode": "qr_fragment"},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    assert any(item["id"] == str(passport_fixture.passport_id) for item in response.json()["items"])


@pytest.mark.asyncio
async def test_list_never_exposes_qr_token(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    passport_fixture: PassportFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        BASE,
        params={
            "q": passport_fixture.passport_number,
            "search_mode": "passport_number",
        },
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    for item in response.json()["items"]:
        assert "qr_token" not in item


@pytest.mark.asyncio
async def test_detail_includes_qr_token(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    passport_fixture: PassportFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _detail_url(passport_fixture.passport_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["qr_token"] == passport_fixture.qr_token
    assert data["tier"]["code"] == "basic"
    assert data["user"]["email"] == passport_fixture.email


@pytest.mark.asyncio
async def test_detail_not_found(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _detail_url(uuid.uuid4()),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 404
    assert response.json()["code"] == "PASSPORT_NOT_FOUND"


@pytest.mark.asyncio
async def test_detail_redemptions_completed_count(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    passport_fixture: PassportFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _detail_url(passport_fixture.passport_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    stats = response.json()["stats"]
    assert stats["redemptions_total"] == 2
    assert stats["redemptions_completed"] == 1
    assert stats["stamps_total"] == 2


@pytest.mark.asyncio
async def test_stamps_pagination(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    passport_fixture: PassportFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _stamps_url(passport_fixture.passport_id),
        params={"page": 1, "page_size": 1},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 1
    assert data["page_size"] == 1
    assert "organization_name" in data["items"][0]


@pytest.mark.asyncio
async def test_redemptions_pagination(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    passport_fixture: PassportFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _redemptions_url(passport_fixture.passport_id),
        params={"page": 1, "page_size": 1},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 1
    assert "offer_title" in data["items"][0]
    assert "organization_name" in data["items"][0]


@pytest.mark.asyncio
async def test_auto_search_detects_email(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    passport_fixture: PassportFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        BASE,
        params={"q": passport_fixture.email},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    assert any(item["id"] == str(passport_fixture.passport_id) for item in response.json()["items"])


@pytest.mark.asyncio
async def test_display_name_search_rejects_short_query(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        BASE,
        params={"q": "x", "search_mode": "display_name"},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_PASSPORT_SEARCH"
