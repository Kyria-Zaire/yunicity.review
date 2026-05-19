"""Post API tests (TICKET-402) — compléments feed."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from tests.conftest_passport import auth_header
from tests.test_feed import _register

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
