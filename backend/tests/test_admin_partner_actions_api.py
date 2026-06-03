"""Admin partner staff actions API tests (ADMIN-02D3A)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta

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
from app.models.partner_admin_action import PartnerAdminAction
from app.models.partner_profile import PartnerProfile
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/partners"


def _detail_url(organization_id: uuid.UUID) -> str:
    return f"{BASE}/{organization_id}"


def _profile_url(organization_id: uuid.UUID) -> str:
    return f"{BASE}/{organization_id}/profile"


def _activate_url(organization_id: uuid.UUID) -> str:
    return f"{BASE}/{organization_id}/activate"


def _pause_url(organization_id: uuid.UUID) -> str:
    return f"{BASE}/{organization_id}/pause"


def _premium_url(organization_id: uuid.UUID) -> str:
    return f"{BASE}/{organization_id}/upgrade-premium"


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> AsyncIterator[None]:
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()
    yield
    if redis is not None:
        await redis.flushdb()


async def _seed_org(
    session: AsyncSession,
    *,
    suffix: str,
    verification_status: VerificationStatus = VerificationStatus.VERIFIED,
    visibility: OrganizationVisibility = OrganizationVisibility.PRIVATE,
    with_partner_profile: bool = False,
    partner_status: PartnerStatus = PartnerStatus.SIGNED,
    activated_at: datetime | None = None,
) -> Organization:
    org = Organization(
        slug=f"admin-action-{suffix}",
        name=f"Partner Action {suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=verification_status,
        visibility=visibility,
    )
    session.add(org)
    await session.flush()
    if with_partner_profile:
        session.add(
            PartnerProfile(
                organization_id=org.id,
                partner_status=partner_status,
                partnership_type=PartnershipType.LOCAL_BUSINESS,
                signed_at=datetime.now(UTC) - timedelta(days=5),
                activated_at=activated_at,
            )
        )
    return org


async def _audit_count(session: AsyncSession, organization_id: uuid.UUID) -> int:
    result = await session.execute(
        select(func.count())
        .select_from(PartnerAdminAction)
        .where(PartnerAdminAction.organization_id == organization_id)
    )
    return int(result.scalar_one() or 0)


async def _latest_audit(session: AsyncSession, organization_id: uuid.UUID) -> PartnerAdminAction:
    result = await session.execute(
        select(PartnerAdminAction)
        .where(PartnerAdminAction.organization_id == organization_id)
        .order_by(PartnerAdminAction.created_at.desc())
        .limit(1)
    )
    row = result.scalar_one()
    return row


@pytest.mark.asyncio
async def test_regular_user_forbidden_on_create_profile(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.post(
        _profile_url(uuid.uuid4()),
        headers=auth_header(user.access_token),
        json={},
    )
    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_moderator_can_create_profile(
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
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.post(
        _profile_url(org_id),
        headers=auth_header(moderator.access_token),
        json={"partnership_type": "restaurant", "public_partner_label": "Brasserie test"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["partner_profile"]["partner_status"] == PartnerStatus.SIGNED.value
    assert data["partner_profile"]["partnership_type"] == PartnershipType.RESTAURANT.value
    assert data["partner_profile"]["is_featured"] is False
    assert data["capabilities"]["can_activate"] is True

    async with factory() as session:
        assert await _audit_count(session, org_id) == 1
        audit = await _latest_audit(session, org_id)
        assert audit.action == "create_profile"
        assert audit.actor_user_id == moderator.user_id
        assert audit.new_status == PartnerStatus.SIGNED.value


@pytest.mark.asyncio
async def test_create_profile_rejected_if_org_not_verified(
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
            verification_status=VerificationStatus.PENDING,
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.post(
        _profile_url(org_id),
        headers=auth_header(moderator.access_token),
        json={},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "ORGANIZATION_NOT_VERIFIED"


@pytest.mark.asyncio
async def test_create_profile_rejected_if_profile_exists(
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

    response = await auth_client.post(
        _profile_url(org_id),
        headers=auth_header(moderator.access_token),
        json={},
    )
    assert response.status_code == 409
    assert response.json()["code"] == "PARTNER_PROFILE_ALREADY_EXISTS"


@pytest.mark.asyncio
async def test_signed_to_active_sets_activated_at(
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

    response = await auth_client.post(
        _activate_url(org_id),
        headers=auth_header(moderator.access_token),
        json={},
    )
    assert response.status_code == 200, response.text
    profile = response.json()["partner_profile"]
    assert profile["partner_status"] == PartnerStatus.ACTIVE.value
    assert profile["activated_at"] is not None

    async with factory() as session:
        audit = await _latest_audit(session, org_id)
        assert audit.action == "activate"
        assert audit.previous_status == PartnerStatus.SIGNED.value
        assert audit.new_status == PartnerStatus.ACTIVE.value
        assert audit.actor_user_id == moderator.user_id


@pytest.mark.asyncio
async def test_paused_to_active_preserves_activated_at(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    suffix = uuid.uuid4().hex[:8]
    original_activated = datetime(2025, 12, 1, 12, 0, 0, tzinfo=UTC)
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await _seed_org(
            session,
            suffix=suffix,
            with_partner_profile=True,
            partner_status=PartnerStatus.PAUSED,
            activated_at=original_activated,
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.post(
        _activate_url(org_id),
        headers=auth_header(moderator.access_token),
        json={},
    )
    assert response.status_code == 200, response.text
    activated_at = response.json()["partner_profile"]["activated_at"]
    assert activated_at is not None
    assert activated_at.startswith("2025-12-01")


@pytest.mark.asyncio
async def test_activate_rejected_if_org_not_verified(
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
            verification_status=VerificationStatus.PENDING,
            with_partner_profile=True,
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.post(
        _activate_url(org_id),
        headers=auth_header(moderator.access_token),
        json={},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "ORGANIZATION_NOT_VERIFIED"


@pytest.mark.asyncio
async def test_activate_rejected_without_profile(
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

    response = await auth_client.post(
        _activate_url(org_id),
        headers=auth_header(moderator.access_token),
        json={},
    )
    assert response.status_code == 404
    assert response.json()["code"] == "PARTNER_PROFILE_NOT_FOUND"


@pytest.mark.asyncio
async def test_active_to_paused_ok(
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
            visibility=OrganizationVisibility.PUBLIC,
            with_partner_profile=True,
            partner_status=PartnerStatus.ACTIVE,
            activated_at=datetime.now(UTC),
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.post(
        _pause_url(org_id),
        headers=auth_header(moderator.access_token),
        json={},
    )
    assert response.status_code == 200, response.text
    assert response.json()["partner_profile"]["partner_status"] == PartnerStatus.PAUSED.value
    assert response.json()["organization"]["visibility"] == OrganizationVisibility.PUBLIC.value


@pytest.mark.asyncio
async def test_premium_to_paused_ok(
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
            partner_status=PartnerStatus.PREMIUM,
            activated_at=datetime.now(UTC),
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.post(
        _pause_url(org_id),
        headers=auth_header(moderator.access_token),
        json={},
    )
    assert response.status_code == 200, response.text
    assert response.json()["partner_profile"]["partner_status"] == PartnerStatus.PAUSED.value


@pytest.mark.asyncio
async def test_active_to_premium_ok(
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
            activated_at=datetime.now(UTC),
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.post(
        _premium_url(org_id),
        headers=auth_header(moderator.access_token),
        json={},
    )
    assert response.status_code == 200, response.text
    assert response.json()["partner_profile"]["partner_status"] == PartnerStatus.PREMIUM.value

    async with factory() as session:
        audit = await _latest_audit(session, org_id)
        assert audit.action == "upgrade_premium"
        assert audit.previous_status == PartnerStatus.ACTIVE.value
        assert audit.new_status == PartnerStatus.PREMIUM.value


@pytest.mark.asyncio
async def test_signed_to_premium_rejected(
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

    response = await auth_client.post(
        _premium_url(org_id),
        headers=auth_header(moderator.access_token),
        json={},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_PARTNER_STATUS_TRANSITION"


@pytest.mark.asyncio
async def test_paused_to_premium_rejected(
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
            partner_status=PartnerStatus.PAUSED,
            activated_at=datetime.now(UTC),
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.post(
        _premium_url(org_id),
        headers=auth_header(moderator.access_token),
        json={},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_PARTNER_STATUS_TRANSITION"


@pytest.mark.asyncio
async def test_patch_public_visibility_rejected_if_not_verified(
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
            verification_status=VerificationStatus.PENDING,
            with_partner_profile=True,
            partner_status=PartnerStatus.ACTIVE,
            activated_at=datetime.now(UTC),
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.patch(
        _detail_url(org_id),
        headers=auth_header(moderator.access_token),
        json={"visibility": "public"},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "ORGANIZATION_NOT_VERIFIED"


@pytest.mark.asyncio
async def test_patch_public_visibility_ok_if_verified(
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
            activated_at=datetime.now(UTC),
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.patch(
        _detail_url(org_id),
        headers=auth_header(moderator.access_token),
        json={"visibility": "public"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["organization"]["visibility"] == OrganizationVisibility.PUBLIC.value

    async with factory() as session:
        audit = await _latest_audit(session, org_id)
        assert audit.action == "update_settings"
        assert audit.previous_visibility == OrganizationVisibility.PRIVATE.value
        assert audit.new_visibility == OrganizationVisibility.PUBLIC.value


@pytest.mark.asyncio
async def test_patch_featured_rejected_for_signed(
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

    response = await auth_client.patch(
        _detail_url(org_id),
        headers=auth_header(moderator.access_token),
        json={"is_featured": True},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "FEATURED_REQUIRES_ACTIVE_PARTNER"


@pytest.mark.asyncio
async def test_patch_featured_ok_for_active(
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
            activated_at=datetime.now(UTC),
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.patch(
        _detail_url(org_id),
        headers=auth_header(moderator.access_token),
        json={"is_featured": True},
    )
    assert response.status_code == 200, response.text
    assert response.json()["partner_profile"]["is_featured"] is True


@pytest.mark.asyncio
async def test_patch_partner_status_field_rejected(
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
            activated_at=datetime.now(UTC),
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.patch(
        _detail_url(org_id),
        headers=auth_header(moderator.access_token),
        json={"partner_status": "premium"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_capabilities_after_full_activation_flow(
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

    await auth_client.post(
        _profile_url(org_id),
        headers=auth_header(moderator.access_token),
        json={},
    )
    await auth_client.post(
        _activate_url(org_id),
        headers=auth_header(moderator.access_token),
        json={},
    )

    detail = await auth_client.get(
        _detail_url(org_id),
        headers=auth_header(moderator.access_token),
    )
    caps = detail.json()["capabilities"]
    assert caps["can_create_profile"] is False
    assert caps["can_activate"] is False
    assert caps["can_pause"] is True
    assert caps["can_upgrade_premium"] is True
    assert caps["can_update_settings"] is True

    async with factory() as session:
        assert await _audit_count(session, org_id) == 2
