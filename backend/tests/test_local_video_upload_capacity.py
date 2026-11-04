"""Disk admission, process-local concurrency and failure cleanup."""

from __future__ import annotations

import asyncio
import errno
import threading
import uuid
from collections.abc import AsyncIterator
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import pytest
from app.core.config import Settings
from app.core.errors import AppError
from app.core.local_video_constants import LOCAL_VIDEO_MAX_BYTES, LocalVideoUploadStatus
from app.services.local_video.filesystem_storage import FilesystemLocalVideoStorage
from app.services.local_video.upload_capacity import (
    FilesystemUploadCapacityGuard,
    UploadCapacityLease,
)

HEADER = b"\x00\x00\x00\x18ftypisom" + b"\x00" * 24


def _settings(tmp_path: Path, **overrides: Any) -> Settings:
    values: dict[str, Any] = {
        "JWT_SECRET_KEY": "test-secret-key-at-least-32-characters-long!!",
        "REGISTRATION_MODE": "",
        "LOCAL_VIDEO_STORAGE_BACKEND": "filesystem",
        "MEDIA_UPLOAD_DIR": str(tmp_path / "media"),
        "MEDIA_PUBLIC_BASE_URL": "http://test",
        "LOCAL_VIDEO_MIN_FREE_BYTES": 0,
    }
    values.update(overrides)
    return Settings(**values)


class _Upload:
    def __init__(self) -> None:
        self.id = uuid.uuid4()
        self.storage_key = f"local-videos/reims/{self.id}/source.mp4"
        self.content_type = "video/mp4"
        self.expected_size_bytes = LOCAL_VIDEO_MAX_BYTES
        self.status = LocalVideoUploadStatus.PENDING.value
        self.expires_at = datetime.now(tz=UTC) + timedelta(minutes=10)


class _Session:
    def __init__(self, failure: BaseException | None = None) -> None:
        self.failure = failure

    async def commit(self) -> None:
        if self.failure is not None:
            raise self.failure


def _service(tmp_path: Path, upload: _Upload, session: _Session | None = None) -> Any:
    from app.services.local_video_service import LocalVideoService

    settings = _settings(tmp_path)
    service: Any = LocalVideoService.__new__(LocalVideoService)
    service._settings = settings
    service._session = session or _Session()
    service._storage = FilesystemLocalVideoStorage(settings)

    async def get_upload(_: uuid.UUID) -> _Upload:
        return upload

    service._get_upload = get_upload
    return service


async def _body(*, failure: BaseException | None = None) -> AsyncIterator[bytes]:
    yield HEADER
    yield b"x" * 1024
    if failure is not None:
        raise failure


def _files(root: Path) -> list[Path]:
    return [path for path in root.rglob("*") if path.is_file()]


