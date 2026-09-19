"""Lecture R2 protegee : autorisation, flux, Range, aucune redirection CDN.

Le backend R2 renvoyait une URL CDN absolue : l'objet etait joignable sans passer par
l'autorisation d'audience. Il est desormais lu COTE SERVEUR et relaye. Ces tests
verrouillent le contrat avec un client R2 mocke -- aucun reseau, aucun objet reel.
"""

from __future__ import annotations

import uuid
from collections.abc import Iterator
from io import BytesIO
from typing import Any, cast
from unittest.mock import MagicMock, patch

import pytest
from app.core.config import get_settings
from botocore.exceptions import ClientError  # type: ignore[import-untyped]
from httpx import AsyncClient

from tests.media_fixtures import MINIMAL_JPEG_BYTES
from tests.test_stories_api import _register

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

CDN_BASE = "https://media.yunicity.city"
PAYLOAD = MINIMAL_JPEG_BYTES + b"\x00" * 512


@pytest.fixture(autouse=True)
def r2_backend_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    monkeypatch.setenv("APP_ENV", "dev")
    monkeypatch.setenv("STORY_MEDIA_STORAGE_BACKEND", "r2")
    monkeypatch.setenv("LOCAL_VIDEO_CDN_BASE_URL", CDN_BASE)
    monkeypatch.setenv("LOCAL_VIDEO_R2_ENDPOINT", "https://r2.example.invalid")
    monkeypatch.setenv("LOCAL_VIDEO_R2_BUCKET", "bucket-test")
    monkeypatch.setenv("LOCAL_VIDEO_R2_ACCESS_KEY_ID", "test-key-id")
    monkeypatch.setenv("LOCAL_VIDEO_R2_SECRET_ACCESS_KEY", "test-secret")
    monkeypatch.delenv("RAILWAY_ENVIRONMENT", raising=False)
    monkeypatch.delenv("RAILWAY_PROJECT_ID", raising=False)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def disable_auth_rate_limits(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(*_a: object, **_k: object) -> None:
        return None

    monkeypatch.setattr("app.api.v1.auth.enforce_rate_limit", _noop)
    monkeypatch.setattr("app.api.v1.posts.enforce_rate_limit", _noop)


def _fake_r2(payload: bytes | None = PAYLOAD) -> MagicMock:
    """Client R2 mocke : honore Range, signale l'absence d'objet."""
    client = MagicMock()

    def get_object(**kwargs: Any) -> dict[str, Any]:
        if payload is None:
            raise ClientError({"Error": {"Code": "NoSuchKey"}}, "GetObject")
        rng = kwargs.get("Range")
        if rng:
            start, end = rng.removeprefix("bytes=").split("-")
            lo = int(start)
            hi = int(end) if end else len(payload) - 1
            chunk = payload[lo : hi + 1]
            return {
                "Body": BytesIO(chunk),
                "ContentType": "image/jpeg",
                "ContentLength": len(chunk),
                "ContentRange": f"bytes {lo}-{hi}/{len(payload)}",
            }
        return {
            "Body": BytesIO(payload),
            "ContentType": "image/jpeg",
            "ContentLength": len(payload),
        }

    client.get_object.side_effect = get_object
    return client


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _story_on_r2(
    client: AsyncClient, suffix: str, *, absolute_legacy_url: bool = False
) -> tuple[dict[str, Any], str, str]:
    """Cree une story dont le media vit sur R2. Renvoie (auth, chemin API, cle)."""
    auth = await _register(client, suffix)
    user_id = auth["user"]["id"]
    media_id = uuid.uuid4()
    key = f"stories/{user_id}/{media_id}.jpg"
    api_path = f"/api/v1/story-media/{user_id}/{media_id}.jpg"
    stored = f"{CDN_BASE}/{key}" if absolute_legacy_url else api_path
    response = await client.post(
        "/api/v1/stories",
        headers=_headers(auth["access_token"]),
        json={"media_url": stored, "caption": "Story R2", "category": "culture"},
    )
    assert response.status_code == 201, response.text
    return auth, api_path, key


class TestR2Authorization:
    async def test_the_owner_reads_the_object_through_the_api(
        self, auth_client: AsyncClient
    ) -> None:
        auth, path, _storage_ref = await _story_on_r2(auth_client, "r2-owner")
        with patch("app.services.story_media.r2_storage.boto3.client", return_value=_fake_r2()):
            response = await auth_client.get(path, headers=_headers(auth["access_token"]))
        assert response.status_code == 200
        assert response.content == PAYLOAD
        assert response.headers["content-type"].startswith("image/jpeg")

    async def test_another_citizen_reads_a_public_story(self, auth_client: AsyncClient) -> None:
        _auth, path, _storage_ref = await _story_on_r2(auth_client, "r2-viewer")
        other = await _register(auth_client, "r2-viewer-other")
        with patch("app.services.story_media.r2_storage.boto3.client", return_value=_fake_r2()):
            response = await auth_client.get(path, headers=_headers(other["access_token"]))
        assert response.status_code == 200

    async def test_a_forbidden_user_gets_404(self, auth_client: AsyncClient) -> None:
        stranger = await _register(auth_client, "r2-stranger")
        forged = f"/api/v1/story-media/{uuid.uuid4()}/{uuid.uuid4()}.jpg"
        with patch(
            "app.services.story_media.r2_storage.boto3.client", return_value=_fake_r2()
        ) as factory:
            response = await auth_client.get(forged, headers=_headers(stranger["access_token"]))
        assert response.status_code == 404
        assert PAYLOAD not in response.content
        factory.return_value.get_object.assert_not_called()

    async def test_anonymous_is_refused(self, auth_client: AsyncClient) -> None:
        _auth, path, _storage_ref = await _story_on_r2(auth_client, "r2-anon")
        with patch("app.services.story_media.r2_storage.boto3.client", return_value=_fake_r2()):
            response = await auth_client.get(path)
        assert response.status_code == 401
        assert PAYLOAD not in response.content

    async def test_a_missing_object_is_a_clean_404(self, auth_client: AsyncClient) -> None:
        auth, path, _storage_ref = await _story_on_r2(auth_client, "r2-missing")
        with patch(
            "app.services.story_media.r2_storage.boto3.client", return_value=_fake_r2(None)
        ):
            response = await auth_client.get(path, headers=_headers(auth["access_token"]))
        assert response.status_code == 404


class TestR2StreamingAndRange:
    async def test_an_authorized_range_returns_206(self, auth_client: AsyncClient) -> None:
        auth, path, _storage_ref = await _story_on_r2(auth_client, "r2-range")
        with patch(
            "app.services.story_media.r2_storage.boto3.client", return_value=_fake_r2()
        ) as factory:
            response = await auth_client.get(
                path, headers={**_headers(auth["access_token"]), "Range": "bytes=0-99"}
            )
        assert response.status_code == 206
        assert response.content == PAYLOAD[:100]
        assert response.headers["content-range"] == f"bytes 0-99/{len(PAYLOAD)}"
        assert response.headers["accept-ranges"] == "bytes"
        assert factory.return_value.get_object.call_args.kwargs["Range"] == "bytes=0-99"

    async def test_an_unauthorized_range_leaks_no_byte(self, auth_client: AsyncClient) -> None:
        _auth, path, _storage_ref = await _story_on_r2(auth_client, "r2-range-ko")
        with patch("app.services.story_media.r2_storage.boto3.client", return_value=_fake_r2()):
            response = await auth_client.get(path, headers={"Range": "bytes=0-99"})
        assert response.status_code == 401
        assert PAYLOAD[:100] not in response.content

    async def test_no_cdn_redirect_ever(self, auth_client: AsyncClient) -> None:
        auth, path, _storage_ref = await _story_on_r2(auth_client, "r2-redirect")
        with patch("app.services.story_media.r2_storage.boto3.client", return_value=_fake_r2()):
            response = await auth_client.get(
                path, headers=_headers(auth["access_token"]), follow_redirects=False
            )
        assert response.status_code == 200
        assert "location" not in {k.lower() for k in response.headers}

    async def test_private_cache_headers(self, auth_client: AsyncClient) -> None:
        auth, path, _storage_ref = await _story_on_r2(auth_client, "r2-cache")
        with patch("app.services.story_media.r2_storage.boto3.client", return_value=_fake_r2()):
            response = await auth_client.get(path, headers=_headers(auth["access_token"]))
        assert response.headers["cache-control"] == "private, no-store"
        assert response.headers["x-content-type-options"] == "nosniff"


class TestLegacyAbsoluteUrls:
    async def test_a_legacy_absolute_url_is_recognised_by_the_policy(
        self, auth_client: AsyncClient
    ) -> None:
        _auth, path, _storage_ref = await _story_on_r2(
            auth_client, "r2-legacy", absolute_legacy_url=True
        )
        other = await _register(auth_client, "legacy-peer")
        with patch("app.services.story_media.r2_storage.boto3.client", return_value=_fake_r2()):
            response = await auth_client.get(path, headers=_headers(other["access_token"]))
        assert response.status_code == 200, "l'ancienne forme doit resoudre"
        assert "location" not in {k.lower() for k in response.headers}


class TestFilesystemNotRegressed:
    async def test_the_filesystem_backend_still_serves_its_own_media(
        self, auth_client: AsyncClient, monkeypatch: pytest.MonkeyPatch, tmp_path: Any
    ) -> None:
        monkeypatch.setenv("STORY_MEDIA_STORAGE_BACKEND", "filesystem")
        monkeypatch.setenv("STORY_MEDIA_UPLOAD_DIR", str(tmp_path))
        get_settings.cache_clear()
        auth = await _register(auth_client, "fs-nonreg")
        upload = await auth_client.post(
            "/api/v1/posts/media",
            headers=_headers(auth["access_token"]),
            files={"file": ("p.jpg", BytesIO(MINIMAL_JPEG_BYTES), "image/jpeg")},
        )
        assert upload.status_code in (200, 201), upload.text
        url = cast(str, upload.json()["url"])
        assert url.startswith("/api/v1/story-media/")
        response = await auth_client.get(url, headers=_headers(auth["access_token"]))
        assert response.status_code == 200
        assert response.content == MINIMAL_JPEG_BYTES
        assert response.headers["cache-control"] == "private, no-store"
