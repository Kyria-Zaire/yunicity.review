"""RBAC guard allow/deny tests by role."""

import pytest
from httpx import AsyncClient

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

MODERATION_URL = "/api/v1/rbac/moderation/check"
USERS_URL = "/api/v1/rbac/users/check"
ADMIN_URL = "/api/v1/rbac/admin/check"


@pytest.mark.asyncio
async def test_user_cannot_access_moderation_route(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.get(MODERATION_URL, headers=auth_header(user.access_token))
    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_moderator_can_access_moderation_route(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(MODERATION_URL, headers=auth_header(user.access_token))
    assert response.status_code == 200
    assert response.json()["permission"] == "moderation.read"


@pytest.mark.asyncio
async def test_moderator_denied_admin_route(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(ADMIN_URL, headers=auth_header(user.access_token))
    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_city_admin_can_access_users_route(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory("CITY_ADMIN")
    response = await auth_client.get(USERS_URL, headers=auth_header(user.access_token))
    assert response.status_code == 200
    assert response.json()["permission"] == "users.read.all"


@pytest.mark.asyncio
async def test_city_admin_denied_admin_route(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory("CITY_ADMIN")
    response = await auth_client.get(ADMIN_URL, headers=auth_header(user.access_token))
    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_super_admin_can_access_all_checks(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory("SUPER_ADMIN")
    headers = auth_header(user.access_token)
    for url in (MODERATION_URL, USERS_URL, ADMIN_URL):
        response = await auth_client.get(url, headers=headers)
        assert response.status_code == 200, url


@pytest.mark.asyncio
async def test_unauthenticated_returns_401(auth_client: AsyncClient) -> None:
    response = await auth_client.get(MODERATION_URL)
    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_invalid_token_returns_401(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        MODERATION_URL,
        headers={"Authorization": "Bearer not-a-valid-jwt"},
    )
    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_permission_guard_returns_403_not_401(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.get(ADMIN_URL, headers=auth_header(user.access_token))
    assert response.status_code == 403
    body = response.json()
    assert body["code"] == "FORBIDDEN"
    assert "traceback" not in response.text.lower()
    assert "stack" not in response.text.lower()
