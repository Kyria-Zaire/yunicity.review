"""Profile avatar/banner upload via filesystem backend (dev)."""

from __future__ import annotations

from collections.abc import Iterator
from io import BytesIO
from pathlib import Path

import pytest
from app.core.config import get_settings
from httpx import AsyncClient

from tests.media_fixtures import MINIMAL_JPEG_BYTES, MINIMAL_PNG_BYTES
from tests.test_profile_endpoints import _auth_headers, _register

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture(autouse=True)
def filesystem_profile_media_env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[Path]:
    root = tmp_path / "profile-media"
    root.mkdir()
    monkeypatch.setenv("APP_ENV", "dev")
    monkeypatch.setenv("PROFILE_MEDIA_STORAGE_BACKEND", "filesystem")
    monkeypatch.setenv("PROFILE_MEDIA_UPLOAD_DIR", str(root))
    monkeypatch.delenv("RAILWAY_ENVIRONMENT", raising=False)
    monkeypatch.delenv("RAILWAY_PROJECT_ID", raising=False)
    get_settings.cache_clear()
    yield root
    get_settings.cache_clear()


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
async def test_upload_avatar_filesystem_success(
    auth_client: AsyncClient,
    filesystem_profile_media_env: Path,
) -> None:
    # `_register` derive l'email du suffixe et renvoie la reponse d'inscription complete.
    registration = await _register(auth_client, {}, suffix="-fs-avatar")
    token = registration["access_token"]

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
    avatar_url = body["avatar_url"]
    assert avatar_url.startswith("/api/v1/profile-media/")
    assert avatar_url.endswith("/avatar.jpg")

    stored = list(filesystem_profile_media_env.rglob("avatar.jpg"))
    assert len(stored) == 1
    assert stored[0].read_bytes() == MINIMAL_JPEG_BYTES

    get_response = await auth_client.get(avatar_url)
    assert get_response.status_code == 200
    assert get_response.headers["content-type"].startswith("image/jpeg")


@pytest.mark.asyncio
async def test_upload_banner_filesystem_success(
    auth_client: AsyncClient,
    filesystem_profile_media_env: Path,
) -> None:
    registration = await _register(auth_client, {}, suffix="-fs-banner")
    token = registration["access_token"]

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
    banner_url = body["banner_url"]
    assert banner_url.startswith("/api/v1/profile-media/")
    assert banner_url.endswith("/banner.png")

    stored = list(filesystem_profile_media_env.rglob("banner.png"))
    assert len(stored) == 1
    assert stored[0].read_bytes() == MINIMAL_PNG_BYTES

    get_response = await auth_client.get(banner_url)
    assert get_response.status_code == 200
    assert get_response.headers["content-type"].startswith("image/png")
