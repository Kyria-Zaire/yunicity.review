"""Story media upload integration tests (PILOT-FIX-03)."""

from __future__ import annotations

from collections.abc import Generator
from io import BytesIO
from unittest.mock import MagicMock, patch

import pytest
from app.core.config import get_settings
from app.integrations.redis import get_redis_client
from httpx import AsyncClient

from tests.media_fixtures import (
    FAKE_MP4_BYTES,
    MINIMAL_JPEG_BYTES,
    MINIMAL_MP4_BYTES,
    MINIMAL_PNG_BYTES,
)
from tests.test_stories_api import _register

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

STORY_MEDIA_CDN_BASE = "https://media.test.local"
STORY_MEDIA_BUCKET = "yunicity-media-test"


@pytest.fixture(autouse=True)
def story_media_r2_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LOCAL_VIDEO_R2_ENDPOINT", "https://example.r2.cloudflarestorage.com")
    monkeypatch.setenv("LOCAL_VIDEO_R2_BUCKET", STORY_MEDIA_BUCKET)
    monkeypatch.setenv("LOCAL_VIDEO_R2_ACCESS_KEY_ID", "test-access-key")
    monkeypatch.setenv("LOCAL_VIDEO_R2_SECRET_ACCESS_KEY", "test-secret-key")
    monkeypatch.setenv("LOCAL_VIDEO_CDN_BASE_URL", STORY_MEDIA_CDN_BASE)
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def mock_story_media_r2() -> Generator[dict[str, bytes], None, None]:
    stored: dict[str, bytes] = {}
    mock_client = MagicMock()

    def _put_object(*, Bucket: str, Key: str, Body: bytes, ContentType: str) -> None:
        assert Bucket == STORY_MEDIA_BUCKET
        stored[Key] = bytes(Body)

    mock_client.put_object.side_effect = _put_object

    with patch("app.services.story_media.r2_storage.boto3.client", return_value=mock_client):
        yield stored


@pytest.fixture(autouse=True)
def disable_story_media_rate_limits(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(*_args: object, **_kwargs: object) -> None:
        return None

    # Only auth register is noop'd; the stories media rate limit stays active
    # so test_upload_story_media_rate_limited can exercise the real 429 path.
    monkeypatch.setattr("app.api.v1.auth.enforce_rate_limit", _noop)


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> None:
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _upload_file(
    *,
    content: bytes,
    filename: str,
    content_type: str,
) -> dict[str, tuple[str, BytesIO, str]]:
    return {"file": (filename, BytesIO(content), content_type)}


@pytest.mark.asyncio
async def test_upload_story_media_success(
    auth_client: AsyncClient,
    mock_story_media_r2: dict[str, bytes],
) -> None:
    auth = await _register(auth_client, "media-ok")
    token = auth["access_token"]
    user_id = auth["user"]["id"]

    response = await auth_client.post(
        "/api/v1/stories/media",
        headers=_auth_headers(token),
        files=_upload_file(
            content=MINIMAL_JPEG_BYTES,
            filename="story.jpg",
            content_type="image/jpeg",
        ),
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["media_type"] == "image"
    assert body["url"].startswith(f"{STORY_MEDIA_CDN_BASE}/stories/{user_id}/")
    assert body["url"].endswith(".jpg")
    storage_key = body["url"].removeprefix(f"{STORY_MEDIA_CDN_BASE}/")
    assert mock_story_media_r2[storage_key] == MINIMAL_JPEG_BYTES


@pytest.mark.asyncio
async def test_upload_story_media_mp4(
    auth_client: AsyncClient,
    mock_story_media_r2: dict[str, bytes],
) -> None:
    auth = await _register(auth_client, "media-mp4")
    token = auth["access_token"]

    response = await auth_client.post(
        "/api/v1/stories/media",
        headers=_auth_headers(token),
        files=_upload_file(
            content=MINIMAL_MP4_BYTES,
            filename="story.mp4",
            content_type="video/mp4",
        ),
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["media_type"] == "video"
    assert body["url"].endswith(".mp4")


@pytest.mark.asyncio
async def test_upload_story_media_rejects_mismatch(
    auth_client: AsyncClient,
) -> None:
    auth = await _register(auth_client, "media-bad")
    token = auth["access_token"]

    response = await auth_client.post(
        "/api/v1/stories/media",
        headers=_auth_headers(token),
        files=_upload_file(
            content=FAKE_MP4_BYTES,
            filename="fake.mp4",
            content_type="video/mp4",
        ),
    )
    assert response.status_code == 400
    assert response.json()["code"] == "STORY_MEDIA_INVALID_CONTENT"


@pytest.mark.asyncio
async def test_upload_story_media_rate_limited_after_quota(
    auth_client: AsyncClient,
    mock_story_media_r2: dict[str, bytes],
) -> None:
    if get_redis_client() is None:
        pytest.skip("Redis indisponible — rate limiting no-op")

    auth = await _register(auth_client, "media-rl")
    token = auth["access_token"]
    headers = _auth_headers(token)

    for index in range(20):
        response = await auth_client.post(
            "/api/v1/stories/media",
            headers=headers,
            files=_upload_file(
                content=MINIMAL_JPEG_BYTES,
                filename=f"story-{index}.jpg",
                content_type="image/jpeg",
            ),
        )
        assert response.status_code == 201, f"upload {index}: {response.text}"

    blocked = await auth_client.post(
        "/api/v1/stories/media",
        headers=headers,
        files=_upload_file(
            content=MINIMAL_JPEG_BYTES,
            filename="story-blocked.jpg",
            content_type="image/jpeg",
        ),
    )
    assert blocked.status_code == 429, blocked.text
    assert blocked.json()["code"] == "RATE_LIMITED"


@pytest.mark.asyncio
async def test_upload_and_publish_story(
    auth_client: AsyncClient,
    mock_story_media_r2: dict[str, bytes],
) -> None:
    auth = await _register(auth_client, "full-flow")
    token = auth["access_token"]
    headers = _auth_headers(token)

    upload = await auth_client.post(
        "/api/v1/stories/media",
        headers=headers,
        files=_upload_file(
            content=MINIMAL_PNG_BYTES,
            filename="story.png",
            content_type="image/png",
        ),
    )
    assert upload.status_code == 201, upload.text
    media = upload.json()

    create = await auth_client.post(
        "/api/v1/stories",
        headers=headers,
        json={
            "media_url": media["url"],
            "media_type": media["media_type"],
            "caption": "Story publiée via R2",
            "location_label": "Reims centre",
        },
    )
    assert create.status_code == 201, create.text
    created = create.json()
    assert created["media_url"] == media["url"]

    listing = await auth_client.get("/api/v1/stories", headers=headers)
    assert listing.status_code == 200
    items = listing.json()["items"]
    assert any(item["id"] == created["id"] for item in items)
