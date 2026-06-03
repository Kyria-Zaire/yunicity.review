"""Admin organization verification queue API tests (ADMIN-02B1)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

import pytest
from app.core.organization_constants import (
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.partner_constants import PartnershipType, PartnerStatus
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header
from tests.test_organization_api import _create_org

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/organizations"


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> AsyncIterator[None]:
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()
    yield
    if redis is not None:
        await redis.flushdb()


FORBIDDEN_RESPONSE_KEYS = frozenset(
    {
        "rejection_reason",
        "email",
        "phone",
        "created_by_user_id",
        "verified_by_user_id",
        "members",
        "notes_internal",
        "contract_reference",
    }
)


async def _seed_org(
    session: AsyncSession,
    *,
    suffix: str,
    city: str,
    verification_status: VerificationStatus,
    with_partner_profile: bool = False,
    partner_status: PartnerStatus = PartnerStatus.SIGNED,
) -> Organization:
    org = Organization(
        slug=f"admin-org-{suffix}",
        name=f"Org {suffix}",
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


@pytest.mark.asyncio
async def test_moderator_can_list_organizations(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(BASE, headers=auth_header(moderator.access_token))
    assert response.status_code == 200, response.text
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["page"] == 1
    assert data["page_size"] == 20


@pytest.mark.asyncio
async def test_regular_user_forbidden(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.get(BASE, headers=auth_header(user.access_token))
    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_filter_city_reims(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    suffix = uuid.uuid4().hex[:8]
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        reims_org = await _seed_org(
            session,
            suffix=f"reims-{suffix}",
            city="Reims",
            verification_status=VerificationStatus.PENDING,
        )
        lyon_org = await _seed_org(
            session,
            suffix=f"lyon-{suffix}",
            city="Lyon",
            verification_status=VerificationStatus.PENDING,
        )
        reims_id = reims_org.id
        lyon_id = lyon_org.id
        await session.commit()

    response = await auth_client.get(
        f"{BASE}?city=Reims&verification_status=pending",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    ids = {item["id"] for item in response.json()["items"]}
    assert str(reims_id) in ids
    assert str(lyon_id) not in ids


@pytest.mark.asyncio
async def test_filter_verification_status_pending(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    suffix = uuid.uuid4().hex[:8]
    test_city = f"Reims-AdminOrg-{suffix}"
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        pending_org = await _seed_org(
            session,
            suffix=f"pending-{suffix}",
            city=test_city,
            verification_status=VerificationStatus.PENDING,
        )
        verified_org = await _seed_org(
            session,
            suffix=f"verified-{suffix}",
            city=test_city,
            verification_status=VerificationStatus.VERIFIED,
        )
        pending_id = pending_org.id
        verified_id = verified_org.id
        await session.commit()

    response = await auth_client.get(
        f"{BASE}?city={test_city}&verification_status=pending",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    ids = {item["id"] for item in data["items"]}
    assert str(pending_id) in ids
    assert str(verified_id) not in ids
    assert all(item["verification_status"] == "pending" for item in data["items"])


@pytest.mark.asyncio
async def test_pagination_total_page_page_size(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    suffix = uuid.uuid4().hex[:8]
    test_city = f"Reims-AdminOrg-Page-{suffix}"
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        for i in range(3):
            await _seed_org(
                session,
                suffix=f"p{i}-{suffix}",
                city=test_city,
                verification_status=VerificationStatus.PENDING,
            )
        await session.commit()

    response = await auth_client.get(
        f"{BASE}?city={test_city}&verification_status=pending&page=1&page_size=2",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total"] == 3
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert len(data["items"]) == 2

    page2 = await auth_client.get(
        f"{BASE}?city={test_city}&verification_status=pending&page=2&page_size=2",
        headers=auth_header(moderator.access_token),
    )
    assert page2.status_code == 200
    assert len(page2.json()["items"]) == 1


@pytest.mark.asyncio
async def test_organization_without_partner_profile_null_partner_fields(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    suffix = uuid.uuid4().hex[:8]
    test_city = f"Reims-AdminOrg-NoPP-{suffix}"
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await _seed_org(
            session,
            suffix=f"no-pp-{suffix}",
            city=test_city,
            verification_status=VerificationStatus.PENDING,
            with_partner_profile=False,
        )
        org_id = org.id
        await session.commit()

    response = await auth_client.get(
        f"{BASE}?city={test_city}&verification_status=pending",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    row = next(item for item in response.json()["items"] if item["id"] == str(org_id))
    assert row["partner_status"] is None
    assert row["partnership_type"] is None


@pytest.mark.asyncio
async def test_organization_with_partner_profile_returns_partner_fields(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    suffix = uuid.uuid4().hex[:8]
    test_city = f"Reims-AdminOrg-PP-{suffix}"
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await _seed_org(
            session,
            suffix=f"pp-{suffix}",
            city=test_city,
            verification_status=VerificationStatus.VERIFIED,
            with_partner_profile=True,
            partner_status=PartnerStatus.SIGNED,
        )
        org_id = org.id
        await session.commit()

    response = await auth_client.get(
        f"{BASE}?city={test_city}&verification_status=verified",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    row = next(item for item in response.json()["items"] if item["id"] == str(org_id))
    assert row["partner_status"] == "signed"
    assert row["partnership_type"] == "local_business"


@pytest.mark.asyncio
async def test_list_response_excludes_pii_and_internal_fields(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    suffix = uuid.uuid4().hex[:8]
    test_city = f"Reims-AdminOrg-PII-{suffix}"
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await _seed_org(
            session,
            suffix=f"pii-{suffix}",
            city=test_city,
            verification_status=VerificationStatus.REJECTED,
        )
        org.rejection_reason = "Documents incomplets"
        org_id = org.id
        await session.commit()

    response = await auth_client.get(
        f"{BASE}?city={test_city}&verification_status=rejected",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    row = next(item for item in response.json()["items"] if item["id"] == str(org_id))
    assert FORBIDDEN_RESPONSE_KEYS.isdisjoint(row.keys())
    allowed = {
        "id",
        "name",
        "slug",
        "type",
        "city",
        "visibility",
        "verification_status",
        "created_at",
        "updated_at",
        "partner_status",
        "partnership_type",
    }
    assert set(row.keys()) <= allowed


@pytest.mark.asyncio
async def test_review_endpoint_still_works_after_admin_list_exists(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    owner = await rbac_user_factory()
    moderator = await rbac_user_factory("MODERATOR")
    created = await _create_org(auth_client, owner.access_token, suffix="review-regression")
    org_id = created["id"]

    list_response = await auth_client.get(
        f"{BASE}?city=Reims&verification_status=pending",
        headers=auth_header(moderator.access_token),
    )
    assert list_response.status_code == 200

    review_response = await auth_client.post(
        f"/api/v1/organizations/{org_id}/review",
        json={"decision": "verified", "method": "manual"},
        headers=auth_header(moderator.access_token),
    )
    assert review_response.status_code == 200, review_response.text
    assert review_response.json()["verification_status"] == "verified"
