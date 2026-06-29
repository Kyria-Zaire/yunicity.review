"""Map Local Video DB status to worker pipeline status (VIDEO-03A)."""

from __future__ import annotations

from app.core.local_video_constants import (
    LocalVideoProcessingStatus,
    LocalVideoStatus,
    LocalVideoUploadStatus,
)


def map_video_processing_status(status: str) -> LocalVideoProcessingStatus:
    if status == LocalVideoStatus.PUBLISHED.value:
        return LocalVideoProcessingStatus.READY
    if status == LocalVideoStatus.PROCESSING.value:
        return LocalVideoProcessingStatus.PROCESSING
    if status == LocalVideoStatus.FAILED.value:
        return LocalVideoProcessingStatus.FAILED
    return LocalVideoProcessingStatus.PROCESSING


def map_upload_processing_status(status: str) -> LocalVideoProcessingStatus:
    if status == LocalVideoUploadStatus.UPLOADED.value:
        return LocalVideoProcessingStatus.UPLOADED
    if status == LocalVideoUploadStatus.CONSUMED.value:
        return LocalVideoProcessingStatus.READY
    if status == LocalVideoUploadStatus.FAILED.value:
        return LocalVideoProcessingStatus.FAILED
    return LocalVideoProcessingStatus.UPLOADED
