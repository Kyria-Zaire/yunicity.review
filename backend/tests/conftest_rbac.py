"""RBAC integration test helpers."""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator, Awaitable, Callable
from dataclasses import dataclass

import pytest
from app.db.session import get_engine, get_session_factory
from httpx import AsyncClient


@dataclass
class AuthenticatedUser:
    user_id: uuid.UUID
    email: str
    access_token: str
    password: str


async def register_user(
    client: AsyncClient,
    *,
    email: str | None = None,
    password: str = "StrongPassword1!",
    full_name: str = "Test User",
) -> AuthenticatedUser:
    address = email or f"user-{uuid.uuid4().hex[:12]}@example.com"
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": address,
            "password": password,
            "full_name": full_name,
            "city": "Reims",
        },
    )
    assert response.status_code == 201, response.text
    data = response.json()
    return AuthenticatedUser(
        user_id=uuid.UUID(data["user"]["id"]),
        email=address,
        access_token=data["access_token"],
        password=password,
    )


async def assign_roles(user_id: uuid.UUID, *role_keys: str) -> None:
    from app.services.rbac_service import RbacService

    engine = get_engine()
    assert engine is not None
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        rbac = RbacService(session)
        for role_key in role_keys:
            await rbac.assign_role_to_user(user_id, role_key)
        await session.commit()


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


RbacUserFactory = Callable[..., Awaitable[AuthenticatedUser]]


@pytest.fixture
async def rbac_user_factory(
    auth_client: AsyncClient,
) -> AsyncGenerator[RbacUserFactory, None]:
    """Factory: (*extra_roles, email=None) -> AuthenticatedUser with extra roles assigned."""

    async def _factory(*extra_roles: str, email: str | None = None) -> AuthenticatedUser:
        user = await register_user(auth_client, email=email)
        if extra_roles:
            await assign_roles(user.user_id, *extra_roles)
        return user

    yield _factory
