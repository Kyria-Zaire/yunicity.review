"""Admin passport ops staff actions API tests (ADMIN-03B)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime

import pytest
from app.core.passport_constants import PassportStatus, PassportTierCode
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from app.models.passport import Passport, PassportTier
from app.models.passport_admin_action import PassportAdminAction
from app.models.user import User
from app.models.user_profile import UserProfile
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/passports"


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


async def _seed_active_passport(session: AsyncSession) -> tuple[Passport, str]:
    suffix = uuid.uuid4().hex[:8]
    user = User(
        email=f"passport-action-{suffix}@example.com",
        hashed_password="hashed",
        full_name="Citizen Action",
        city="Reims",
    )
    session.add(user)
    await session.flush()
    session.add(
        UserProfile(
            user_id=user.id,
            username=f"act{suffix}"[:30],
            display_name=f"Citizen {suffix}",
            city="Reims",
        )
    )
    tier = await _get_basic_tier(session)
    passport = Passport(
        user_id=user.id,
        tier_id=tier.id,
        city="Reims",
        passport_number=f"YUN-ACT-{suffix}",
        qr_token=f"qr-action-token-{suffix}-12chars",
        status=PassportStatus.ACTIVE,
        activated_at=datetime.now(UTC),
    )
    session.add(passport)
    await session.flush()
    return passport, passport.qr_token


def _patch_url(passport_id: uuid.UUID) -> str:
    return f"{BASE}/{passport_id}"


def _actions_url(passport_id: uuid.UUID) -> str:
    return f"{BASE}/{passport_id}/actions"


@pytest.mark.asyncio
async def test_moderator_can_suspend_active_passport(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.patch(
        _patch_url(passport_id),
        headers=auth_header(moderator.access_token),
        json={"status": "suspended", "reason": "Signalement abus terrain"},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "suspended"
    assert body["suspended_at"] is not None
    assert body["qr_token"]


@pytest.mark.asyncio
async def test_regular_user_denied_patch(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    user = await rbac_user_factory()
    response = await auth_client.patch(
        _patch_url(passport_id),
        headers=auth_header(user.access_token),
        json={"status": "suspended", "reason": "Tentative non autorisée"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_suspend_creates_audit_with_actor(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.patch(
        _patch_url(passport_id),
        headers=auth_header(moderator.access_token),
        json={"status": "suspended", "reason": "Audit trail test suspend"},
    )
    assert response.status_code == 200

    async with factory() as session:
        action = await session.scalar(
            select(PassportAdminAction)
            .where(PassportAdminAction.passport_id == passport_id)
            .order_by(PassportAdminAction.created_at.desc())
            .limit(1)
        )
        assert action is not None
        assert action.action == "suspend"
        assert action.actor_user_id == moderator.user_id
        assert action.previous_status == PassportStatus.ACTIVE.value
        assert action.new_status == PassportStatus.SUSPENDED.value
        assert action.reason == "Audit trail test suspend"


@pytest.mark.asyncio
async def test_moderator_can_reactivate_suspended_passport(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    moderator = await rbac_user_factory("MODERATOR")
    suspend = await auth_client.patch(
        _patch_url(passport_id),
        headers=auth_header(moderator.access_token),
        json={"status": "suspended", "reason": "Suspension temporaire test"},
    )
    assert suspend.status_code == 200

    reactivate = await auth_client.patch(
        _patch_url(passport_id),
        headers=auth_header(moderator.access_token),
        json={"status": "active", "reason": "Réactivation après enquête"},
    )
    assert reactivate.status_code == 200, reactivate.text
    body = reactivate.json()
    assert body["status"] == "active"
    assert body["suspended_at"] is None


@pytest.mark.asyncio
async def test_reactivate_creates_audit(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    moderator = await rbac_user_factory("MODERATOR")
    await auth_client.patch(
        _patch_url(passport_id),
        headers=auth_header(moderator.access_token),
        json={"status": "suspended", "reason": "Suspend for reactivate audit"},
    )
    await auth_client.patch(
        _patch_url(passport_id),
        headers=auth_header(moderator.access_token),
        json={"status": "active", "reason": "Reactivate audit entry"},
    )

    async with factory() as session:
        actions = (
            await session.scalars(
                select(PassportAdminAction)
                .where(PassportAdminAction.passport_id == passport_id)
                .order_by(PassportAdminAction.created_at.asc())
            )
        ).all()
        assert len(actions) == 2
        assert actions[0].action == "suspend"
        assert actions[1].action == "reactivate"
        assert actions[1].previous_status == PassportStatus.SUSPENDED.value
        assert actions[1].new_status == PassportStatus.ACTIVE.value


@pytest.mark.asyncio
async def test_reason_required(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.patch(
        _patch_url(passport_id),
        headers=auth_header(moderator.access_token),
        json={"status": "suspended"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_reason_too_short_rejected(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.patch(
        _patch_url(passport_id),
        headers=auth_header(moderator.access_token),
        json={"status": "suspended", "reason": "ab"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_revoked_status_in_payload_rejected(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.patch(
        _patch_url(passport_id),
        headers=auth_header(moderator.access_token),
        json={"status": "revoked", "reason": "Tentative révocation"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patch_revoked_passport_in_db_rejected(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        passport.status = PassportStatus.REVOKED
        await session.commit()
        passport_id = passport.id

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.patch(
        _patch_url(passport_id),
        headers=auth_header(moderator.access_token),
        json={"status": "active", "reason": "Tentative réactivation révoqué"},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "PASSPORT_STATUS_NOT_MUTABLE"


@pytest.mark.asyncio
async def test_no_op_active_to_active_rejected(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.patch(
        _patch_url(passport_id),
        headers=auth_header(moderator.access_token),
        json={"status": "active", "reason": "No-op active"},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "PASSPORT_STATUS_UNCHANGED"


@pytest.mark.asyncio
async def test_no_op_suspended_to_suspended_rejected(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    moderator = await rbac_user_factory("MODERATOR")
    await auth_client.patch(
        _patch_url(passport_id),
        headers=auth_header(moderator.access_token),
        json={"status": "suspended", "reason": "First suspend"},
    )
    response = await auth_client.patch(
        _patch_url(passport_id),
        headers=auth_header(moderator.access_token),
        json={"status": "suspended", "reason": "Second suspend no-op"},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "PASSPORT_STATUS_UNCHANGED"


@pytest.mark.asyncio
async def test_suspended_passport_not_resolved_by_scan(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, qr_token = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    moderator = await rbac_user_factory("MODERATOR")
    suspend = await auth_client.patch(
        _patch_url(passport_id),
        headers=auth_header(moderator.access_token),
        json={"status": "suspended", "reason": "Blocage scan test"},
    )
    assert suspend.status_code == 200

    partner = await rbac_user_factory()
    resolve = await auth_client.post(
        "/api/v1/scan/resolve",
        json={"qr_secret": qr_token},
        headers=auth_header(partner.access_token),
    )
    assert resolve.status_code == 404
    assert resolve.json()["code"] == "PASSPORT_NOT_FOUND"


@pytest.mark.asyncio
async def test_moderator_can_list_passport_actions(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    response = await auth_client.get(
        _actions_url(passport_id),
        headers=auth_header((await rbac_user_factory("MODERATOR")).access_token),
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["items"] == []
    assert body["total"] == 0
    assert body["page"] == 1
    assert body["page_size"] == 20


@pytest.mark.asyncio
async def test_regular_user_denied_list_actions(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    user = await rbac_user_factory()
    response = await auth_client.get(
        _actions_url(passport_id),
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_actions_are_paginated(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    moderator = await rbac_user_factory("MODERATOR")
    headers = auth_header(moderator.access_token)
    for index in range(3):
        await auth_client.patch(
            _patch_url(passport_id),
            headers=headers,
            json={
                "status": "suspended" if index % 2 == 0 else "active",
                "reason": f"Audit pagination {index}",
            },
        )

    page1 = await auth_client.get(
        f"{_actions_url(passport_id)}?page=1&page_size=2",
        headers=headers,
    )
    assert page1.status_code == 200, page1.text
    body1 = page1.json()
    assert body1["total"] == 3
    assert len(body1["items"]) == 2
    assert body1["page"] == 1
    assert body1["page_size"] == 2

    page2 = await auth_client.get(
        f"{_actions_url(passport_id)}?page=2&page_size=2",
        headers=headers,
    )
    assert page2.status_code == 200
    assert len(page2.json()["items"]) == 1


@pytest.mark.asyncio
async def test_actions_sorted_desc_by_created_at(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    moderator = await rbac_user_factory("MODERATOR")
    headers = auth_header(moderator.access_token)
    await auth_client.patch(
        _patch_url(passport_id),
        headers=headers,
        json={"status": "suspended", "reason": "First suspend for sort"},
    )
    await auth_client.patch(
        _patch_url(passport_id),
        headers=headers,
        json={"status": "active", "reason": "Reactivate for sort"},
    )

    response = await auth_client.get(_actions_url(passport_id), headers=headers)
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 2
    assert items[0]["action"] == "reactivate"
    assert items[1]["action"] == "suspend"
    assert items[0]["created_at"] >= items[1]["created_at"]


@pytest.mark.asyncio
async def test_get_actions_after_suspend_contains_suspend(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    moderator = await rbac_user_factory("MODERATOR")
    headers = auth_header(moderator.access_token)
    suspend = await auth_client.patch(
        _patch_url(passport_id),
        headers=headers,
        json={"status": "suspended", "reason": "Visible in audit list"},
    )
    assert suspend.status_code == 200

    response = await auth_client.get(_actions_url(passport_id), headers=headers)
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["action"] == "suspend"
    assert items[0]["previous_status"] == PassportStatus.ACTIVE.value
    assert items[0]["new_status"] == PassportStatus.SUSPENDED.value
    assert items[0]["reason"] == "Visible in audit list"


@pytest.mark.asyncio
async def test_get_actions_after_reactivate_contains_reactivate(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    moderator = await rbac_user_factory("MODERATOR")
    headers = auth_header(moderator.access_token)
    await auth_client.patch(
        _patch_url(passport_id),
        headers=headers,
        json={"status": "suspended", "reason": "Before reactivate audit read"},
    )
    await auth_client.patch(
        _patch_url(passport_id),
        headers=headers,
        json={"status": "active", "reason": "Reactivate visible in audit"},
    )

    response = await auth_client.get(_actions_url(passport_id), headers=headers)
    assert response.status_code == 200
    items = response.json()["items"]
    assert items[0]["action"] == "reactivate"
    assert items[0]["previous_status"] == PassportStatus.SUSPENDED.value
    assert items[0]["new_status"] == PassportStatus.ACTIVE.value
    assert items[0]["reason"] == "Reactivate visible in audit"


@pytest.mark.asyncio
async def test_action_actor_email_and_display_name_present(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        passport, _ = await _seed_active_passport(session)
        await session.commit()
        passport_id = passport.id

    moderator = await rbac_user_factory("MODERATOR")
    headers = auth_header(moderator.access_token)
    await auth_client.patch(
        _patch_url(passport_id),
        headers=headers,
        json={"status": "suspended", "reason": "Actor metadata audit read"},
    )

    response = await auth_client.get(_actions_url(passport_id), headers=headers)
    assert response.status_code == 200
    actor = response.json()["items"][0]["actor_user"]
    assert actor["id"] == str(moderator.user_id)
    assert actor["email"]
    assert actor["display_name"] is not None


@pytest.mark.asyncio
async def test_list_actions_unknown_passport_returns_404(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _actions_url(uuid.uuid4()),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 404
    assert response.json()["code"] == "PASSPORT_NOT_FOUND"
