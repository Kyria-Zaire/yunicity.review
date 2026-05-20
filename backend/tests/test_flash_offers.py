"""Flash offer tests (TICKET-501)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from app.core.errors import AppError
from app.core.flash_offer import (
    build_flash_snapshot,
    compute_flash_remaining,
    is_flash_active,
    validate_flash_fields,
)
from app.core.passport_constants import PartnerOfferStatus, PartnerOfferType
from app.models.passport import PartnerOffer

pytestmark = pytest.mark.unit


def _offer(**kwargs: object) -> PartnerOffer:
    now = datetime.now(UTC)
    defaults: dict[str, object] = {
        "organization_id": "00000000-0000-4000-8000-000000000001",
        "title": "Brunch",
        "offer_type": PartnerOfferType.GIFT.value,
        "status": PartnerOfferStatus.PUBLISHED.value,
        "is_active": True,
        "is_flash": True,
        "flash_ends_at": now + timedelta(hours=2),
        "valid_until": now + timedelta(days=7),
    }
    defaults.update(kwargs)
    return PartnerOffer(**defaults)


def test_validate_flash_requires_ends_at() -> None:
    with pytest.raises(AppError) as exc:
        validate_flash_fields(
            is_flash=True,
            flash_ends_at=None,
            valid_until=None,
            status=PartnerOfferStatus.DRAFT,
        )
    assert exc.value.code == "FLASH_ENDS_AT_REQUIRED"


def test_validate_flash_ends_before_valid_until() -> None:
    now = datetime.now(UTC)
    with pytest.raises(AppError) as exc:
        validate_flash_fields(
            is_flash=True,
            flash_ends_at=now + timedelta(days=2),
            valid_until=now + timedelta(days=1),
            status=PartnerOfferStatus.DRAFT,
        )
    assert exc.value.code == "FLASH_AFTER_VALID_UNTIL"


def test_is_flash_active_false_when_expired() -> None:
    now = datetime.now(UTC)
    offer = _offer(flash_ends_at=now - timedelta(minutes=1))
    assert is_flash_active(offer, now=now) is False
    snap = build_flash_snapshot(offer, now=now)
    assert snap.is_flash is False


def test_is_flash_active_and_remaining() -> None:
    now = datetime.now(UTC)
    ends = now + timedelta(hours=2, minutes=15)
    offer = _offer(flash_ends_at=ends)
    assert is_flash_active(offer, now=now) is True
    remaining = compute_flash_remaining(ends, now=now)
    assert remaining.remaining_hours == 2
    assert remaining.remaining_minutes == 15
    snap = build_flash_snapshot(offer, now=now)
    assert snap.is_flash is True
    assert snap.remaining_hours == 2
    assert snap.remaining_minutes == 15
