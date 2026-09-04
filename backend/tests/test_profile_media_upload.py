"""Profile avatar/banner upload integration tests (PILOT-FIX-02)."""

from __future__ import annotations

from collections.abc import Generator
from io import BytesIO
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from app.core.config import get_settings
from app.core.profile_media_constants import PROFILE_AVATAR_MAX_BYTES, PROFILE_BANNER_MAX_BYTES
from httpx import AsyncClient

from tests.media_fixtures import (
    FAKE_MP4_BYTES,
    MINIMAL_JPEG_BYTES,
    MINIMAL_PNG_BYTES,
    MINIMAL_WEBP_BYTES,
)
from tests.test_profile_endpoints import _auth_headers, _register

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

PROFILE_MEDIA_CDN_BASE = "https://media.test.local"
PROFILE_MEDIA_BUCKET = "yunicity-media-test"


@pytest.fixture(autouse=True)
def profile_media_r2_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PROFILE_MEDIA_STORAGE_BACKEND", "r2")
    monkeypatch.setenv("LOCAL_VIDEO_R2_ENDPOINT", "https://example.r2.cloudflarestorage.com")
    monkeypatch.setenv("LOCAL_VIDEO_R2_BUCKET", PROFILE_MEDIA_BUCKET)
    monkeypatch.setenv("LOCAL_VIDEO_R2_ACCESS_KEY_ID", "test-access-key")
    monkeypatch.setenv("LOCAL_VIDEO_R2_SECRET_ACCESS_KEY", "test-secret-key")
    monkeypatch.setenv("LOCAL_VIDEO_CDN_BASE_URL", PROFILE_MEDIA_CDN_BASE)
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def mock_profile_media_r2() -> Generator[dict[str, bytes], None, None]:
    stored: dict[str, bytes] = {}
    mock_client = MagicMock()

    def _put_object(*, Bucket: str, Key: str, Body: bytes, ContentType: str) -> None:
        assert Bucket == PROFILE_MEDIA_BUCKET
        stored[Key] = bytes(Body)

    def _delete_object(*, Bucket: str, Key: str) -> None:
        stored.pop(Key, None)

    mock_client.put_object.side_effect = _put_object
    mock_client.delete_object.side_effect = _delete_object

    with patch("app.services.profile_media.r2_storage.boto3.client", return_value=mock_client):
        yield stored


