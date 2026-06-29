"""Local Video async worker tests (VIDEO-03A)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from app.core.config import get_settings
from app.core.errors import AppError
from app.core.local_video_constants import (
    LocalVideoProcessingStatus,
    LocalVideoStatus,
    LocalVideoType,
    LocalVideoUploadStatus,
)
from app.db.session import get_session_factory
from app.models.local_video import LocalVideo, LocalVideoUpload
from app.services.local_video.processing_service import (
    mark_local_video_processing_exhausted,
    run_local_video_processing,
)
from app.services.local_video.processor import LocalVideoProcessResult
from app.services.local_video.storage import build_local_video_storage
from httpx import AsyncClient
from sqlalchemy import select

from tests.conftest_passport import auth_header, register_user
from tests.test_local_videos_api import (
    BASE,
    BOULINGRIN_ID,
    _init_upload,
    _publish_video,
)

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture(autouse=True)
async def _local_video_env(monkeypatch: pytest.MonkeyPatch) -> AsyncIterator[None]:
    monkeypatch.setenv("LOCAL_VIDEO_STORAGE_BACKEND", "filesystem")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


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


@pytest.fixture
def noop_enqueue(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(video_id: uuid.UUID, *, settings=None) -> str:  # type: ignore[no-untyped-def]
        del settings
        return f"local-video:{video_id}"

    monkeypatch.setattr(
        "app.services.local_video.job_queue.enqueue_local_video_processing",
        _noop,
    )


@pytest.fixture
def auto_run_video_worker(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _enqueue(video_id: uuid.UUID, *, settings=None) -> str:  # type: ignore[no-untyped-def]
        await run_local_video_processing(video_id, settings=settings or get_settings())
        return f"local-video:{video_id}"

    monkeypatch.setattr(
        "app.services.local_video.job_queue.enqueue_local_video_processing",
        _enqueue,
    )


async def _register(auth_client: AsyncClient) -> dict[str, Any]:
    return await register_user(auth_client, suffix=f"-lvw-{uuid.uuid4().hex[:8]}")


async def _create_processing_video(
    *,
    city_slug: str = "reims",
    content_type: str = "video/mp4",
) -> uuid.UUID:
    video_id = uuid.uuid4()
    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        upload = LocalVideoUpload(
            id=video_id,
            author_user_id=uuid.uuid4(),
            storage_key=f"local-video/{city_slug}/{video_id}/source.mp4",
            content_type=content_type,
            expected_size_bytes=4096,
            status=LocalVideoUploadStatus.CONSUMED.value,
            expires_at=datetime.now(tz=UTC) + timedelta(hours=1),
        )
        video = LocalVideo(
            id=video_id,
            author_user_id=upload.author_user_id,
            upload_id=upload.id,
            city="Reims",
            neighborhood_id=uuid.UUID(BOULINGRIN_ID),
            video_type=LocalVideoType.MOMENT.value,
            title="Worker test",
            description=None,
            storage_key=upload.storage_key,
            media_url="",
            thumbnail_url="",
            duration_seconds=0,
            file_size_bytes=4096,
            mime_type=content_type,
            status=LocalVideoStatus.PROCESSING.value,
        )
        session.add_all([upload, video])
        await session.commit()
    return video_id


@pytest.mark.asyncio
async def test_publish_returns_202_accepted(
    auth_client: AsyncClient,
    noop_enqueue: None,
) -> None:
    user = await _register(auth_client)
    init_body = await _init_upload(auth_client, user["access_token"])
    await auth_client.put(
        init_body["presigned_url"],
        content=b"fake-mp4-bytes-for-test",
        headers={"Content-Type": "video/mp4"},
    )
    response = await auth_client.post(
        BASE,
        json={
            "upload_id": init_body["upload_id"],
            "city": "Reims",
            "neighborhood_id": BOULINGRIN_ID,
            "video_type": LocalVideoType.MOMENT.value,
            "title": "Async publish",
        },
        headers=auth_header(user["access_token"]),
    )
    assert response.status_code == 202, response.text
    body = response.json()
    assert body["status"] == LocalVideoStatus.PROCESSING.value
    assert body["processing_status"] == LocalVideoProcessingStatus.PROCESSING.value
    assert body["job_id"] == f"local-video:{body['id']}"


@pytest.mark.asyncio
async def test_video_invisible_in_feed_during_processing(
    auth_client: AsyncClient,
    noop_enqueue: None,
) -> None:
    user = await _register(auth_client)
    token = user["access_token"]
    init_body = await _init_upload(auth_client, token)
    await auth_client.put(
        init_body["presigned_url"],
        content=b"fake-mp4-bytes-for-test",
        headers={"Content-Type": "video/mp4"},
    )
    publish = await auth_client.post(
        BASE,
        json={
            "upload_id": init_body["upload_id"],
            "city": "Reims",
            "neighborhood_id": BOULINGRIN_ID,
            "video_type": LocalVideoType.MOMENT.value,
        },
        headers=auth_header(token),
    )
    assert publish.status_code == 202
    video_id = publish.json()["id"]

    feed = await auth_client.get(
        f"{BASE}/feed",
        params={"city": "Reims", "limit": 10},
        headers=auth_header(token),
    )
    assert feed.status_code == 200
    ids = {item["id"] for item in feed.json()["items"]}
    assert video_id not in ids


@pytest.mark.asyncio
async def test_worker_success_sets_ready(
    auth_client: AsyncClient,
    mock_processor: None,
) -> None:
    del auth_client
    video_id = await _create_processing_video()
    await run_local_video_processing(video_id)

    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        video = await session.get(LocalVideo, video_id)
        assert video is not None
        assert video.status == LocalVideoStatus.PUBLISHED.value
        assert video.media_url
        assert video.thumbnail_url
        assert float(video.duration_seconds) == 12.5
        assert video.processing_error is None


@pytest.mark.asyncio
async def test_worker_failure_sets_failed(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    del auth_client
    def _fail_process(self, **kwargs):  # type: ignore[no-untyped-def]
        del self, kwargs
        raise AppError(
            status_code=422,
            code="LOCAL_VIDEO_INVALID_MEDIA",
            detail="Média vidéo invalide.",
        )

    monkeypatch.setattr(
        "app.services.local_video.processor.LocalVideoMediaProcessor.process",
        _fail_process,
    )
    video_id = await _create_processing_video()
    await run_local_video_processing(video_id)

    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        video = await session.get(LocalVideo, video_id)
        upload = await session.get(LocalVideoUpload, video_id)
        assert video is not None
        assert video.status == LocalVideoStatus.FAILED.value
        assert video.processing_error == "Média vidéo invalide."
        assert upload is not None
        assert upload.status == LocalVideoUploadStatus.FAILED.value


@pytest.mark.asyncio
async def test_worker_retryable_error_reraises(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    del auth_client
    def _transient_fail(self, **kwargs):  # type: ignore[no-untyped-def]
        del self, kwargs
        raise AppError(
            status_code=503,
            code="LOCAL_VIDEO_STORAGE_UNAVAILABLE",
            detail="Stockage temporairement indisponible.",
        )

    monkeypatch.setattr(
        "app.services.local_video.processor.LocalVideoMediaProcessor.process",
        _transient_fail,
    )
    video_id = await _create_processing_video()
    with pytest.raises(AppError) as exc_info:
        await run_local_video_processing(video_id, job_try=1)
    assert exc_info.value.code == "LOCAL_VIDEO_STORAGE_UNAVAILABLE"

    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        video = await session.get(LocalVideo, video_id)
        assert video is not None
        assert video.status == LocalVideoStatus.PROCESSING.value


@pytest.mark.asyncio
async def test_worker_skips_already_ready(
    auth_client: AsyncClient,
    mock_processor: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    del auth_client
    calls: list[uuid.UUID] = []

    def _counting_process(self, **kwargs):  # type: ignore[no-untyped-def]
        del self
        video_id = kwargs["video_id"]
        calls.append(video_id)
        city_slug = kwargs["city_slug"]
        return LocalVideoProcessResult(
            duration_seconds=1.0,
            source_storage_key=f"local-video/{city_slug}/{video_id}/processed.mp4",
            thumbnail_storage_key=f"local-video/{city_slug}/{video_id}/thumbnail.jpg",
            mime_type="video/mp4",
            file_size_bytes=100,
        )

    monkeypatch.setattr(
        "app.services.local_video.processor.LocalVideoMediaProcessor.process",
        _counting_process,
    )
    video_id = await _create_processing_video()
    await run_local_video_processing(video_id)
    await run_local_video_processing(video_id)
    assert len(calls) == 1


@pytest.mark.asyncio
async def test_publish_then_worker_ready_flow(
    auth_client: AsyncClient,
    mock_processor: None,
) -> None:
    user = await _register(auth_client)
    accepted = await _publish_video(auth_client, user["access_token"], title="Ready flow")
    assert accepted["status"] == LocalVideoStatus.PROCESSING.value

    get_response = await auth_client.get(
        f"{BASE}/{accepted['id']}",
        headers=auth_header(user["access_token"]),
    )
    assert get_response.status_code == 200
    item = get_response.json()
    assert item["status"] == LocalVideoStatus.PUBLISHED.value
    assert item["processing_status"] == LocalVideoProcessingStatus.READY.value
    assert item["duration_seconds"] == 12.5

    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        result = await session.execute(
            select(LocalVideo).where(LocalVideo.id == uuid.UUID(accepted["id"]))
        )
        video = result.scalar_one()
        assert video.status == LocalVideoStatus.PUBLISHED.value


@pytest.mark.asyncio
async def test_worker_exhausted_marks_failed(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    del auth_client
    def _transient_fail(self, **kwargs):  # type: ignore[no-untyped-def]
        del self, kwargs
        raise AppError(
            status_code=503,
            code="LOCAL_VIDEO_STORAGE_UNAVAILABLE",
            detail="Stockage temporairement indisponible.",
        )

    monkeypatch.setattr(
        "app.services.local_video.processor.LocalVideoMediaProcessor.process",
        _transient_fail,
    )
    video_id = await _create_processing_video()
    await mark_local_video_processing_exhausted(video_id)

    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        video = await session.get(LocalVideo, video_id)
        assert video is not None
        assert video.status == LocalVideoStatus.FAILED.value
        assert video.processing_error


@pytest.mark.asyncio
async def test_worker_idempotent_when_derivatives_exist(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    del auth_client
    video_id = await _create_processing_video()
    settings = get_settings()
    storage = build_local_video_storage(settings)
    video_path = (
        Path(__file__).resolve().parents[1] / "data" / "e2e-test-video.mp4"
    )
    if not video_path.is_file():
        pytest.skip("e2e-test-video.mp4 missing")

    city_slug = "reims"
    processed_key = storage.build_processed_key(city_slug=city_slug, video_id=video_id)
    thumb_key = storage.build_thumbnail_key(city_slug=city_slug, video_id=video_id)
    storage.upload_file(video_path, processed_key, "video/mp4")
    storage.write_bytes(thumb_key, b"\xff\xd8\xff\xd9", "image/jpeg")

    def _must_not_process(self, **kwargs):  # type: ignore[no-untyped-def]
        del self, kwargs
        raise AssertionError("FFmpeg must not run when derivatives already exist")

    monkeypatch.setattr(
        "app.services.local_video.processor.LocalVideoMediaProcessor.process",
        _must_not_process,
    )

    await run_local_video_processing(video_id)

    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        video = await session.get(LocalVideo, video_id)
        assert video is not None
        assert video.status == LocalVideoStatus.PUBLISHED.value
        assert video.media_url
        assert video.thumbnail_url
