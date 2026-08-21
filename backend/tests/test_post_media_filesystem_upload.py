"""POST /posts/media filesystem backend integration (C3.1-R1D)."""

from __future__ import annotations

from collections.abc import Iterator
from io import BytesIO
from pathlib import Path
from typing import Any, cast

import pytest
from app.core.config import get_settings
from app.core.story_constants import STORY_MEDIA_MAX_BYTES
from httpx import AsyncClient

from tests.media_fixtures import MINIMAL_JPEG_BYTES, MINIMAL_PNG_BYTES, MINIMAL_WEBP_BYTES
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


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _upload_file(
    *,
    content: bytes,
    filename: str,
    content_type: str,
) -> dict[str, tuple[str, BytesIO, str]]:
    return {"file": (filename, BytesIO(content), content_type)}


async def _upload(
    client: AsyncClient,
    token: str,
    *,
    content: bytes,
    filename: str,
    content_type: str,
) -> Any:
    return await client.post(
        "/api/v1/posts/media",
        headers=_auth_headers(token),
        files=_upload_file(content=content, filename=filename, content_type=content_type),
    )


@pytest.mark.asyncio
async def test_unauthenticated_upload_rejected(auth_client: AsyncClient) -> None:
    response = await auth_client.post(
        "/api/v1/posts/media",
        files=_upload_file(
            content=MINIMAL_PNG_BYTES,
            filename="photo.png",
            content_type="image/png",
        ),
    )
    assert response.status_code == 401


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("content", "filename", "content_type"),
    [
        (MINIMAL_PNG_BYTES, "photo.png", "image/png"),
        (MINIMAL_JPEG_BYTES, "photo.jpg", "image/jpeg"),
        (MINIMAL_WEBP_BYTES, "photo.webp", "image/webp"),
    ],
)
async def test_upload_valid_image_success(
    auth_client: AsyncClient,
    filesystem_media_env: Path,
    content: bytes,
    filename: str,
    content_type: str,
) -> None:
    auth = await _register(auth_client, f"fs-{content_type.split('/')[-1]}")
    response = await _upload(
        auth_client,
        auth["access_token"],
        content=content,
        filename=f"../../{filename}",
        content_type=content_type,
    )
    assert response.status_code == 201, response.text
    body = cast(dict[str, Any], response.json())
    url = body["url"]
    assert url.startswith("/api/v1/story-media/")
    assert "localhost" not in url
    assert "127.0.0.1" not in url
    files = [path for path in filesystem_media_env.rglob("*") if path.is_file()]
    assert len(files) == 1
    assert files[0].read_bytes() == content
    assert ".." not in files[0].parts

    fetched = await auth_client.get(url)
    assert fetched.status_code == 200
    assert fetched.headers["content-type"].split(";")[0] == content_type
    assert fetched.headers["x-content-type-options"] == "nosniff"
    assert fetched.content == content


@pytest.mark.asyncio
async def test_upload_mismatch_magic_bytes_rejected(
    auth_client: AsyncClient,
    filesystem_media_env: Path,
) -> None:
    auth = await _register(auth_client, "fs-mismatch")
    response = await _upload(
        auth_client,
        auth["access_token"],
        content=b"<html>not an image</html>",
        filename="photo.png",
        content_type="image/png",
    )
    assert response.status_code == 400
    assert response.json()["code"] == "STORY_MEDIA_INVALID_CONTENT"
    assert [path for path in filesystem_media_env.rglob("*") if path.is_file()] == []


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("content_type", "filename"),
    [("image/svg+xml", "photo.svg"), ("text/html", "photo.html")],
)
async def test_upload_svg_html_rejected(
    auth_client: AsyncClient,
    filesystem_media_env: Path,
    content_type: str,
    filename: str,
) -> None:
    auth = await _register(auth_client, f"fs-{filename}")
    response = await _upload(
        auth_client,
        auth["access_token"],
        content=b"<svg xmlns='http://www.w3.org/2000/svg'></svg>",
        filename=filename,
        content_type=content_type,
    )
    assert response.status_code == 400
    assert response.json()["code"] == "STORY_MEDIA_INVALID_TYPE"
    assert [path for path in filesystem_media_env.rglob("*") if path.is_file()] == []


@pytest.mark.asyncio
async def test_upload_too_large_rejected(
    auth_client: AsyncClient,
    filesystem_media_env: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.services.story_media_service.STORY_MEDIA_MAX_BYTES", 32)
    auth = await _register(auth_client, "fs-large")
    response = await _upload(
        auth_client,
        auth["access_token"],
        content=MINIMAL_PNG_BYTES + b"x" * 64,
        filename="photo.png",
        content_type="image/png",
    )
    assert response.status_code == 400
    assert response.json()["code"] == "STORY_MEDIA_TOO_LARGE"
    assert [path for path in filesystem_media_env.rglob("*") if path.is_file()] == []
    assert STORY_MEDIA_MAX_BYTES == 20 * 1024 * 1024


@pytest.mark.asyncio
async def test_create_post_then_reload_media(auth_client: AsyncClient) -> None:
    auth = await _register(auth_client, "fs-post")
    token = auth["access_token"]
    uploaded = await _upload(
        auth_client,
        token,
        content=MINIMAL_PNG_BYTES,
        filename="photo.png",
        content_type="image/png",
    )
    assert uploaded.status_code == 201, uploaded.text
    media_url = uploaded.json()["url"]
    created = await auth_client.post(
        "/api/v1/posts",
        headers=_auth_headers(token),
        json={"body": "Post photo QA", "media_url": media_url},
    )
    assert created.status_code == 201, created.text
    assert created.json()["media_url"] == media_url
    post_id = created.json()["id"]
    reloaded = await auth_client.get(f"/api/v1/posts/{post_id}", headers=_auth_headers(token))
    assert reloaded.status_code == 200
    assert reloaded.json()["media_url"] == media_url
    fetched = await auth_client.get(media_url)
    assert fetched.status_code == 200
    assert fetched.content == MINIMAL_PNG_BYTES