@pytest.fixture(autouse=True)
def disable_profile_media_rate_limits(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr("app.api.v1.profile.enforce_rate_limit", _noop)
    monkeypatch.setattr("app.api.v1.auth.enforce_rate_limit", _noop)


def _upload_file(
    *,
    content: bytes,
    filename: str,
    content_type: str,
) -> dict[str, tuple[str, BytesIO, str]]:
    return {"file": (filename, BytesIO(content), content_type)}


@pytest.mark.asyncio
async def test_upload_avatar_success(
    auth_client: AsyncClient,
    mock_profile_media_r2: dict[str, bytes],
) -> None:
    data = await _register(auth_client, {}, suffix="avatar-ok")
    token = data["access_token"]
    user_id = data["user"]["id"]

    response = await auth_client.post(
        "/api/v1/profile/me/avatar",
        headers=_auth_headers(token),
        files=_upload_file(
            content=MINIMAL_JPEG_BYTES,
            filename="avatar.jpg",
            content_type="image/jpeg",
        ),
    )
    assert response.status_code == 200, response.text
    body = response.json()
    expected_url = f"{PROFILE_MEDIA_CDN_BASE}/profiles/{user_id}/avatar.jpg"
    assert body["avatar_url"] == expected_url
    assert mock_profile_media_r2[f"profiles/{user_id}/avatar.jpg"] == MINIMAL_JPEG_BYTES


@pytest.mark.asyncio
async def test_upload_banner_success(
    auth_client: AsyncClient,
    mock_profile_media_r2: dict[str, bytes],
) -> None:
    data = await _register(auth_client, {}, suffix="banner-ok")
    token = data["access_token"]
    user_id = data["user"]["id"]

    response = await auth_client.post(
        "/api/v1/profile/me/banner",
        headers=_auth_headers(token),
        files=_upload_file(
            content=MINIMAL_PNG_BYTES,
            filename="banner.png",
            content_type="image/png",
        ),
    )
    assert response.status_code == 200, response.text
    body = response.json()
    expected_url = f"{PROFILE_MEDIA_CDN_BASE}/profiles/{user_id}/banner.png"
    assert body["banner_url"] == expected_url
    assert mock_profile_media_r2[f"profiles/{user_id}/banner.png"] == MINIMAL_PNG_BYTES


@pytest.mark.asyncio
async def test_upload_avatar_replaces_previous_extension(
    auth_client: AsyncClient,
    mock_profile_media_r2: dict[str, bytes],
) -> None:
    data = await _register(auth_client, {}, suffix="avatar-replace")
    token = data["access_token"]
    user_id = data["user"]["id"]
    headers = _auth_headers(token)

    first = await auth_client.post(
        "/api/v1/profile/me/avatar",
        headers=headers,
        files=_upload_file(
            content=MINIMAL_JPEG_BYTES,
            filename="avatar.jpg",
            content_type="image/jpeg",
        ),
    )
    assert first.status_code == 200

    second = await auth_client.post(
        "/api/v1/profile/me/avatar",
        headers=headers,
        files=_upload_file(
            content=MINIMAL_WEBP_BYTES,
            filename="avatar.webp",
            content_type="image/webp",
        ),
    )
    assert second.status_code == 200
    assert second.json()["avatar_url"] == f"{PROFILE_MEDIA_CDN_BASE}/profiles/{user_id}/avatar.webp"
    assert f"profiles/{user_id}/avatar.jpg" not in mock_profile_media_r2
    assert mock_profile_media_r2[f"profiles/{user_id}/avatar.webp"] == MINIMAL_WEBP_BYTES


@pytest.mark.asyncio
async def test_upload_avatar_unauthenticated(auth_client: AsyncClient) -> None:
    response = await auth_client.post(
        "/api/v1/profile/me/avatar",
        files=_upload_file(
            content=MINIMAL_JPEG_BYTES,
            filename="avatar.jpg",
            content_type="image/jpeg",
        ),
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_upload_avatar_invalid_type(auth_client: AsyncClient) -> None:
    data = await _register(auth_client, {}, suffix="avatar-type")
    response = await auth_client.post(
        "/api/v1/profile/me/avatar",
        headers=_auth_headers(data["access_token"]),
        files=_upload_file(
            content=FAKE_MP4_BYTES,
            filename="clip.mp4",
            content_type="video/mp4",
        ),
    )
    assert response.status_code == 400
    assert response.json()["code"] == "PROFILE_MEDIA_INVALID_TYPE"


@pytest.mark.asyncio
async def test_upload_avatar_invalid_content(auth_client: AsyncClient) -> None:
    data = await _register(auth_client, {}, suffix="avatar-content")
    response = await auth_client.post(
        "/api/v1/profile/me/avatar",
        headers=_auth_headers(data["access_token"]),
        files=_upload_file(
            content=FAKE_MP4_BYTES,
            filename="fake.jpg",
            content_type="image/jpeg",
        ),
    )
    assert response.status_code == 400
    assert response.json()["code"] == "PROFILE_MEDIA_INVALID_CONTENT"


@pytest.mark.asyncio
async def test_upload_avatar_too_large(auth_client: AsyncClient) -> None:
    data = await _register(auth_client, {}, suffix="avatar-large")
    oversized = MINIMAL_JPEG_BYTES + (b"\x00" * (PROFILE_AVATAR_MAX_BYTES + 1))
    response = await auth_client.post(
        "/api/v1/profile/me/avatar",
        headers=_auth_headers(data["access_token"]),
        files=_upload_file(
            content=oversized,
            filename="large.jpg",
            content_type="image/jpeg",
        ),
    )
    assert response.status_code == 400
    assert response.json()["code"] == "PROFILE_MEDIA_TOO_LARGE"


@pytest.mark.asyncio
async def test_upload_banner_too_large(auth_client: AsyncClient) -> None:
    data = await _register(auth_client, {}, suffix="banner-large")
    oversized = MINIMAL_PNG_BYTES + (b"\x00" * (PROFILE_BANNER_MAX_BYTES + 1))
    response = await auth_client.post(
        "/api/v1/profile/me/banner",
        headers=_auth_headers(data["access_token"]),
        files=_upload_file(
            content=oversized,
            filename="large.png",
            content_type="image/png",
        ),
    )
    assert response.status_code == 400
    assert response.json()["code"] == "PROFILE_MEDIA_TOO_LARGE"


@pytest.mark.asyncio
async def test_upload_avatar_persists_after_refresh(
    auth_client: AsyncClient,
    mock_profile_media_r2: dict[str, bytes],
) -> None:
    data: dict[str, Any] = await _register(auth_client, {}, suffix="avatar-persist")
    token = data["access_token"]
    user_id = data["user"]["id"]

    upload = await auth_client.post(
        "/api/v1/profile/me/avatar",
        headers=_auth_headers(token),
        files=_upload_file(
            content=MINIMAL_JPEG_BYTES,
            filename="avatar.jpg",
            content_type="image/jpeg",
        ),
    )
    assert upload.status_code == 200
    avatar_url = upload.json()["avatar_url"]

    profile = await auth_client.get("/api/v1/profile/me", headers=_auth_headers(token))
    assert profile.status_code == 200
    assert profile.json()["avatar_url"] == avatar_url
    assert avatar_url == f"{PROFILE_MEDIA_CDN_BASE}/profiles/{user_id}/avatar.jpg"
