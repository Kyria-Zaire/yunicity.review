"""RBAC effective permissions and multi-role tests."""

import pytest
from httpx import AsyncClient

from tests.conftest_rbac import RbacUserFactory, assign_roles, auth_header, register_user

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

PERMISSIONS_URL = "/api/v1/rbac/me/permissions"


@pytest.mark.asyncio
async def test_me_permissions_returns_merged_permissions(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.get(PERMISSIONS_URL, headers=auth_header(user.access_token))
    assert response.status_code == 200
    data = response.json()
    assert "USER" in data["roles"]
    assert "auth.me.read" in data["permissions"]
    assert "users.read.self" in data["permissions"]
    assert "system.admin" not in data["permissions"]


@pytest.mark.asyncio
async def test_multi_role_user_permissions_merged(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(PERMISSIONS_URL, headers=auth_header(user.access_token))
    assert response.status_code == 200
    permissions = set(response.json()["permissions"])
    assert "users.read.self" in permissions
    assert "moderation.read" in permissions
    assert "moderation.manage" in permissions
    assert "users.read.all" not in permissions


@pytest.mark.asyncio
async def test_duplicate_role_assignment_is_safe(
    auth_client: AsyncClient,
) -> None:
    user = await register_user(auth_client)
    await assign_roles(user.user_id, "MODERATOR")
    await assign_roles(user.user_id, "MODERATOR")
    response = await auth_client.get(PERMISSIONS_URL, headers=auth_header(user.access_token))
    assert response.status_code == 200
    assert response.json()["roles"].count("MODERATOR") == 1
