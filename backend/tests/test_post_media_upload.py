"""Post composer media upload integration tests (FEED-POST-COMPOSER-01)."""

from __future__ import annotations

from collections.abc import Generator, Iterator
from io import BytesIO
from unittest.mock import MagicMock, patch

import pytest
from app.core.config import get_settings
from app.integrations.redis import get_redis_client
from httpx import AsyncClient

from tests.media_fixtures import MINIMAL_JPEG_BYTES
from tests.test_stories_api import _register

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

POST_MEDIA_CDN_BASE = "https://media.test.local"
POST_MEDIA_BUCKET = "yunicity-media-test"


@pytest.fixture(autouse=True)
def post_media_r2_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Ces tests portent sur le backend R2 : ils l'exigent EXPLICITEMENT.

    Sans cela, ils héritaient de la configuration du conteneur — la stack QA force
    ``STORY_MEDIA_STORAGE_BACKEND=filesystem`` — et recevaient une URL relative
    ``/api/v1/story-media/...`` au lieu de l'URL CDN attendue. Le nettoyage du cache
    au teardown empêche la configuration R2 de fuir vers les tests suivants.
    """
    monkeypatch.setenv("STORY_MEDIA_STORAGE_BACKEND", "r2")
    monkeypatch.setenv("LOCAL_VIDEO_R2_ENDPOINT", "https://example.r2.cloudflarestorage.com")
    monkeypatch.setenv("LOCAL_VIDEO_R2_BUCKET", POST_MEDIA_BUCKET)
    monkeypatch.setenv("LOCAL_VIDEO_R2_ACCESS_KEY_ID", "test-access-key")
    monkeypatch.setenv("LOCAL_VIDEO_R2_SECRET_ACCESS_KEY", "test-secret-key")
    monkeypatch.setenv("LOCAL_VIDEO_CDN_BASE_URL", POST_MEDIA_CDN_BASE)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def mock_post_media_r2() -> Generator[dict[str, bytes], None, None]:
    stored: dict[str, bytes] = {}
    mock_client = MagicMock()

    def _put_object(*, Bucket: str, Key: str, Body: bytes, ContentType: str) -> None:
        assert Bucket == POST_MEDIA_BUCKET
        stored[Key] = bytes(Body)

    mock_client.put_object.side_effect = _put_object

    with patch("app.services.story_media.r2_storage.boto3.client", return_value=mock_client):
        yield stored


@pytest.fixture(autouse=True)
def disable_auth_rate_limits(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(*_args: object, **_kwargs: object) -> None:
        return None

    # Only auth register is noop'd; the posts media rate limit stays active
    # so test_upload_post_media_rate_limited_after_quota exercises the real 429 path.
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
async def test_upload_post_media_success(
    auth_client: AsyncClient,
    mock_post_media_r2: dict[str, bytes],
) -> None:
    auth = await _register(auth_client, "post-media-ok")
    token = auth["access_token"]

    response = await auth_client.post(
        "/api/v1/posts/media",
        headers=_auth_headers(token),
        files=_upload_file(
            content=MINIMAL_JPEG_BYTES,
            filename="photo.jpg",
            content_type="image/jpeg",
        ),
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["media_type"] == "image"
    # L'URL enregistree est la route protegee ; la CLE d'objet s'en deduit, elle n'est
    # plus derivable d'un prefixe CDN.
    assert body["url"].startswith("/api/v1/story-media/")
    assert POST_MEDIA_CDN_BASE not in body["url"]
    _, _, _, _, url_user_id, url_filename = body["url"].split("/")
    storage_key = f"stories/{url_user_id}/{url_filename}"
    assert mock_post_media_r2[storage_key] == MINIMAL_JPEG_BYTES


@pytest.mark.asyncio
async def test_upload_post_media_rate_limited_after_quota(
    auth_client: AsyncClient,
    mock_post_media_r2: dict[str, bytes],
) -> None:
    if get_redis_client() is None:
        pytest.skip("Redis indisponible — rate limiting no-op")

    auth = await _register(auth_client, "post-media-rl")
    token = auth["access_token"]
    headers = _auth_headers(token)

    for index in range(60):
        response = await auth_client.post(
            "/api/v1/posts/media",
            headers=headers,
            files=_upload_file(
                content=MINIMAL_JPEG_BYTES,
                filename=f"photo-{index}.jpg",
                content_type="image/jpeg",
            ),
        )
        assert response.status_code == 201, f"upload {index}: {response.text}"

    blocked = await auth_client.post(
        "/api/v1/posts/media",
        headers=headers,
        files=_upload_file(
            content=MINIMAL_JPEG_BYTES,
            filename="photo-blocked.jpg",
            content_type="image/jpeg",
        ),
    )
    assert blocked.status_code == 429, blocked.text
    assert blocked.json()["code"] == "RATE_LIMITED"
