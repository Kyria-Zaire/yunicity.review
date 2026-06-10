"""Unit tests for admin moderation query helpers."""

from __future__ import annotations

import pytest
from app.services.admin_report_queries import resolve_dominant_report_reason

pytestmark = pytest.mark.unit


def test_resolve_dominant_report_reason_empty() -> None:
    assert resolve_dominant_report_reason({}) is None


def test_resolve_dominant_report_reason_picks_highest_count() -> None:
    assert resolve_dominant_report_reason({"spam": 2, "inappropriate": 5, "other": 1}) == (
        "inappropriate"
    )


def test_resolve_dominant_report_reason_tie_breaks_alphabetically() -> None:
    assert resolve_dominant_report_reason({"spam": 3, "other": 3}) == "other"
