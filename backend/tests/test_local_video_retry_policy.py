"""Local Video ARQ retry policy tests (VIDEO-03B.2)."""

from __future__ import annotations

import pytest
from app.core.errors import AppError
from app.core.local_video_constants import LOCAL_VIDEO_PROCESSING_NON_RETRYABLE_CODES
from app.services.local_video.retry_policy import (
    compute_retry_defer_seconds,
    is_retryable_app_error,
    is_retryable_exception,
    retry_policy_summary,
)


class TestRetryDeferSchedule:
    def test_backoff_progression_without_jitter(self) -> None:
        assert compute_retry_defer_seconds(1, rng=lambda: 0.0) == 30.0
        assert compute_retry_defer_seconds(2, rng=lambda: 0.0) == 120.0
        assert compute_retry_defer_seconds(3, rng=lambda: 0.0) == 300.0

    def test_backoff_caps_at_last_schedule_entry(self) -> None:
        assert compute_retry_defer_seconds(99, rng=lambda: 0.0) == 300.0

    def test_jitter_is_bounded(self) -> None:
        base = compute_retry_defer_seconds(1, rng=lambda: 0.0)
        with_jitter = compute_retry_defer_seconds(1, rng=lambda: 1.0)
        assert base < with_jitter <= base + (base * 0.1)


class TestErrorClassification:
    @pytest.mark.parametrize("code", sorted(LOCAL_VIDEO_PROCESSING_NON_RETRYABLE_CODES))
    def test_permanent_codes_are_not_retryable(self, code: str) -> None:
        exc = AppError(status_code=400, code=code, detail="permanent")
        assert is_retryable_app_error(exc) is False
        assert is_retryable_exception(exc) is False

    def test_transient_app_error_is_retryable(self) -> None:
        exc = AppError(
            status_code=503,
            code="LOCAL_VIDEO_STORAGE_UNAVAILABLE",
            detail="Stockage temporairement indisponible.",
        )
        assert is_retryable_app_error(exc) is True

    def test_unexpected_exception_is_retryable(self) -> None:
        assert is_retryable_exception(RuntimeError("network")) is True


class TestRetryPolicySummary:
    def test_summary_exposes_effective_policy(self) -> None:
        summary = retry_policy_summary()
        assert summary["strategy"] == "explicit_schedule_with_jitter"
        assert summary["max_tries"] == 3
        assert summary["backoff_seconds_by_failed_attempt"] == [30, 120, 300]
        assert set(summary["non_retryable_codes"]) == set(LOCAL_VIDEO_PROCESSING_NON_RETRYABLE_CODES)
