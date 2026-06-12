"""Admin activity center API tests (ADMIN-NOTIFICATIONS-01B)."""

from __future__ import annotations

import json
import re
from collections.abc import AsyncIterator
from unittest.mock import AsyncMock, patch

import pytest
from app.integrations.redis import get_redis_client
from httpx import AsyncClient
from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

SUMMARY_BASE = "/api/v1/admin/activity/summary"
FEED_BASE = "/api/v1/admin/activity/feed"

SUMMARY_TOP_LEVEL_KEYS = {
    "generated_at",
    "read_only",
    "health",
    "attention",
    "alerts",
    "sections",
}

FEED_TOP_LEVEL_KEYS = {"generated_at", "items", "next_cursor"}

SENSITIVE_KEY_PATTERN = re.compile(
    r"(jwt|secret|password|stripe_secret|database_url|redis_url|pepper|api_key|"
    r"access_token|refresh_token|hashed_password|private_key)",
    re.IGNORECASE,
)


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> AsyncIterator[None]:
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()
    yield
    if redis is not None:
        await redis.flushdb()


def _collect_json_keys(payload: object, prefix: str = "") -> list[str]:
    keys: list[str] = []
    if isinstance(payload, dict):
        for key, value in payload.items():
            full_key = f"{prefix}.{key}" if prefix else key
            keys.append(full_key)
            keys.extend(_collect_json_keys(value, full_key))
    elif isinstance(payload, list):
        for index, item in enumerate(payload):
            keys.extend(_collect_json_keys(item, f"{prefix}[{index}]"))
    return keys


@pytest.mark.asyncio
async def test_activity_summary_requires_authentication(auth_client: AsyncClient) -> None:
    response = await auth_client.get(SUMMARY_BASE)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_activity_summary_forbidden_without_staff_role(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.get(SUMMARY_BASE, headers=auth_header(user.access_token))
    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_activity_summary_ok_for_super_admin(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.get(SUMMARY_BASE, headers=auth_header(admin.access_token))
    assert response.status_code == 200
    data = response.json()
    assert SUMMARY_TOP_LEVEL_KEYS.issubset(data.keys())
    assert data["read_only"] is True
    assert data["health"]["status"] in {"healthy", "degraded", "critical"}
    assert isinstance(data["alerts"], list)
    assert data["sections"]["moderation"]["label"] == "Modération"


@pytest.mark.asyncio
async def test_activity_summary_ok_for_moderator(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(SUMMARY_BASE, headers=auth_header(moderator.access_token))
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_activity_summary_health_degraded_when_checks_error(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    admin = await rbac_user_factory("SUPER_ADMIN")
    with (
        patch(
            "app.services.admin_activity_service.check_database",
            new=AsyncMock(return_value="error"),
        ),
        patch(
            "app.services.admin_activity_service.check_redis",
            new=AsyncMock(return_value="ok"),
        ),
    ):
        response = await auth_client.get(SUMMARY_BASE, headers=auth_header(admin.access_token))
    assert response.status_code == 200
    data = response.json()
    assert data["health"]["status"] == "critical"
    assert data["health"]["database"] == "error"
    assert any(alert["id"] == "infrastructure_degraded" for alert in data["alerts"])


@pytest.mark.asyncio
async def test_activity_feed_ok(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.get(FEED_BASE, headers=auth_header(admin.access_token))
    assert response.status_code == 200
    data = response.json()
    assert FEED_TOP_LEVEL_KEYS.issubset(data.keys())
    assert isinstance(data["items"], list)
    for item in data["items"]:
        assert "@" not in item["actor_label"]
        assert "email" not in item["actor_label"].lower()


@pytest.mark.asyncio
async def test_activity_feed_limit_max_100(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.get(
        f"{FEED_BASE}?limit=101",
        headers=auth_header(admin.access_token),
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_activity_feed_category_filter(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.get(
        f"{FEED_BASE}?category=partner",
        headers=auth_header(admin.access_token),
    )
    assert response.status_code == 200
    for item in response.json()["items"]:
        assert item["category"] == "partner"


@pytest.mark.asyncio
async def test_activity_feed_invalid_category(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.get(
        f"{FEED_BASE}?category=invalid",
        headers=auth_header(admin.access_token),
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_activity_feed_exposes_no_sensitive_keys(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.get(FEED_BASE, headers=auth_header(admin.access_token))
    assert response.status_code == 200
    data = response.json()
    serialized = json.dumps(data).lower()
    assert "jwt_secret" not in serialized
    assert "database_url" not in serialized
    for key in _collect_json_keys(data):
        assert not SENSITIVE_KEY_PATTERN.search(key), f"sensitive key exposed: {key}"
