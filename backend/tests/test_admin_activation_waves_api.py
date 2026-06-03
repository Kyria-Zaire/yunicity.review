"""Admin activation waves API tests (ADMIN-02C-B)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta

import pytest
from app.core.activation_wave_constants import (
    CHECKLIST_V1_KEYS,
    ActivationWaveItemStatus,
    ActivationWaveStatus,
    default_activation_checklist,
)
from app.core.organization_constants import (
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.partner_constants import PartnershipType, PartnerStatus
from app.db.seeds.reims_activation_waves import WAVE_1_ID, seed_reims_activation_waves
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from app.models.activation_wave import ActivationWave, ActivationWaveItem
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

WAVES_BASE = "/api/v1/admin/activation-waves"
ITEMS_BASE = "/api/v1/admin/activation-wave-items"


def _wave_detail_url(wave_id: uuid.UUID) -> str:
    return f"{WAVES_BASE}/{wave_id}"


def _item_patch_url(item_id: uuid.UUID) -> str:
    return f"{ITEMS_BASE}/{item_id}"


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


async def _ensure_reims_waves_seeded() -> uuid.UUID:
    factory = await _session_factory()
    async with factory() as session:
        await seed_reims_activation_waves(session)
        await session.commit()
        item = await session.scalar(
            select(ActivationWaveItem)
            .where(ActivationWaveItem.wave_id == WAVE_1_ID)
            .order_by(ActivationWaveItem.sort_order)
            .limit(1)
        )
        assert item is not None
        return item.id


async def _seed_linked_org_and_item(
    session: AsyncSession,
) -> tuple[Organization, PartnerProfile, ActivationWaveItem]:
    suffix = uuid.uuid4().hex[:8]
    org = Organization(
        slug=f"wave-api-{suffix}",
        name=f"Wave API Org {suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PRIVATE,
    )
    session.add(org)
    await session.flush()
    profile = PartnerProfile(
        organization_id=org.id,
        partner_status=PartnerStatus.SIGNED,
        partnership_type=PartnershipType.LOCAL_BUSINESS,
        signed_at=datetime.now(UTC) - timedelta(days=3),
    )
    session.add(profile)
    await session.flush()

    wave = ActivationWave(
        city="Reims",
        code=f"test-wave-{suffix}",
        name=f"Test Wave {suffix}",
        status=ActivationWaveStatus.ACTIVE,
        sort_order=99,
    )
    session.add(wave)
    await session.flush()

    item = ActivationWaveItem(
        wave_id=wave.id,
        organization_id=org.id,
        partner_profile_id=profile.id,
        partner_name_snapshot=org.name,
        partner_slug_snapshot=org.slug,
        status=ActivationWaveItemStatus.CANDIDATE,
        checklist=default_activation_checklist(),
    )
    session.add(item)
    await session.flush()
    return org, profile, item


@pytest.mark.asyncio
async def test_moderator_can_list_waves(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    await _ensure_reims_waves_seeded()
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(WAVES_BASE, headers=auth_header(moderator.access_token))
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) >= 2
    first = body[0]
    assert "items_total" in first
    assert "items_ready" in first
    assert "items_activated" in first


@pytest.mark.asyncio
async def test_regular_user_forbidden_on_list(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.get(WAVES_BASE, headers=auth_header(user.access_token))
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_waves_returns_counts(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    await _ensure_reims_waves_seeded()
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(WAVES_BASE, headers=auth_header(moderator.access_token))
    assert response.status_code == 200
    wave1 = next(row for row in response.json() if row["code"] == "reims-wave-1")
    assert wave1["items_total"] == 4
    assert wave1["items_activated"] >= 0


@pytest.mark.asyncio
async def test_get_wave_detail_ok(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    await _ensure_reims_waves_seeded()
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _wave_detail_url(WAVE_1_ID),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["wave"]["code"] == "reims-wave-1"
    assert len(body["items"]) == 4
    item = body["items"][0]
    assert set(item["checklist"].keys()) == set(CHECKLIST_V1_KEYS)


@pytest.mark.asyncio
async def test_patch_item_notes_ok(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    item_id = await _ensure_reims_waves_seeded()
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.patch(
        _item_patch_url(item_id),
        headers=auth_header(moderator.access_token),
        json={"notes": "Contact relancé — assets en attente."},
    )
    assert response.status_code == 200
    assert response.json()["notes"] == "Contact relancé — assets en attente."


@pytest.mark.asyncio
async def test_patch_item_checklist_ok(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    item_id = await _ensure_reims_waves_seeded()
    moderator = await rbac_user_factory("MODERATOR")
    checklist = {key: key == "contact_confirmed" for key in CHECKLIST_V1_KEYS}
    response = await auth_client.patch(
        _item_patch_url(item_id),
        headers=auth_header(moderator.access_token),
        json={"checklist": checklist},
    )
    assert response.status_code == 200
    assert response.json()["checklist"]["contact_confirmed"] is True
    assert response.json()["checklist"]["qr_ready"] is False


@pytest.mark.asyncio
async def test_patch_item_checklist_rejects_extra_keys(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    item_id = await _ensure_reims_waves_seeded()
    moderator = await rbac_user_factory("MODERATOR")
    checklist = default_activation_checklist()
    checklist["unexpected_flag"] = True
    response = await auth_client.patch(
        _item_patch_url(item_id),
        headers=auth_header(moderator.access_token),
        json={"checklist": checklist},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patch_item_status_ok(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    item_id = await _ensure_reims_waves_seeded()
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.patch(
        _item_patch_url(item_id),
        headers=auth_header(moderator.access_token),
        json={"status": ActivationWaveItemStatus.READY.value},
    )
    assert response.status_code == 200
    assert response.json()["status"] == ActivationWaveItemStatus.READY.value


@pytest.mark.asyncio
async def test_patch_item_status_rejects_invalid_value(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    item_id = await _ensure_reims_waves_seeded()
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.patch(
        _item_patch_url(item_id),
        headers=auth_header(moderator.access_token),
        json={"status": "not_a_real_status"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patch_item_does_not_mutate_partner_profile(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        org, profile, item = await _seed_linked_org_and_item(session)
        await session.commit()
        profile_id = profile.id
        org_id = org.id
        before_status = profile.partner_status
        before_visibility = org.visibility

    moderator = await rbac_user_factory("MODERATOR")
    checklist = {key: True for key in CHECKLIST_V1_KEYS}
    response = await auth_client.patch(
        _item_patch_url(item.id),
        headers=auth_header(moderator.access_token),
        json={
            "status": ActivationWaveItemStatus.ACTIVATED.value,
            "checklist": checklist,
            "notes": "Prêt côté ops",
        },
    )
    assert response.status_code == 200

    async with factory() as session:
        profile_after = await session.get(PartnerProfile, profile_id)
        org_after = await session.get(Organization, org_id)
        assert profile_after is not None
        assert org_after is not None
        assert profile_after.partner_status == before_status
        assert org_after.visibility == before_visibility


@pytest.mark.asyncio
async def test_patch_item_does_not_create_partner_profile(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    item_id = await _ensure_reims_waves_seeded()
    factory = await _session_factory()
    async with factory() as session:
        count_before = len((await session.execute(select(PartnerProfile))).scalars().all())

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.patch(
        _item_patch_url(item_id),
        headers=auth_header(moderator.access_token),
        json={"notes": "Note ops seulement"},
    )
    assert response.status_code == 200

    async with factory() as session:
        count_after = len((await session.execute(select(PartnerProfile))).scalars().all())
    assert count_before == count_after


@pytest.mark.asyncio
async def test_patch_item_does_not_create_organization(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    item_id = await _ensure_reims_waves_seeded()
    factory = await _session_factory()
    async with factory() as session:
        count_before = len((await session.execute(select(Organization))).scalars().all())

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.patch(
        _item_patch_url(item_id),
        headers=auth_header(moderator.access_token),
        json={"status": "ready"},
    )
    assert response.status_code == 200

    async with factory() as session:
        count_after = len((await session.execute(select(Organization))).scalars().all())
    assert count_before == count_after