def test_disk_admission_accepts_sufficient_capacity_and_releases(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    guard = FilesystemUploadCapacityGuard()
    monkeypatch.setattr(
        "app.services.local_video.upload_capacity.shutil.disk_usage",
        lambda _root: SimpleNamespace(free=1_000),
    )
    lease = guard.acquire(
        tmp_path, expected_bytes=200, minimum_free_bytes=500, concurrency_limit=2
    )
    assert guard.active_reserved_bytes(tmp_path) == 200
    lease.release()
    assert guard.active_reserved_bytes(tmp_path) == 0


def test_insufficient_capacity_refuses_atomically() -> None:
    guard = FilesystemUploadCapacityGuard()
    with pytest.MonkeyPatch.context() as patch:
        patch.setattr(
            "app.services.local_video.upload_capacity.shutil.disk_usage",
            lambda _root: SimpleNamespace(free=699),
        )
        with pytest.raises(AppError) as exc:
            guard.acquire(
                Path.cwd(), expected_bytes=200, minimum_free_bytes=500, concurrency_limit=2
            )
    assert (exc.value.status_code, exc.value.code) == (
        507,
        "LOCAL_VIDEO_STORAGE_INSUFFICIENT",
    )


@pytest.mark.parametrize("iteration", range(20))
def test_two_uploads_cannot_reserve_the_same_capacity(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, iteration: int
) -> None:
    del iteration
    guard = FilesystemUploadCapacityGuard()
    monkeypatch.setattr(
        "app.services.local_video.upload_capacity.shutil.disk_usage",
        lambda _root: SimpleNamespace(free=100),
    )
    barrier = threading.Barrier(2)

    def reserve() -> object:
        barrier.wait()
        try:
            return guard.acquire(
                tmp_path, expected_bytes=40, minimum_free_bytes=40, concurrency_limit=2
            )
        except AppError as exc:
            return exc

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = [future.result() for future in [pool.submit(reserve), pool.submit(reserve)]]
    leases = [result for result in results if isinstance(result, UploadCapacityLease)]
    errors = [result for result in results if isinstance(result, AppError)]
    assert len(leases) == 1
    assert len(errors) == 1 and errors[0].status_code == 507
    leases[0].release()


@pytest.mark.asyncio
async def test_rejection_happens_before_body_is_read(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    upload = _Upload()
    service = _service(tmp_path, upload)
    reads = 0

    async def watched() -> AsyncIterator[bytes]:
        nonlocal reads
        reads += 1
        yield HEADER

    monkeypatch.setattr(
        "app.services.local_video.upload_capacity.shutil.disk_usage",
        lambda _root: SimpleNamespace(free=0),
    )
    with pytest.raises(AppError) as exc:
        await service.store_streamed_upload(upload.id, watched(), declared_length=len(HEADER))
    assert exc.value.status_code == 507
    assert reads == 0


@pytest.mark.asyncio
async def test_capacity_becoming_insufficient_mid_write_cleans_up(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    upload = _Upload()
    service = _service(tmp_path, upload)
    free_values = iter((10_000, 0))
    monkeypatch.setattr(
        "app.services.local_video.upload_capacity.shutil.disk_usage",
        lambda _root: SimpleNamespace(free=next(free_values)),
    )
    with pytest.raises(AppError) as exc:
        await service.store_streamed_upload(upload.id, _body(), declared_length=1)
    assert (exc.value.status_code, exc.value.code) == (
        507,
        "LOCAL_VIDEO_STORAGE_INSUFFICIENT",
    )
    assert _files(Path(service._settings.media_upload_dir)) == []
    assert upload.status == LocalVideoUploadStatus.PENDING.value


@pytest.mark.parametrize(
    "failure",
    [
        pytest.param(asyncio.CancelledError(), id="cancel"),
        pytest.param(TimeoutError("timeout"), id="timeout"),
        pytest.param(ConnectionResetError("disconnect"), id="disconnect"),
    ],
)
@pytest.mark.parametrize("iteration", range(20))
@pytest.mark.asyncio
async def test_stream_failures_release_and_remove_temporaries(
    tmp_path: Path, failure: BaseException, iteration: int
) -> None:
    del iteration
    upload = _Upload()
    service = _service(tmp_path, upload)
    with pytest.raises(type(failure)):
        await service.store_streamed_upload(
            upload.id, _body(failure=failure), declared_length=LOCAL_VIDEO_MAX_BYTES
        )
    assert _files(Path(service._settings.media_upload_dir)) == []
    assert upload.status == LocalVideoUploadStatus.PENDING.value


@pytest.mark.parametrize("iteration", range(20))
@pytest.mark.asyncio
async def test_enospc_is_clean_507_without_partial_or_final_file(
    tmp_path: Path, iteration: int
) -> None:
    del iteration
    upload = _Upload()
    service = _service(tmp_path, upload)

    def fail_promotion(*_args: Any, **_kwargs: Any) -> None:
        raise OSError(errno.ENOSPC, "disk full")

    service._storage.promote_file = fail_promotion
    with pytest.raises(AppError) as exc:
        await service.store_streamed_upload(
            upload.id, _body(), declared_length=LOCAL_VIDEO_MAX_BYTES
        )
    assert (exc.value.status_code, exc.value.code, exc.value.metadata) == (
        507,
        "LOCAL_VIDEO_STORAGE_INSUFFICIENT",
        {},
    )
    assert _files(Path(service._settings.media_upload_dir)) == []


@pytest.mark.asyncio
async def test_database_failure_removes_promoted_file(tmp_path: Path) -> None:
    upload = _Upload()
    service = _service(tmp_path, upload, _Session(RuntimeError("database unavailable")))
    with pytest.raises(RuntimeError, match="database unavailable"):
        await service.store_streamed_upload(
            upload.id, _body(), declared_length=LOCAL_VIDEO_MAX_BYTES
        )
    assert _files(Path(service._settings.media_upload_dir)) == []
    assert upload.status == LocalVideoUploadStatus.PENDING.value


def test_staging_file_is_on_media_filesystem_and_descriptor_closes(tmp_path: Path) -> None:
    storage = FilesystemLocalVideoStorage(_settings(tmp_path))
    descriptor, path = storage.create_upload_temp()
    assert path.is_relative_to(storage.root)
    import os

    os.close(descriptor)
    path.unlink()
    assert not path.exists()
