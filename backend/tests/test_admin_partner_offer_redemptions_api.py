"""Admin partner offer redemptions read API tests (ADMIN-04E-A)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from app.core.organization_constants import (
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.passport_constants import (
    OfferRedemptionStatus,
    PartnerOfferStatus,
    PartnerOfferType,
    PassportStatus,
    PassportTierCode,
)
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from app.models.organization import Organization
from app.models.passport import (
    PartnerOffer,
    Passport,
    PassportOfferRedemption,
    PassportTier,
)
from app.models.user import User
from app.models.user_profile import UserProfile
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/partner-offers"


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> AsyncIterator[None]:
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()
    yield
    if redis is not None:
        await redis.flushdb()


@dataclass(frozen=True, slots=True)
class OfferRedemptionFixtureIds:
    offer_id: uuid.UUID
    passport_numbers: tuple[str, ...]
    emails: tuple[str, ...]
    display_names: tuple[str, ...]


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


async def _create_passport_with_user(
    session: AsyncSession,
    *,
    suffix: str,
    display_name: str,
) -> tuple[Passport, User]:
    email = f"offer-redemption.{suffix}@example.com"
    user = User(
        email=email,
        hashed_password="hashed",
        full_name=f"Fallback {suffix}",
        city="Reims",
    )
    session.add(user)
    await session.flush()

    profile = UserProfile(
        user_id=user.id,
        username=f"red{suffix}"[:30],
        display_name=display_name,
        city="Reims",
    )
    session.add(profile)

    tier = await _get_basic_tier(session)
    passport = Passport(
        user_id=user.id,
        tier_id=tier.id,
        city="Reims",
        passport_number=f"YUN-OFR-{suffix}",
        qr_token=f"qr-offer-redemption-{suffix}-token-secret",
        status=PassportStatus.ACTIVE,
        activated_at=datetime.now(UTC),
    )
    session.add(passport)
    await session.flush()
    return passport, user


async def _seed_offer_redemption_fixture(session: AsyncSession) -> OfferRedemptionFixtureIds:
    suffix = uuid.uuid4().hex[:8]
    org = Organization(
        slug=f"offer-redemption-org-{suffix}",
        name=f"Offer Redemption Org {suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PUBLIC,
    )
    session.add(org)
    await session.flush()

    offer = PartnerOffer(
        organization_id=org.id,
        title=f"Offre redemptions {suffix}",
        slug=f"offer-redemptions-{suffix}",
        offer_type=PartnerOfferType.DRINK,
        status=PartnerOfferStatus.PUBLISHED,
        is_active=True,
    )
    session.add(offer)
    await session.flush()

    now = datetime.now(UTC)
    passport_specs: list[
        tuple[str, str, datetime | None, dict[str, Any], OfferRedemptionStatus]
    ] = [
        (
            "a",
            "Citizen Scan Alpha",
            now - timedelta(hours=1),
            {
                "audit": {
                    "event": "redemption_success",
                    "redeemed_by_user_id": str(uuid.uuid4()),
                    "organization_id": str(org.id),
                    "client_ip": "127.0.0.1",
                    "at": now.isoformat(),
                }
            },
            OfferRedemptionStatus.COMPLETED,
        ),
        (
            "b",
            "Citizen Self Beta",
            now - timedelta(hours=3),
            {},
            OfferRedemptionStatus.COMPLETED,
        ),
        (
            "c",
            "Citizen Pending Gamma",
            None,
            {},
            OfferRedemptionStatus.PENDING,
        ),
    ]

    passport_numbers: list[str] = []
    emails: list[str] = []
    display_names: list[str] = []

    for spec_suffix, display_name, redeemed_at, metadata, status in passport_specs:
        passport, user = await _create_passport_with_user(
            session,
            suffix=f"{suffix}-{spec_suffix}",
            display_name=display_name,
        )
        passport_numbers.append(passport.passport_number)
        emails.append(user.email)
        display_names.append(display_name)
        session.add(
            PassportOfferRedemption(
                passport_id=passport.id,
                partner_offer_id=offer.id,
                status=status,
                redeemed_at=redeemed_at,
                metadata_=metadata,
            )
        )

    return OfferRedemptionFixtureIds(
        offer_id=offer.id,
        passport_numbers=tuple(passport_numbers),
        emails=tuple(emails),
        display_names=tuple(display_names),
    )


@pytest.fixture
async def offer_redemption_fixture() -> OfferRedemptionFixtureIds:
    factory = await _session_factory()
    async with factory() as session:
        ids = await _seed_offer_redemption_fixture(session)
        await session.commit()
        return ids


def _redemptions_url(offer_id: uuid.UUID) -> str:
    return f"{BASE}/{offer_id}/redemptions"


@pytest.mark.asyncio
async def test_moderator_can_list_offer_redemptions(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    offer_redemption_fixture: OfferRedemptionFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _redemptions_url(offer_redemption_fixture.offer_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3
    assert data["page"] == 1
    assert data["page_size"] == 20


@pytest.mark.asyncio
async def test_user_denied_offer_redemptions(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    offer_redemption_fixture: OfferRedemptionFixtureIds,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.get(
        _redemptions_url(offer_redemption_fixture.offer_id),
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_partner_user_denied_offer_redemptions(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    offer_redemption_fixture: OfferRedemptionFixtureIds,
) -> None:
    """Organization member without staff permissions — same as plain USER."""
    partner_user = await rbac_user_factory()
    response = await auth_client.get(
        _redemptions_url(offer_redemption_fixture.offer_id),
        headers=auth_header(partner_user.access_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_unknown_offer_redemptions_not_found(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _redemptions_url(uuid.uuid4()),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 404
    assert response.json()["code"] == "OFFER_NOT_FOUND"


@pytest.mark.asyncio
async def test_offer_redemptions_pagination(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    offer_redemption_fixture: OfferRedemptionFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _redemptions_url(offer_redemption_fixture.offer_id),
        params={"page": 1, "page_size": 2},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total"] == 3
    assert len(data["items"]) == 2
    assert data["page_size"] == 2


@pytest.mark.asyncio
async def test_offer_redemptions_sorted_by_redeemed_at_desc(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    offer_redemption_fixture: OfferRedemptionFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _redemptions_url(offer_redemption_fixture.offer_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    items = response.json()["items"]
    redeemed_at_values = [item["redeemed_at"] for item in items if item["redeemed_at"] is not None]
    assert redeemed_at_values == sorted(redeemed_at_values, reverse=True)
    assert items[0]["citizen"]["display_name"] == "Citizen Scan Alpha"


@pytest.mark.asyncio
async def test_offer_redemption_includes_passport_number(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    offer_redemption_fixture: OfferRedemptionFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _redemptions_url(offer_redemption_fixture.offer_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    passport_numbers = {item["passport"]["passport_number"] for item in response.json()["items"]}
    assert set(offer_redemption_fixture.passport_numbers) == passport_numbers


@pytest.mark.asyncio
async def test_offer_redemption_includes_citizen_email(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    offer_redemption_fixture: OfferRedemptionFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _redemptions_url(offer_redemption_fixture.offer_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    emails = {item["citizen"]["email"] for item in response.json()["items"]}
    assert set(offer_redemption_fixture.emails) == emails


@pytest.mark.asyncio
async def test_offer_redemption_includes_citizen_display_name(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    offer_redemption_fixture: OfferRedemptionFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _redemptions_url(offer_redemption_fixture.offer_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    display_names = {item["citizen"]["display_name"] for item in response.json()["items"]}
    assert set(offer_redemption_fixture.display_names) == display_names


@pytest.mark.asyncio
async def test_offer_redemption_includes_channel(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    offer_redemption_fixture: OfferRedemptionFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _redemptions_url(offer_redemption_fixture.offer_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    channels = {item["channel"] for item in response.json()["items"]}
    assert channels == {"scan", "self", "unknown"}


@pytest.mark.asyncio
async def test_offer_redemption_includes_status(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    offer_redemption_fixture: OfferRedemptionFixtureIds,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _redemptions_url(offer_redemption_fixture.offer_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    statuses = {item["status"] for item in response.json()["items"]}
    assert statuses == {"completed", "pending"}
