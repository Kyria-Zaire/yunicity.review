"""Shared local-video test fixtures (VIDEO-03A)."""

from __future__ import annotations

import uuid

import pytest
from app.core.config import Settings, get_settings
from app.services.local_video.processing_service import run_local_video_processing


@pytest.fixture
def auto_run_video_worker(monkeypatch: pytest.MonkeyPatch) -> None:
    """Run the local-video processing worker inline whenever a publish enqueues it.

    Publishing is asynchronous (VIDEO-03A): the endpoint leaves the video in PROCESSING
    and enqueues an ARQ job. Tests run no worker, so a freshly published video stays
    PROCESSING and is not findable (404 / empty feed). Patch the enqueue to run the real
    processing synchronously, so the video reaches PUBLISHED within the same request.
    Combine with ``mock_processor`` to stub the actual media transcoding.
    """

    async def _enqueue(video_id: uuid.UUID, *, settings: Settings | None = None) -> str:
        await run_local_video_processing(video_id, settings=settings or get_settings())
        return f"local-video:{video_id}"

    # Patch where it is USED (imported into the publish service namespace), not where it
    # is defined — LocalVideoService.publish calls the name bound at import time.
    monkeypatch.setattr(
        "app.services.local_video_service.enqueue_local_video_processing",
        _enqueue,
    )
