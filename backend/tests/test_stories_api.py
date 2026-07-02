"""Stories portal API tests."""

from __future__ import annotations

from typing import Any, cast

import pytest
from app.integrations.redis import get_redis_client
from httpx import AsyncClient


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits() -> None:
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()


@pytest.fixture(autouse=True)
def disable_stories_api_rate_limits(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr("app.api.v1.auth.enforce_rate_limit", _noop)


async def _register(client: AsyncClient, suffix: str) -> dict[str, Any]:
    body = {
        "email": f"story{suffix}@example.com",
        "password": "StrongPassword1!",
        "full_name": f"Story {suffix}",
        "city": "Reims",
    }
    response = await client.post("/api/v1/auth/register", json=body)
    assert response.status_code == 201, response.text
    return cast(dict[str, Any], response.json())


@pytest.mark.asyncio
async def test_list_stories_requires_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/stories")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_and_list_story(auth_client: AsyncClient) -> None:
    auth = await _register(auth_client, "create")
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    create = await auth_client.post(
        "/api/v1/stories",
        headers=headers,
        json={
            "media_url": "https://images.example.com/reims-sunset.jpg",
            "caption": "Quel coucher de soleil magique sur la cathédrale !",
            "category": "culture",
            "location_label": "Cathédrale de Reims",
        },
    )
    assert create.status_code == 201, create.text
    body = create.json()
    assert body["caption"].startswith("Quel coucher")
    assert body["location_label"] == "Cathédrale de Reims"
    assert body["category_ids"] == ["culture"]

    listing = await auth_client.get("/api/v1/stories", headers=headers)
    assert listing.status_code == 200
    listed = listing.json()
    assert len(listed["items"]) == 1
    assert listed["items"][0]["id"] == body["id"]

    view = await auth_client.post(f"/api/v1/stories/{body['id']}/view", headers=headers)
    assert view.status_code == 204


@pytest.mark.asyncio
async def test_story_not_in_local_feed(auth_client: AsyncClient) -> None:
    auth = await _register(auth_client, "feed-isolation")
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    create = await auth_client.post(
        "/api/v1/stories",
        headers=headers,
        json={
            "media_url": "https://images.example.com/story-feed-isolation.jpg",
            "media_type": "image",
            "caption": "Story isolée du fil local",
        },
    )
    assert create.status_code == 201, create.text
    story_id = create.json()["id"]

    feed = await auth_client.get("/api/v1/feed", headers=headers)
    assert feed.status_code == 200
    feed_ids = [item["id"] for item in feed.json()["items"]]
    assert story_id not in feed_ids

    listing = await auth_client.get("/api/v1/stories", headers=headers)
    assert listing.status_code == 200
    story_ids = [item["id"] for item in listing.json()["items"]]
    assert story_id in story_ids
