"""Local Video social API tests (FEATURE-CREATORS-V2 / C2-S3-01)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from typing import Any

import pytest
from app.core.config import get_settings
from app.integrations.redis import get_redis_client
from app.services.local_video.processor import LocalVideoProcessResult
from httpx import AsyncClient

from tests.conftest_passport import auth_header, register_user
from tests.test_local_videos_api import (
    BASE,
    _publish_video,
)

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture(autouse=True)
async def _local_video_env(monkeypatch: pytest.MonkeyPatch) -> AsyncIterator[None]:
    monkeypatch.setenv("LOCAL_VIDEO_STORAGE_BACKEND", "filesystem")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> None:
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()


@pytest.fixture
def mock_processor(monkeypatch: pytest.MonkeyPatch) -> None:
    def _fake_process(self, *, source_storage_key, city_slug, video_id, content_type):  # type: ignore[no-untyped-def]
        del self, content_type, source_storage_key
        return LocalVideoProcessResult(
            duration_seconds=12.5,
            source_storage_key=f"local-video/{city_slug}/{video_id}/processed.mp4",
            thumbnail_storage_key=f"local-video/{city_slug}/{video_id}/thumbnail.jpg",
            mime_type="video/mp4",
            file_size_bytes=4096,
        )

    monkeypatch.setattr(
        "app.services.local_video.processor.LocalVideoMediaProcessor.process",
        _fake_process,
    )


@pytest.fixture(autouse=True)
def _publish_videos_synchronously(mock_processor: None, auto_run_video_worker: None) -> None:
    """VIDEO-03A publish is async (video stays PROCESSING until the worker runs). Run the
    worker inline with a stubbed processor so published videos reach PUBLISHED and are
    findable within each test — otherwise every interaction 404s on an unpublished video."""


async def _register(auth_client: AsyncClient) -> dict[str, Any]:
    return await register_user(auth_client, suffix=f"-lvs-{uuid.uuid4().hex[:8]}")


@pytest.mark.asyncio
async def test_like_requires_auth(auth_client: AsyncClient, mock_processor: None) -> None:
    user = await _register(auth_client)
    video = await _publish(auth_client, user["access_token"])
    response = await auth_client.post(f"{BASE}/{video['id']}/like")
    assert response.status_code == 401


async def _publish(auth_client: AsyncClient, token: str) -> dict[str, Any]:
    return await _publish_video(auth_client, token, title="Social clip")


@pytest.mark.asyncio
async def test_like_idempotent(auth_client: AsyncClient, mock_processor: None) -> None:
    user = await _register(auth_client)
    token = user["access_token"]
    video = await _publish(auth_client, token)

    first = await auth_client.post(f"{BASE}/{video['id']}/like", headers=auth_header(token))
    assert first.status_code == 200, first.text
    first_body = first.json()
    assert first_body["liked"] is True
    assert first_body["like_count"] == 1

    second = await auth_client.post(f"{BASE}/{video['id']}/like", headers=auth_header(token))
    assert second.status_code == 200
    second_body = second.json()
    assert second_body["liked"] is True
    assert second_body["like_count"] == 1


@pytest.mark.asyncio
async def test_unlike(auth_client: AsyncClient, mock_processor: None) -> None:
    user = await _register(auth_client)
    token = user["access_token"]
    video = await _publish(auth_client, token)

    await auth_client.post(f"{BASE}/{video['id']}/like", headers=auth_header(token))
    response = await auth_client.delete(f"{BASE}/{video['id']}/like", headers=auth_header(token))
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["liked"] is False
    assert body["like_count"] == 0


@pytest.mark.asyncio
async def test_feed_includes_liked_by_me(auth_client: AsyncClient, mock_processor: None) -> None:
    user = await _register(auth_client)
    token = user["access_token"]
    video = await _publish(auth_client, token)
    await auth_client.post(f"{BASE}/{video['id']}/like", headers=auth_header(token))

    response = await auth_client.get(
        f"{BASE}/feed",
        params={"city": "Reims", "limit": 10},
        headers=auth_header(token),
    )
    assert response.status_code == 200
    item = next(item for item in response.json()["items"] if item["id"] == video["id"])
    assert item["liked_by_me"] is True
    assert item["like_count"] == 1


@pytest.mark.asyncio
async def test_comment_create_and_list(auth_client: AsyncClient, mock_processor: None) -> None:
    user = await _register(auth_client)
    token = user["access_token"]
    video = await _publish(auth_client, token)

    create = await auth_client.post(
        f"{BASE}/{video['id']}/comments",
        json={"body": "Super découverte !"},
        headers=auth_header(token),
    )
    assert create.status_code == 201, create.text
    created = create.json()
    assert created["body"] == "Super découverte !"
    assert created["video_id"] == video["id"]

    listing = await auth_client.get(
        f"{BASE}/{video['id']}/comments",
        headers=auth_header(token),
    )
    assert listing.status_code == 200
    items = listing.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == created["id"]


@pytest.mark.asyncio
async def test_comment_delete(auth_client: AsyncClient, mock_processor: None) -> None:
    user = await _register(auth_client)
    token = user["access_token"]
    video = await _publish(auth_client, token)

    create = await auth_client.post(
        f"{BASE}/{video['id']}/comments",
        json={"body": "À supprimer"},
        headers=auth_header(token),
    )
    comment_id = create.json()["id"]

    delete = await auth_client.delete(
        f"{BASE}/comments/{comment_id}",
        headers=auth_header(token),
    )
    assert delete.status_code == 204

    listing = await auth_client.get(
        f"{BASE}/{video['id']}/comments",
        headers=auth_header(token),
    )
    assert listing.json()["items"] == []


@pytest.mark.asyncio
async def test_comment_requires_auth(auth_client: AsyncClient, mock_processor: None) -> None:
    user = await _register(auth_client)
    video = await _publish(auth_client, user["access_token"])
    response = await auth_client.post(
        f"{BASE}/{video['id']}/comments",
        json={"body": "Sans auth"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_report_idempotent(auth_client: AsyncClient, mock_processor: None) -> None:
    user = await _register(auth_client)
    token = user["access_token"]
    video = await _publish(auth_client, token)

    first = await auth_client.post(
        f"{BASE}/{video['id']}/report",
        json={"reason": "spam"},
        headers=auth_header(token),
    )
    assert first.status_code == 204

    second = await auth_client.post(
        f"{BASE}/{video['id']}/report",
        json={"reason": "spam"},
        headers=auth_header(token),
    )
    assert second.status_code == 204


@pytest.mark.asyncio
async def test_report_requires_auth(auth_client: AsyncClient, mock_processor: None) -> None:
    user = await _register(auth_client)
    video = await _publish(auth_client, user["access_token"])
    response = await auth_client.post(
        f"{BASE}/{video['id']}/report",
        json={"reason": "other"},
    )
    assert response.status_code == 401
