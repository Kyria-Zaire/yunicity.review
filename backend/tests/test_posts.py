"""Post API tests (TICKET-402) — compléments feed."""

from __future__ import annotations

import pytest
from app.integrations.redis import get_redis_client
from httpx import AsyncClient

from tests.conftest_passport import auth_header
from tests.test_feed import _register

POST_CREATE_USER_QUOTA = 20

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.mark.asyncio
async def test_patch_soft_delete_via_is_active(auth_client: AsyncClient) -> None:
    user = await _register(auth_client, suffix="-patch-del", city="Reims")
    created = await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": "Patch delete"},
        headers=auth_header(user["access_token"]),
    )
    post_id = created.json()["id"]
    patched = await auth_client.patch(
        f"/api/v1/posts/{post_id}",
        json={"is_active": False},
        headers=auth_header(user["access_token"]),
    )
    assert patched.status_code == 200
    assert patched.json()["is_active"] is False


@pytest.mark.asyncio
async def test_create_post_rate_limited_after_quota(auth_client: AsyncClient) -> None:
    """Publishing is capped per user (RATE-LIMIT-TEXT-01).

    Stays under the per-IP cap (40) so the 429 provably comes from the per-user quota
    and not from the IP one — the whole suite shares a single client IP.
    """
    if get_redis_client() is None:
        pytest.skip("Redis indisponible — rate limiting no-op")

    user = await _register(auth_client, suffix="-create-rl", city="Reims")
    headers = auth_header(user["access_token"])

    for index in range(POST_CREATE_USER_QUOTA):
        response = await auth_client.post(
            "/api/v1/posts",
            json={"author_type": "citizen", "body": f"Post {index}"},
            headers=headers,
        )
        assert response.status_code == 201, f"post {index}: {response.text}"

    blocked = await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": "Post de trop"},
        headers=headers,
    )
    assert blocked.status_code == 429, blocked.text
    assert blocked.json()["code"] == "RATE_LIMITED"
