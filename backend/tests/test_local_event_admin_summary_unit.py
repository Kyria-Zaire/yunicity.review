"""Unit tests for admin local events agenda query helpers."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from app.core.local_event_constants import LocalEventModerationStatus
from app.services.local_event_admin_queries import (
    local_event_counts_as_published,
    local_event_counts_as_upcoming_published,
    normalize_admin_event_title_query,
)

pytestmark = pytest.mark.unit

_NOW = datetime(2026, 6, 4, 12, 0, tzinfo=UTC)


def test_normalize_admin_event_title_query_empty_values() -> None:
    assert normalize_admin_event_title_query(None) is None
    assert normalize_admin_event_title_query("") is None
    assert normalize_admin_event_title_query("   ") is None


def test_normalize_admin_event_title_query_trims_value() -> None:
    assert normalize_admin_event_title_query("  Marché  ") == "Marché"


@pytest.mark.parametrize(
    ("status", "is_cancelled", "expected"),
    [
        (LocalEventModerationStatus.PENDING_REVIEW.value, False, False),
        (LocalEventModerationStatus.REJECTED.value, False, False),
        (LocalEventModerationStatus.APPROVED.value, True, False),
        (LocalEventModerationStatus.APPROVED.value, False, True),
    ],
)
def test_published_counts_only_approved_non_cancelled(
    status: str,
    is_cancelled: bool,
    expected: bool,
) -> None:
    assert (
        local_event_counts_as_published(
            moderation_status=status,
            is_cancelled=is_cancelled,
        )
        is expected
    )


def test_upcoming_published_requires_future_start() -> None:
    assert local_event_counts_as_upcoming_published(
        moderation_status=LocalEventModerationStatus.APPROVED.value,
        is_cancelled=False,
        starts_at=_NOW + timedelta(days=1),
        now=_NOW,
    )
    assert not local_event_counts_as_upcoming_published(
        moderation_status=LocalEventModerationStatus.APPROVED.value,
        is_cancelled=False,
        starts_at=_NOW - timedelta(hours=1),
        now=_NOW,
    )
