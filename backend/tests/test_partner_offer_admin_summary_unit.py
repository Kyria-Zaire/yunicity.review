"""Unit tests for admin partner offer catalogue query helpers."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from app.core.passport_constants import PartnerOfferStatus
from app.services.partner_offer_admin_queries import (
    normalize_admin_offer_title_query,
    published_offer_counts_as_expired_or_inactive,
)

pytestmark = pytest.mark.unit

_NOW = datetime(2026, 6, 4, 12, 0, tzinfo=UTC)


def test_normalize_admin_offer_title_query_empty_values() -> None:
    assert normalize_admin_offer_title_query(None) is None
    assert normalize_admin_offer_title_query("") is None
    assert normalize_admin_offer_title_query("   ") is None


def test_normalize_admin_offer_title_query_trims_value() -> None:
    assert normalize_admin_offer_title_query("  Café  ") == "Café"


@pytest.mark.parametrize(
    ("status", "expected"),
    [
        (PartnerOfferStatus.DRAFT.value, False),
        (PartnerOfferStatus.PENDING_REVIEW.value, False),
        (PartnerOfferStatus.REJECTED.value, False),
        (PartnerOfferStatus.ARCHIVED.value, False),
    ],
)
def test_expired_or_inactive_ignores_non_published(status: str, expected: bool) -> None:
    assert (
        published_offer_counts_as_expired_or_inactive(
            offer_status=status,
            is_active=False,
            valid_from=None,
            valid_until=_NOW - timedelta(days=1),
            now=_NOW,
        )
        is expected
    )


def test_expired_or_inactive_counts_inactive_published() -> None:
    assert published_offer_counts_as_expired_or_inactive(
        offer_status=PartnerOfferStatus.PUBLISHED.value,
        is_active=False,
        valid_from=_NOW - timedelta(days=1),
        valid_until=_NOW + timedelta(days=1),
        now=_NOW,
    )


def test_expired_or_inactive_counts_past_valid_until() -> None:
    assert published_offer_counts_as_expired_or_inactive(
        offer_status=PartnerOfferStatus.PUBLISHED.value,
        is_active=True,
        valid_from=_NOW - timedelta(days=10),
        valid_until=_NOW - timedelta(hours=1),
        now=_NOW,
    )


def test_expired_or_inactive_counts_future_valid_from() -> None:
    assert published_offer_counts_as_expired_or_inactive(
        offer_status=PartnerOfferStatus.PUBLISHED.value,
        is_active=True,
        valid_from=_NOW + timedelta(days=1),
        valid_until=_NOW + timedelta(days=10),
        now=_NOW,
    )


def test_expired_or_inactive_ignores_active_published_in_window() -> None:
    assert not published_offer_counts_as_expired_or_inactive(
        offer_status=PartnerOfferStatus.PUBLISHED.value,
        is_active=True,
        valid_from=_NOW - timedelta(days=1),
        valid_until=_NOW + timedelta(days=1),
        now=_NOW,
    )
