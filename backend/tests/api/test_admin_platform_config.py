"""Admin platform config snapshot API tests (ADMIN-SETTINGS-01B)."""

from __future__ import annotations

import json
import re

import pytest
from httpx import AsyncClient
from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/platform-config"

EXPECTED_TOP_LEVEL_KEYS = {
    "generated_at",
    "read_only",
    "general",
    "passport",
    "partners",
    "moderation",
    "notifications",
    "system",
    "business",
    "enabled_modules",
    "coming_soon",
    "viewer",
}

SENSITIVE_KEY_PATTERN = re.compile(
    r"(jwt|secret|password|stripe_secret|database_url|redis_url|pepper|api_key|"
    r"access_token|refresh_token|qr_secret|private_key|connection_string)",
    re.IGNORECASE,
)


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
async def test_platform_config_requires_authentication(auth_client: AsyncClient) -> None:
    response = await auth_client.get(BASE)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_platform_config_forbidden_without_staff_role(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.get(BASE, headers=auth_header(user.access_token))
    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_platform_config_ok_for_super_admin(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.get(BASE, headers=auth_header(admin.access_token))
    assert response.status_code == 200
    data = response.json()
    assert EXPECTED_TOP_LEVEL_KEYS.issubset(data.keys())
    assert data["read_only"] is True
    assert data["general"]["pilot_city"] == "Reims"
    assert data["general"]["pilot_status"] == "active"
    assert data["passport"]["badge_thresholds"]["silver_reputation"] == 25
    assert data["passport"]["badge_thresholds"]["gold_reputation"] == 70
    assert isinstance(data["passport"]["tiers"], list)
    assert isinstance(data["viewer"]["permissions"], list)


@pytest.mark.asyncio
async def test_platform_config_ok_for_moderator(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(BASE, headers=auth_header(moderator.access_token))
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_platform_config_exposes_no_sensitive_keys(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    admin = await rbac_user_factory("SUPER_ADMIN")
    response = await auth_client.get(BASE, headers=auth_header(admin.access_token))
    assert response.status_code == 200
    data = response.json()
    serialized = json.dumps(data).lower()
    assert "jwt_secret" not in serialized
    assert "database_url" not in serialized
    assert "redis_url" not in serialized
    assert "stripe_secret_key" not in serialized
    for key in _collect_json_keys(data):
        assert not SENSITIVE_KEY_PATTERN.search(key), f"sensitive key exposed: {key}"
