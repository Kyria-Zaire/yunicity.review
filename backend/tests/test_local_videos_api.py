"""Local Video API tests (FEATURE-CREATORS-V2 / C2-S1, C2-S2-00)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta
from typing import Any, cast

import pytest
from app.core.config import get_settings
from app.core.local_video_constants import (
    LocalVideoProcessingStatus,
    LocalVideoStatus,
    LocalVideoType,
)
from app.db.session import get_session_factory
from app.integrations.redis import get_redis_client
from app.models.local_video import LocalVideo
from app.services.local_video.processor import LocalVideoProcessResult
from httpx import AsyncClient
from sqlalchemy import update

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
    def _fake_process(self, *, source_storage_key, city_slug, video_id, content_type):  # type: ignore[no-untyped-def]
        del self, content_type, source_storage_key
        return LocalVideoProcessResult(
            duration_seconds=12.5,
            media_width=1080,
            media_height=1920,
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
    worker inline with a stubbed processor so published videos reach PUBLISHED and appear
    in the feed within each test — otherwise the feed is empty / GET returns PROCESSING."""


@pytest.fixture
def noop_enqueue(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(video_id: uuid.UUID, *, settings=None) -> str:  # type: ignore[no-untyped-def]
        del settings
        return f"local-video:{video_id}"

    monkeypatch.setattr(
        "app.services.local_video.job_queue.enqueue_local_video_processing",
        _noop,
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
    return cast(dict[str, Any], response.json())


@pytest.mark.asyncio
async def test_binary_upload_endpoint_unavailable_for_r2(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("LOCAL_VIDEO_STORAGE_BACKEND", "r2")
    monkeypatch.setenv(
        "LOCAL_VIDEO_R2_ENDPOINT",
        "https://example.r2.cloudflarestorage.com",
    )
    monkeypatch.setenv("LOCAL_VIDEO_R2_BUCKET", "bucket")
    monkeypatch.setenv("LOCAL_VIDEO_R2_ACCESS_KEY_ID", "key")
    monkeypatch.setenv("LOCAL_VIDEO_R2_SECRET_ACCESS_KEY", "secret")
    get_settings.cache_clear()

    response = await auth_client.put(
        f"{BASE}/uploads/{uuid.uuid4()}/binary",
        content=b"fake-mp4-bytes",
        headers={"Content-Type": "video/mp4"},
    )
    assert response.status_code == 404
    assert response.json()["code"] == "LOCAL_VIDEO_BINARY_ENDPOINT_UNAVAILABLE"
    get_settings.cache_clear()


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
    assert body["storage_key"].startswith("local-video/reims/")
    assert body["storage_key"].endswith("/source.mp4")
    assert body["upload_method"] == "PUT"
    assert body["upload_headers"]["Content-Type"] == "video/mp4"


@pytest.mark.asyncio
async def test_upload_init_prod_requires_city_slug(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("APP_ENV", "prod")
    # Booting Settings in prod enforces stricter rules (secure cookies, no localhost URLs,
    # a real email provider…). Provide a valid prod config so the app can start; this test
    # only exercises the prod city-slug branch of upload-init, not the config validation.
    for _key, _value in {
        "DEBUG": "false",
        "REFRESH_COOKIE_SECURE": "true",
        "WEB_FRONTEND_URL": "https://app.yunicity.city",
        "CORS_ORIGINS": '["https://app.yunicity.city"]',
        "MEDIA_PUBLIC_BASE_URL": "https://media.yunicity.city",
        "EMAIL_PROVIDER": "console",
    }.items():
        monkeypatch.setenv(_key, _value)
    get_settings.cache_clear()
    user = await _register(auth_client)
    response = await auth_client.post(
        f"{BASE}/upload-init",
        json={
            "filename": "clip.mp4",
            "content_type": "video/mp4",
            "file_size_bytes": 1024,
        },
        headers=auth_header(user["access_token"]),
    )
    assert response.status_code == 400
    assert response.json()["code"] == "LOCAL_VIDEO_CITY_SLUG_REQUIRED"
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_publish_flow(
    auth_client: AsyncClient,
    mock_processor: None,
) -> None:
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
    assert publish_response.status_code == 202, publish_response.text
    accepted = publish_response.json()
    assert accepted["status"] == LocalVideoStatus.PROCESSING.value
    assert accepted["processing_status"] == LocalVideoProcessingStatus.PROCESSING.value
    assert accepted["job_id"]

    get_response = await auth_client.get(
        f"{BASE}/{accepted['id']}",
        headers=auth_header(user["access_token"]),
    )
    assert get_response.status_code == 200
    published = get_response.json()
    assert published["id"] == accepted["id"]
    assert published["status"] == LocalVideoStatus.PUBLISHED.value
    assert published["processing_status"] == LocalVideoProcessingStatus.READY.value
    assert published["duration_seconds"] == 12.5
    assert published["media_url"]
    assert published["thumbnail_url"]
    assert published["neighborhood_id"] == BOULINGRIN_ID


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
    noop_enqueue: None,
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
    assert first.status_code == 202, first.text

    second = await auth_client.post(
        BASE,
        json=payload,
        headers=auth_header(user["access_token"]),
    )
    assert second.status_code == 409
    assert second.json()["code"] == "LOCAL_VIDEO_UPLOAD_ALREADY_USED"


async def _publish_video(
    auth_client: AsyncClient,
    token: str,
    *,
    city: str = "Reims",
    title: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
) -> dict[str, Any]:
    init_body = await _init_upload(auth_client, token)
    await auth_client.put(
        init_body["presigned_url"],
        content=b"fake-mp4-bytes-for-test",
        headers={"Content-Type": "video/mp4"},
    )
    payload: dict[str, Any] = {
        "upload_id": init_body["upload_id"],
        "city": city,
        "neighborhood_id": BOULINGRIN_ID,
        "video_type": LocalVideoType.MOMENT.value,
    }
    if title is not None:
        payload["title"] = title
    if latitude is not None:
        payload["latitude"] = latitude
    if longitude is not None:
        payload["longitude"] = longitude
    response = await auth_client.post(
        BASE,
        json=payload,
        headers=auth_header(token),
    )
    assert response.status_code == 202, response.text
    return cast(dict[str, Any], response.json())


async def _set_video_status(video_id: str, status: LocalVideoStatus) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        await session.execute(
            update(LocalVideo)
            .where(LocalVideo.id == uuid.UUID(video_id))
            .values(status=status.value)
        )
        await session.commit()


async def _set_video_published_at(video_id: str, published_at: datetime) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        await session.execute(
            update(LocalVideo)
            .where(LocalVideo.id == uuid.UUID(video_id))
            .values(published_at=published_at)
        )
        await session.commit()


@pytest.mark.asyncio
async def test_feed_requires_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.get(f"{BASE}/feed")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_feed_returns_only_published(
    auth_client: AsyncClient,
    mock_processor: None,
) -> None:
    user = await _register(auth_client)
    token = user["access_token"]
    published = await _publish_video(auth_client, token, title="Visible")
    hidden = await _publish_video(auth_client, token, title="Hidden soon")
    await _set_video_status(hidden["id"], LocalVideoStatus.PROCESSING)

    response = await auth_client.get(
        f"{BASE}/feed",
        params={"city": "Reims", "limit": 10},
        headers=auth_header(token),
    )
    assert response.status_code == 200, response.text
    body = response.json()
    ids = {item["id"] for item in body["items"]}
    assert published["id"] in ids
    assert hidden["id"] not in ids
    assert all(item["status"] == LocalVideoStatus.PUBLISHED.value for item in body["items"])


@pytest.mark.asyncio
async def test_feed_filters_by_city(
    auth_client: AsyncClient,
    mock_processor: None,
) -> None:
    user = await _register(auth_client)
    token = user["access_token"]
    await _publish_video(auth_client, token, city="Reims", title="Reims clip")

    response = await auth_client.get(
        f"{BASE}/feed",
        params={"city": "Paris", "limit": 10},
        headers=auth_header(token),
    )
    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["city"] == "Paris"


@pytest.mark.asyncio
async def test_feed_pagination_limit_and_cursor(
    auth_client: AsyncClient,
    mock_processor: None,
) -> None:
    user = await _register(auth_client)
    token = user["access_token"]
    await _publish_video(auth_client, token, title="Third")
    await _publish_video(auth_client, token, title="Second")
    await _publish_video(auth_client, token, title="First")

    first_page = await auth_client.get(
        f"{BASE}/feed",
        params={"city": "Reims", "limit": 2},
        headers=auth_header(token),
    )
    assert first_page.status_code == 200, first_page.text
    first_body = first_page.json()
    assert len(first_body["items"]) == 2
    assert first_body["next_cursor"]

    second_page = await auth_client.get(
        f"{BASE}/feed",
        params={"city": "Reims", "limit": 2, "cursor": first_body["next_cursor"]},
        headers=auth_header(token),
    )
    assert second_page.status_code == 200
    second_body = second_page.json()
    assert len(second_body["items"]) == 1
    assert second_body["next_cursor"] is None

    first_ids = {item["id"] for item in first_body["items"]}
    second_ids = {item["id"] for item in second_body["items"]}
    assert first_ids.isdisjoint(second_ids)


@pytest.mark.asyncio
async def test_feed_distance_null_without_coordinates(
    auth_client: AsyncClient,
    mock_processor: None,
) -> None:
    user = await _register(auth_client)
    token = user["access_token"]
    await _publish_video(auth_client, token, latitude=49.2583, longitude=4.0317)

    response = await auth_client.get(
        f"{BASE}/feed",
        params={"city": "Reims", "limit": 10},
        headers=auth_header(token),
    )
    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["distance_meters"] is None
    assert item["walk_minutes"] is None


@pytest.mark.asyncio
async def test_feed_distance_computed_with_coordinates(
    auth_client: AsyncClient,
    mock_processor: None,
) -> None:
    user = await _register(auth_client)
    token = user["access_token"]
    await _publish_video(auth_client, token, latitude=49.2583, longitude=4.0317)

    response = await auth_client.get(
        f"{BASE}/feed",
        params={
            "city": "Reims",
            "limit": 10,
            "latitude": 49.2583,
            "longitude": 4.0317,
        },
        headers=auth_header(token),
    )
    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["distance_meters"] == 0
    assert item["walk_minutes"] == 0


@pytest.mark.asyncio
async def test_feed_distance_with_lat_lng_aliases(
    auth_client: AsyncClient,
    mock_processor: None,
) -> None:
    user = await _register(auth_client)
    token = user["access_token"]
    await _publish_video(auth_client, token, latitude=49.26, longitude=4.04)

    response = await auth_client.get(
        f"{BASE}/feed",
        params={"city": "Reims", "limit": 10, "lat": 49.26, "lng": 4.04},
        headers=auth_header(token),
    )
    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["distance_meters"] is not None
    assert item["walk_minutes"] is not None


@pytest.mark.asyncio
async def test_feed_orders_newest_first(
    auth_client: AsyncClient,
    mock_processor: None,
) -> None:
    user = await _register(auth_client)
    token = user["access_token"]
    older = await _publish_video(auth_client, token, title="Older")
    newer = await _publish_video(auth_client, token, title="Newer")

    now = datetime.now(UTC)
    await _set_video_published_at(older["id"], now - timedelta(hours=2))
    await _set_video_published_at(newer["id"], now - timedelta(minutes=5))

    response = await auth_client.get(
        f"{BASE}/feed",
        params={"city": "Reims", "limit": 10},
        headers=auth_header(token),
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) >= 2
    assert items[0]["id"] == newer["id"]
    assert items[1]["id"] == older["id"]
