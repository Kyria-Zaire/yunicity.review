"""Subscription catalog and me endpoints."""

from __future__ import annotations

from typing import Any, cast

import pytest
from httpx import AsyncClient


async def _register(client: AsyncClient, suffix: str) -> dict[str, Any]:
    body = {
        "email": f"subs{suffix}@example.com",
        "password": "StrongPassword1!",
        "full_name": f"Subs {suffix}",
        "city": "Reims",
    }
    response = await client.post("/api/v1/auth/register", json=body)
    assert response.status_code == 201, response.text
    return cast(dict[str, Any], response.json())


@pytest.mark.asyncio
async def test_list_plans_is_public(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/subscriptions/plans")
    assert response.status_code == 200
    body = response.json()
    assert len(body["plans"]) == 3
    codes = [plan["code"] for plan in body["plans"]]
    assert codes == ["free", "plus", "premium"]
    assert body["annual_discount_percent"] == 20
    assert body["checkout_enabled"] is False


@pytest.mark.asyncio
async def test_community_stats_is_public(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/subscriptions/community-stats")
    assert response.status_code == 200
    body = response.json()
    assert body["supporter_count"] >= 0
    assert isinstance(body["avatars"], list)


@pytest.mark.asyncio
async def test_me_defaults_to_free(auth_client: AsyncClient) -> None:
    auth = await _register(auth_client, "me")
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    response = await auth_client.get("/api/v1/subscriptions/me", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["plan_code"] == "free"
    assert body["is_paid"] is False
    assert body["can_upgrade"] is True


@pytest.mark.asyncio
async def test_checkout_unavailable_without_stripe(auth_client: AsyncClient) -> None:
    auth = await _register(auth_client, "checkout")
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    response = await auth_client.post(
        "/api/v1/subscriptions/checkout",
        json={"plan_code": "plus", "billing_interval": "monthly"},
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "unavailable"
    assert body["message"]
