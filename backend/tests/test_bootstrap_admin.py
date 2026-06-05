"""Bootstrap admin account tests (PLATFORM-AUTH-RECOVERY-01)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

import pytest
from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.security import verify_password
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from app.models.user import User
from app.repositories.rbac_repository import RbacRepository
from app.repositories.user_repository import UserRepository
from app.services.admin_staff_service import AdminStaffService
from app.services.bootstrap_admin_service import bootstrap_admin_account
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BOOTSTRAP_EMAIL = f"bootstrap-{uuid.uuid4().hex[:8]}@yunicity.dev"
BOOTSTRAP_PASSWORD = "BootstrapTest1!Secure"


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> AsyncIterator[None]:
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()
    yield
    if redis is not None:
        await redis.flushdb()


def _bootstrap_settings() -> Settings:
    base = get_settings()
    return base.model_copy(
        update={
            "bootstrap_admin_email": BOOTSTRAP_EMAIL,
            "bootstrap_admin_password": BOOTSTRAP_PASSWORD,
            "app_env": "dev",
        }
    )


async def _session_factory() -> async_sessionmaker[AsyncSession]:
    engine = get_engine()
    assert engine is not None
    return async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


async def test_bootstrap_creates_missing_admin(auth_client: AsyncClient) -> None:
    _ = auth_client
    factory = await _session_factory()
    settings = _bootstrap_settings()
    async with factory() as session:
        result = await bootstrap_admin_account(session, settings)
        await session.commit()

    assert result.created is True
    assert result.role == "SUPER_ADMIN"
    assert result.active is True

    async with factory() as session:
        user = await UserRepository(session).get_by_email(BOOTSTRAP_EMAIL)
        assert user is not None
        assert user.is_system_account is True
        assert user.is_active is True
        assert user.is_verified is True
        assert verify_password(BOOTSTRAP_PASSWORD, user.hashed_password)
        roles = await RbacRepository(session).get_role_keys_for_user(user.id)
        assert "SUPER_ADMIN" in roles


async def test_bootstrap_repairs_disabled_admin(auth_client: AsyncClient) -> None:
    _ = auth_client
    factory = await _session_factory()
    settings = _bootstrap_settings()
    async with factory() as session:
        user = User(
            email=BOOTSTRAP_EMAIL,
            hashed_password="!locked",
            full_name="Broken Admin",
            is_active=False,
            is_verified=False,
            is_system_account=False,
        )
        session.add(user)
        await session.flush()
        await RbacRepository(session).assign_role_to_user(user.id, "USER")
        await session.commit()

    async with factory() as session:
        result = await bootstrap_admin_account(session, settings)
        await session.commit()

    assert result.created is False
    assert result.active is True
    assert result.role_restored is True

    async with factory() as session:
        repaired = await UserRepository(session).get_by_email(BOOTSTRAP_EMAIL)
        assert repaired is not None
        assert repaired.is_active is True
        assert repaired.is_verified is True
        assert repaired.is_system_account is True
        assert verify_password(BOOTSTRAP_PASSWORD, repaired.hashed_password)
        roles = await RbacRepository(session).get_role_keys_for_user(repaired.id)
        assert "SUPER_ADMIN" in roles


async def test_bootstrap_is_idempotent(auth_client: AsyncClient) -> None:
    _ = auth_client
    factory = await _session_factory()
    settings = _bootstrap_settings()
    async with factory() as session:
        first = await bootstrap_admin_account(session, settings)
        await session.commit()
    async with factory() as session:
        second = await bootstrap_admin_account(session, settings)
        await session.commit()

    assert first.user_id == second.user_id
    assert second.created is False
    assert second.role == "SUPER_ADMIN"
    assert second.active is True


async def test_bootstrap_admin_can_login(auth_client: AsyncClient) -> None:
    factory = await _session_factory()
    settings = _bootstrap_settings()
    async with factory() as session:
        await bootstrap_admin_account(session, settings)
        await session.commit()

    response = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": BOOTSTRAP_EMAIL, "password": BOOTSTRAP_PASSWORD},
    )
    assert response.status_code == 200, response.text
    assert response.json()["user"]["email"] == BOOTSTRAP_EMAIL


async def test_system_account_cannot_be_suspended(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    _ = auth_client
    factory = await _session_factory()
    settings = _bootstrap_settings()
    async with factory() as session:
        result = await bootstrap_admin_account(session, settings)
        await session.commit()

    actor = await rbac_user_factory("SUPER_ADMIN")

    async with factory() as session:
        actor_user = await UserRepository(session).get_by_id(actor.user_id)
        assert actor_user is not None
        service = AdminStaffService(session)
        with pytest.raises(AppError) as exc_info:
            await service.suspend_user(actor_user, result.user_id, reason="test")
        assert exc_info.value.code == "STAFF_SYSTEM_ACCOUNT_PROTECTED"


async def test_system_account_cannot_have_role_revoked(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    _ = auth_client
    factory = await _session_factory()
    settings = _bootstrap_settings()
    async with factory() as session:
        result = await bootstrap_admin_account(session, settings)
        await session.commit()

    actor = await rbac_user_factory("SUPER_ADMIN")

    async with factory() as session:
        actor_user = await UserRepository(session).get_by_id(actor.user_id)
        assert actor_user is not None
        service = AdminStaffService(session)
        with pytest.raises(AppError) as exc_info:
            await service.revoke_role(actor_user, result.user_id, role_key="SUPER_ADMIN")
        assert exc_info.value.code == "STAFF_SYSTEM_ACCOUNT_PROTECTED"
