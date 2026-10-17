"""Process-local admission control for filesystem video uploads."""

from __future__ import annotations

import logging
import shutil
import threading
from dataclasses import dataclass
from pathlib import Path

from app.core.errors import AppError

logger = logging.getLogger(__name__)


def storage_insufficient_error() -> AppError:
    return AppError(
        status_code=507,
        code="LOCAL_VIDEO_STORAGE_INSUFFICIENT",
        detail="Espace de stockage temporairement insuffisant. Réessayez plus tard.",
    )


@dataclass
class _RootCapacity:
    active_uploads: int = 0
    reserved_bytes: int = 0


class UploadCapacityLease:
    def __init__(
        self,
        guard: FilesystemUploadCapacityGuard,
        root: Path,
        reserved: int,
        minimum_free_bytes: int,
    ) -> None:
        self._guard = guard
        self._root = root
        self._reserved = reserved
        self._minimum_free_bytes = minimum_free_bytes
        self._released = False

    @property
    def reserved_bytes(self) -> int:
        return self._reserved

    def ensure_reserved(self, required_bytes: int) -> None:
        if required_bytes <= self._reserved:
            return
        self._guard._grow(self, required_bytes)

    def release(self) -> None:
        if not self._released:
            self._guard._release(self)


class FilesystemUploadCapacityGuard:
    """Atomic admission within one API process.

    Multiple processes cannot share this in-memory counter. Railway Preview runs
    one Uvicorn worker per service instance; deployments with several workers
    must divide the configured concurrency/capacity externally.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._roots: dict[Path, _RootCapacity] = {}

    def acquire(
        self,
        root: Path,
        *,
        expected_bytes: int,
        minimum_free_bytes: int,
        concurrency_limit: int,
    ) -> UploadCapacityLease:
        resolved = root.resolve()
        with self._lock:
            state = self._roots.setdefault(resolved, _RootCapacity())
            free_bytes = shutil.disk_usage(resolved).free
            concurrent = state.active_uploads >= concurrency_limit
            insufficient = (
                free_bytes - state.reserved_bytes - expected_bytes < minimum_free_bytes
            )
            if concurrent or insufficient:
                logger.warning(
                    "local_video_upload_admission_refused",
                    extra={"reason": "concurrency" if concurrent else "disk_capacity"},
                )
                raise storage_insufficient_error()
            state.active_uploads += 1
            state.reserved_bytes += expected_bytes
        return UploadCapacityLease(self, resolved, expected_bytes, minimum_free_bytes)

    def _grow(self, lease: UploadCapacityLease, required_bytes: int) -> None:
        with self._lock:
            if lease._released:
                raise RuntimeError("upload capacity lease already released")
            state = self._roots[lease._root]
            growth = required_bytes - lease._reserved
            free_bytes = shutil.disk_usage(lease._root).free
            if free_bytes - state.reserved_bytes - growth < lease._minimum_free_bytes:
                logger.warning(
                    "local_video_upload_capacity_growth_refused",
                    extra={"reason": "disk_capacity"},
                )
                raise storage_insufficient_error()
            state.reserved_bytes += growth
            lease._reserved = required_bytes

    def _release(self, lease: UploadCapacityLease) -> None:
        with self._lock:
            state = self._roots[lease._root]
            state.active_uploads -= 1
            state.reserved_bytes -= lease._reserved
            lease._released = True
            if state.active_uploads == 0:
                self._roots.pop(lease._root, None)

    def active_reserved_bytes(self, root: Path) -> int:
        with self._lock:
            state = self._roots.get(root.resolve())
            return state.reserved_bytes if state else 0


FILESYSTEM_UPLOAD_CAPACITY = FilesystemUploadCapacityGuard()
