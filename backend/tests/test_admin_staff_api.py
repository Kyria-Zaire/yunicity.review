"""Admin staff management API tests (ADMIN-08B)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

import pytest
from app.core.errors import AppError
from app.core.staff_admin_constants import StaffAdminActionType
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from app.models.rbac import Role, UserRole
from app.models.staff_admin_action import StaffAdminAction
from app.models.user import User
from app.repositories.admin_staff_repository import AdminStaffRepository
from app.services.admin_staff_service import AdminStaffService
from httpx import AsyncClient
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, assign_roles, auth_header, register_user

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/staff"


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


async def _create_staff_target(auth_client: AsyncClient) -> uuid.UUID:
    user = await register_user(
        auth_client,
        email=f"staff-target-{uuid.uuid4().hex[:8]}@example.com",
    )
    await assign_roles(user.user_id, "MODERATOR")
    return user.user_id


async def _isolate_single_super_admin(keep_user_id: uuid.UUID) -> None:
    factory = await _session_factory()
    async with factory() as session:
        role_result = await session.execute(select(Role).where(Role.key == "SUPER_ADMIN"))
        role = role_result.scalar_one()
        await session.execute(
            delete(UserRole).where(
                UserRole.role_id == role.id,
                UserRole.user_id != keep_user_id,
            )
        )
        await session.commit()


async def _get_user(user_id: uuid.UUID) -> User:
    factory = await _session_factory()
    async with factory() as session:
        user = await AdminStaffRepository(session).get_user_by_id(user_id)
        assert user is not None
        return user


async def _audit_actions(target_user_id: uuid.UUID) -> list[StaffAdminAction]:
    factory = await _session_factory()
    async with factory() as session:
        result = await session.execute(
            select(StaffAdminAction)
            .where(StaffAdminAction.target_user_id == target_user_id)
            .order_by(StaffAdminAction.created_at.asc())
        )
        return list(result.scalars().all())


async def test_super_admin_can_list_staff(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    await _create_staff_target(auth_client)
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.get(BASE, headers=auth_header(super_admin.access_token))
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1
    assert "hashed_password" not in response.text


async def test_moderator_cannot_list_staff(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(BASE, headers=auth_header(moderator.access_token))
    assert response.status_code == 403


async def test_get_staff_detail_ok(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    target_id = await _create_staff_target(auth_client)
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.get(
        f"{BASE}/{target_id}",
        headers=auth_header(super_admin.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["id"] == str(target_id)
    assert "MODERATOR" in data["roles"]
    assert "system.admin" not in data["permissions"]
    assert "hashed_password" not in response.text


async def test_assign_role_ok(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await register_user(auth_client, email=f"promote-{uuid.uuid4().hex[:8]}@example.com")
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.post(
        f"{BASE}/{user.user_id}/roles",
        json={"role": "MODERATOR", "reason": "Promotion modération."},
        headers=auth_header(super_admin.access_token),
    )
    assert response.status_code == 200, response.text
    assert "MODERATOR" in response.json()["roles"]


async def test_assign_duplicate_role_rejected(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    target_id = await _create_staff_target(auth_client)
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.post(
        f"{BASE}/{target_id}/roles",
        json={"role": "MODERATOR"},
        headers=auth_header(super_admin.access_token),
    )
    assert response.status_code == 409
    assert response.json()["code"] == "STAFF_ROLE_ALREADY_ASSIGNED"


async def test_revoke_role_ok(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await register_user(auth_client, email=f"revoke-{uuid.uuid4().hex[:8]}@example.com")
    await assign_roles(user.user_id, "MODERATOR", "CITY_ADMIN")
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.delete(
        f"{BASE}/{user.user_id}/roles/CITY_ADMIN",
        headers=auth_header(super_admin.access_token),
    )
    assert response.status_code == 200, response.text
    assert "CITY_ADMIN" not in response.json()["roles"]
    assert "MODERATOR" in response.json()["roles"]


async def test_revoke_missing_role_rejected(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    target_id = await _create_staff_target(auth_client)
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.delete(
        f"{BASE}/{target_id}/roles/SUPER_ADMIN",
        headers=auth_header(super_admin.access_token),
    )
    assert response.status_code == 404
    assert response.json()["code"] == "STAFF_ROLE_NOT_ASSIGNED"


async def test_self_assign_forbidden(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.post(
        f"{BASE}/{super_admin.user_id}/roles",
        json={"role": "CITY_ADMIN"},
        headers=auth_header(super_admin.access_token),
    )
    assert response.status_code == 403
    assert response.json()["code"] == "STAFF_SELF_MODIFY_FORBIDDEN"


async def test_self_revoke_forbidden(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.delete(
        f"{BASE}/{super_admin.user_id}/roles/SUPER_ADMIN",
        headers=auth_header(super_admin.access_token),
    )
    assert response.status_code == 403
    assert response.json()["code"] == "STAFF_SELF_MODIFY_FORBIDDEN"


async def test_suspend_ok(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    target_id = await _create_staff_target(auth_client)
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.post(
        f"{BASE}/{target_id}/suspend",
        json={"reason": "Suspension test."},
        headers=auth_header(super_admin.access_token),
    )
    assert response.status_code == 200, response.text
    assert response.json()["is_active"] is False


async def test_self_suspend_forbidden(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.post(
        f"{BASE}/{super_admin.user_id}/suspend",
        json={"reason": "Auto-suspension."},
        headers=auth_header(super_admin.access_token),
    )
    assert response.status_code == 403
    assert response.json()["code"] == "STAFF_SELF_MODIFY_FORBIDDEN"


async def test_reactivate_ok(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await register_user(auth_client, email=f"reactivate-{uuid.uuid4().hex[:8]}@example.com")
    await assign_roles(user.user_id, "MODERATOR")
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    suspended = await auth_client.post(
        f"{BASE}/{user.user_id}/suspend",
        json={"reason": "Pause temporaire."},
        headers=auth_header(super_admin.access_token),
    )
    assert suspended.status_code == 200

    response = await auth_client.post(
        f"{BASE}/{user.user_id}/reactivate",
        json={"reason": "Retour service."},
        headers=auth_header(super_admin.access_token),
    )
    assert response.status_code == 200, response.text
    assert response.json()["is_active"] is True


async def test_cannot_revoke_last_system_admin(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    _ = auth_client
    target = await rbac_user_factory("SUPER_ADMIN")
    actor = await rbac_user_factory("SUPER_ADMIN")
    await _isolate_single_super_admin(target.user_id)
    actor_user = await _get_user(actor.user_id)
    target_user = await _get_user(target.user_id)

    factory = await _session_factory()
    async with factory() as session:
        service = AdminStaffService(session)
        with pytest.raises(AppError) as exc_info:
            await service.revoke_role(actor_user, target.user_id, role_key="SUPER_ADMIN")
        assert exc_info.value.code == "STAFF_LAST_SYSTEM_ADMIN"
        await session.rollback()

    assert target_user.is_active is True


async def test_cannot_suspend_last_system_admin(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    _ = auth_client
    target = await rbac_user_factory("SUPER_ADMIN")
    actor = await rbac_user_factory("SUPER_ADMIN")
    await _isolate_single_super_admin(target.user_id)
    actor_user = await _get_user(actor.user_id)

    factory = await _session_factory()
    async with factory() as session:
        service = AdminStaffService(session)
        with pytest.raises(AppError) as exc_info:
            await service.suspend_user(actor_user, target.user_id, reason="Blocage système.")
        assert exc_info.value.code == "STAFF_LAST_SYSTEM_ADMIN"
        await session.rollback()


async def test_audit_written_on_assign(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await register_user(
        auth_client,
        email=f"audit-assign-{uuid.uuid4().hex[:8]}@example.com",
    )
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.post(
        f"{BASE}/{user.user_id}/roles",
        json={"role": "MODERATOR", "reason": "Audit assign."},
        headers=auth_header(super_admin.access_token),
    )
    assert response.status_code == 200
    actions = await _audit_actions(user.user_id)
    assert any(action.action == StaffAdminActionType.ASSIGN_ROLE.value for action in actions)


async def test_audit_written_on_revoke(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await register_user(
        auth_client,
        email=f"audit-revoke-{uuid.uuid4().hex[:8]}@example.com",
    )
    await assign_roles(user.user_id, "MODERATOR", "CITY_ADMIN")
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.delete(
        f"{BASE}/{user.user_id}/roles/CITY_ADMIN",
        headers=auth_header(super_admin.access_token),
    )
    assert response.status_code == 200
    actions = await _audit_actions(user.user_id)
    assert any(action.action == StaffAdminActionType.REVOKE_ROLE.value for action in actions)


async def test_audit_written_on_suspend(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    target_id = await _create_staff_target(auth_client)
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.post(
        f"{BASE}/{target_id}/suspend",
        json={"reason": "Audit suspend."},
        headers=auth_header(super_admin.access_token),
    )
    assert response.status_code == 200
    actions = await _audit_actions(target_id)
    assert any(action.action == StaffAdminActionType.SUSPEND.value for action in actions)


async def test_audit_written_on_reactivate(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await register_user(auth_client, email=f"audit-react-{uuid.uuid4().hex[:8]}@example.com")
    await assign_roles(user.user_id, "MODERATOR")
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    await auth_client.post(
        f"{BASE}/{user.user_id}/suspend",
        json={"reason": "Pause."},
        headers=auth_header(super_admin.access_token),
    )
    response = await auth_client.post(
        f"{BASE}/{user.user_id}/reactivate",
        json={"reason": "Retour."},
        headers=auth_header(super_admin.access_token),
    )
    assert response.status_code == 200
    actions = await _audit_actions(user.user_id)
    assert any(action.action == StaffAdminActionType.REACTIVATE.value for action in actions)


async def test_list_staff_actions_ok(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await register_user(auth_client, email=f"actions-{uuid.uuid4().hex[:8]}@example.com")
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    await auth_client.post(
        f"{BASE}/{user.user_id}/roles",
        json={"role": "MODERATOR", "reason": "Pour audit."},
        headers=auth_header(super_admin.access_token),
    )
    response = await auth_client.get(
        f"{BASE}/{user.user_id}/actions",
        headers=auth_header(super_admin.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total"] >= 1
    item = data["items"][0]
    assert item["action"] == StaffAdminActionType.ASSIGN_ROLE.value
    assert item["actor_user"]["email"]
    assert "metadata" not in item


async def test_hashed_password_not_exposed(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    target_id = await _create_staff_target(auth_client)
    super_admin = await rbac_user_factory("SUPER_ADMIN")
    endpoints = [
        ("GET", BASE, None),
        ("GET", f"{BASE}/{target_id}", None),
        ("GET", f"{BASE}/{target_id}/actions", None),
    ]
    for method, url, body in endpoints:
        if method == "GET":
            response = await auth_client.get(url, headers=auth_header(super_admin.access_token))
        else:
            response = await auth_client.post(
                url,
                json=body,
                headers=auth_header(super_admin.access_token),
            )
        assert response.status_code == 200, response.text
        assert "hashed_password" not in response.text.lower()
