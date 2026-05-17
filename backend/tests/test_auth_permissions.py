"""RBAC permission guard tests."""

import uuid

import pytest
from app.core.dependencies import require_permission
from app.core.errors import AppError
from app.repositories.rbac_repository import RbacRepository
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.mark.asyncio
async def test_me_contains_roles_and_permissions(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    reg = await auth_client.post("/api/v1/auth/register", json=register_payload)
    token = reg.json()["access_token"]
    me = await auth_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    data = me.json()
    assert "USER" in data["roles"]
    assert "auth.me.read" in data["permissions"]
    assert "users.update.self" in data["permissions"]
    assert "system.admin" not in data["permissions"]


@pytest.mark.asyncio
async def test_permission_guard_allowed(
    auth_client: AsyncClient,
    register_payload: dict[str, str],
) -> None:
    from app.db.session import get_engine
    from app.models.user import User
    from sqlalchemy import select

    reg = await auth_client.post("/api/v1/auth/register", json=register_payload)
    user_id = uuid.UUID(reg.json()["user"]["id"])
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
        guard = require_permission("auth.me.read")
        returned = await guard(current_user=user, session=session)
        assert returned.id == user.id


@pytest.mark.asyncio
async def test_permission_guard_denied(
    auth_client: AsyncClient,
    register_payload: dict[str, str],
) -> None:
    from app.db.session import get_engine
    from app.models.user import User
    from sqlalchemy import select

    reg = await auth_client.post("/api/v1/auth/register", json=register_payload)
    user_id = uuid.UUID(reg.json()["user"]["id"])
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
        guard = require_permission("system.admin")
        with pytest.raises(AppError) as exc_info:
            await guard(current_user=user, session=session)
        assert exc_info.value.status_code == 403
        assert exc_info.value.code == "FORBIDDEN"


@pytest.mark.asyncio
async def test_rbac_repository_user_has_self_permissions(
    auth_client: AsyncClient,
    register_payload: dict[str, str],
) -> None:
    from app.db.session import get_engine

    reg = await auth_client.post("/api/v1/auth/register", json=register_payload)
    user_id = uuid.UUID(reg.json()["user"]["id"])
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        rbac = RbacRepository(session)
        assert await rbac.user_has_permission(user_id, "users.read.self")
        assert not await rbac.user_has_permission(user_id, "system.admin")
