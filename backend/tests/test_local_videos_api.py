"""Local Video API tests (FEATURE-CREATORS-V2 / C2-S1)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from typing import Any

import pytest
from app.core.config import get_settings
from app.core.local_video_constants import LocalVideoStatus, LocalVideoType
from app.integrations.redis import get_redis_client
from app.services.local_video.processor import LocalVideoProcessResult
from httpx import AsyncClient

from tests.conftest_passport import auth_header, register_user

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BOULINGRIN_ID = "d6010000-0000-4000-8000-000000000005"
BASE = "/api/v1/local-videos"


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
    def _fake_process(self, *, source_storage_key, user_id, video_id, content_type):  # type: ignore[no-untyped-def]
        del self, content_type
        return LocalVideoProcessResult(
            duration_seconds=12.5,
            source_storage_key=f"local-video/test/reims/{user_id}/{video_id}/source.mp4",
            thumbnail_storage_key=f"local-video/test/reims/{user_id}/{video_id}/thumb.jpg",
            mime_type="video/mp4",
            file_size_bytes=4096,
        )

    monkeypatch.setattr(
        "app.services.local_video_service.LocalVideoMediaProcessor.process",
        _fake_process,
    )


async def _register(auth_client: AsyncClient) -> dict[str, Any]:
    return await register_user(auth_client, suffix=f"-lv-{uuid.uuid4().hex[:8]}")


async def _init_upload(client: AsyncClient, token: str) -> dict[str, Any]:
    response = await client.post(
        f"{BASE}/upload-init",
        json={
            "filename": "reims-moment.mp4",
            "content_type": "video/mp4",
            "file_size_bytes": 4096,
        },
        headers=auth_header(token),
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.asyncio
async def test_upload_init_requires_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.post(
        f"{BASE}/upload-init",
        json={
            "filename": "clip.mp4",
            "content_type": "video/mp4",
            "file_size_bytes": 1024,
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_upload_init_rejects_invalid_mime(auth_client: AsyncClient) -> None:
    user = await _register(auth_client)
    response = await auth_client.post(
        f"{BASE}/upload-init",
        json={
            "filename": "clip.avi",
            "content_type": "video/x-msvideo",
            "file_size_bytes": 1024,
        },
        headers=auth_header(user["access_token"]),
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_upload_init_success(auth_client: AsyncClient) -> None:
    user = await _register(auth_client)
    body = await _init_upload(auth_client, user["access_token"])
    assert body["upload_id"]
    assert body["presigned_url"].endswith("/binary")
    assert body["storage_key"].startswith("local-video/")
    assert body["upload_method"] == "PUT"
    assert body["upload_headers"]["Content-Type"] == "video/mp4"


@pytest.mark.asyncio
async def test_publish_flow(auth_client: AsyncClient, mock_processor: None) -> None:
    user = await _register(auth_client)
    init_body = await _init_upload(auth_client, user["access_token"])
    upload_id = init_body["upload_id"]
    presigned_url = init_body["presigned_url"]

    put_response = await auth_client.put(
        presigned_url,
        content=b"fake-mp4-bytes-for-test",
        headers={"Content-Type": "video/mp4"},
    )
    assert put_response.status_code == 204, put_response.text

    publish_response = await auth_client.post(
        BASE,
        json={
            "upload_id": upload_id,
            "city": "Reims",
            "neighborhood_id": BOULINGRIN_ID,
            "video_type": LocalVideoType.MOMENT.value,
            "title": "Ce soir au Boulingrin",
        },
        headers=auth_header(user["access_token"]),
    )
    assert publish_response.status_code == 201, publish_response.text
    published = publish_response.json()
    assert published["status"] == LocalVideoStatus.PUBLISHED.value
    assert published["duration_seconds"] == 12.5
    assert published["media_url"]
    assert published["thumbnail_url"]
    assert published["neighborhood_id"] == BOULINGRIN_ID

    get_response = await auth_client.get(
        f"{BASE}/{published['id']}",
        headers=auth_header(user["access_token"]),
    )
    assert get_response.status_code == 200
    assert get_response.json()["id"] == published["id"]


@pytest.mark.asyncio
async def test_publish_without_upload_fails(auth_client: AsyncClient) -> None:
    user = await _register(auth_client)
    init_body = await _init_upload(auth_client, user["access_token"])

    response = await auth_client.post(
        BASE,
        json={
            "upload_id": init_body["upload_id"],
            "city": "Reims",
            "neighborhood_id": BOULINGRIN_ID,
            "video_type": LocalVideoType.MOMENT.value,
        },
        headers=auth_header(user["access_token"]),
    )
    assert response.status_code == 400
    assert response.json()["code"] == "LOCAL_VIDEO_UPLOAD_MISSING"


@pytest.mark.asyncio
async def test_publish_twice_same_upload_rejected(
    auth_client: AsyncClient,
    mock_processor: None,
) -> None:
    user = await _register(auth_client)
    init_body = await _init_upload(auth_client, user["access_token"])
    await auth_client.put(
        init_body["presigned_url"],
        content=b"fake-mp4-bytes",
        headers={"Content-Type": "video/mp4"},
    )
    payload = {
        "upload_id": init_body["upload_id"],
        "city": "Reims",
        "neighborhood_id": BOULINGRIN_ID,
        "video_type": LocalVideoType.QUARTIER.value,
    }
    first = await auth_client.post(
        BASE,
        json=payload,
        headers=auth_header(user["access_token"]),
    )
    assert first.status_code == 201, first.text

    second = await auth_client.post(
        BASE,
        json=payload,
        headers=auth_header(user["access_token"]),
    )
    assert second.status_code == 409
    assert second.json()["code"] == "LOCAL_VIDEO_UPLOAD_ALREADY_USED"
