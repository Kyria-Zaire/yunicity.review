"""MEDIA-01B — chaîne upload → URL relative → GET authentifié → image/jpeg.

Prouve que l'objet est réellement récupérable par un citoyen authentifié autorisé
à voir le post, sans affaiblir la route story-media.
"""

from __future__ import annotations

from collections.abc import Iterator
from io import BytesIO
from pathlib import Path
from typing import cast

import pytest
from app.core.config import get_settings
from httpx import AsyncClient

from tests.media_fixtures import MINIMAL_JPEG_BYTES
from tests.test_stories_api import _register

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture(autouse=True)
def filesystem_media_env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[Path]:
    root = tmp_path / "story-media"
    root.mkdir()
    monkeypatch.setenv("APP_ENV", "dev")
    monkeypatch.setenv("STORY_MEDIA_STORAGE_BACKEND", "filesystem")
    monkeypatch.setenv("STORY_MEDIA_UPLOAD_DIR", str(root))
    monkeypatch.delenv("RAILWAY_ENVIRONMENT", raising=False)
    monkeypatch.delenv("RAILWAY_PROJECT_ID", raising=False)
    get_settings.cache_clear()
    yield root
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def disable_auth_rate_limits(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr("app.api.v1.auth.enforce_rate_limit", _noop)
    monkeypatch.setattr("app.api.v1.posts.enforce_rate_limit", _noop)


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_media01b_feed_post_image_delivery_chain(auth_client: AsyncClient) -> None:
    owner = await _register(auth_client, "m01b-owner")
    viewer = await _register(auth_client, "m01b-viewer")
    token = owner["access_token"]

    upload = await auth_client.post(
        "/api/v1/posts/media",
        headers=_headers(token),
        files={"file": ("photo.jpg", BytesIO(MINIMAL_JPEG_BYTES), "image/jpeg")},
    )
    assert upload.status_code == 201, upload.text
    media_url = cast(str, upload.json()["url"])
    assert media_url.startswith("/api/v1/story-media/")
    assert not media_url.startswith("blob:")
    assert "http://" not in media_url and "https://" not in media_url

    # Propriétaire : lecture avant publication (composer).
    pre = await auth_client.get(media_url, headers=_headers(token))
    assert pre.status_code == 200
    assert pre.headers["content-type"].startswith("image/jpeg")
    assert pre.content[:3] == b"\xff\xd8\xff"
    assert pre.content == MINIMAL_JPEG_BYTES

    created = await auth_client.post(
        "/api/v1/posts",
        headers=_headers(token),
        json={
            "author_type": "citizen",
            "body": "MEDIA-01B delivery proof",
            "media_url": media_url,
            "visibility": "public",
        },
    )
    assert created.status_code == 201, created.text
    assert created.json()["media_url"] == media_url

    # Spectateur authentifié autorisé (audience publique).
    other = await auth_client.get(media_url, headers=_headers(viewer["access_token"]))
    assert other.status_code == 200
    assert other.headers["content-type"].startswith("image/jpeg")
    assert other.content[:3] == b"\xff\xd8\xff"
    assert other.content == MINIMAL_JPEG_BYTES

    # Auth absente → 401 (pas d'affaiblissement anonyme).
    anon = await auth_client.get(media_url)
    assert anon.status_code == 401
    assert MINIMAL_JPEG_BYTES not in anon.content

    # Objet absent → 404 maîtrisé pour le propriétaire.
    missing = media_url.rsplit("/", 1)[0] + "/00000000-0000-4000-8000-000000000099.jpg"
    gone = await auth_client.get(missing, headers=_headers(token))
    assert gone.status_code == 404
