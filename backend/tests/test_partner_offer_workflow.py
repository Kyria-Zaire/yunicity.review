"""Partner offer workflow transition unit tests (TICKET-305A)."""

from __future__ import annotations

import pytest
from app.core.errors import AppError
from app.core.partner_offer_workflow import (
    assert_partner_can_edit,
    assert_transition_allowed,
    is_offer_active,
)
from app.core.passport_constants import PartnerOfferStatus


def test_is_offer_active_only_when_published() -> None:
    assert is_offer_active(PartnerOfferStatus.PUBLISHED) is True
    assert is_offer_active(PartnerOfferStatus.DRAFT) is False


@pytest.mark.parametrize(
    ("current", "target"),
    [
        (PartnerOfferStatus.DRAFT, PartnerOfferStatus.PENDING_REVIEW),
        (PartnerOfferStatus.PENDING_REVIEW, PartnerOfferStatus.PUBLISHED),
        (PartnerOfferStatus.PENDING_REVIEW, PartnerOfferStatus.REJECTED),
        (PartnerOfferStatus.REJECTED, PartnerOfferStatus.DRAFT),
        (PartnerOfferStatus.PUBLISHED, PartnerOfferStatus.ARCHIVED),
    ],
)
def test_allowed_transitions(current: PartnerOfferStatus, target: PartnerOfferStatus) -> None:
    assert_transition_allowed(current, target)


def test_rejected_to_published_forbidden() -> None:
    with pytest.raises(AppError) as exc:
        assert_transition_allowed(PartnerOfferStatus.REJECTED, PartnerOfferStatus.PUBLISHED)
    assert exc.value.code == "INVALID_OFFER_TRANSITION"


def test_partner_edit_only_draft_or_rejected() -> None:
    assert_partner_can_edit(PartnerOfferStatus.DRAFT)
    assert_partner_can_edit(PartnerOfferStatus.REJECTED)
    with pytest.raises(AppError) as exc:
        assert_partner_can_edit(PartnerOfferStatus.PENDING_REVIEW)
    assert exc.value.code == "OFFER_NOT_EDITABLE"
