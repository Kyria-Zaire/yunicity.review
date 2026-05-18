"""Partner offer domain tests — types and verified-organization rule (MVP)."""

from __future__ import annotations

import uuid

import pytest
from app.core.organization_constants import VerificationStatus
from app.core.passport_constants import (
    PARTNER_OFFER_TYPES,
    PartnerOfferStatus,
    PartnerOfferType,
)
from app.models.passport import PartnerOffer


def organization_may_host_partner_offers(verification_status: str) -> bool:
    """MVP business rule — enforced in API/services (TICKET-302+)."""
    return verification_status == VerificationStatus.VERIFIED.value


@pytest.mark.parametrize("offer_type", sorted(PARTNER_OFFER_TYPES))
def test_partner_offer_types_are_valid_strings(offer_type: str) -> None:
    assert PartnerOfferType(offer_type).value == offer_type


def test_organization_verified_required_for_offers() -> None:
    assert organization_may_host_partner_offers(VerificationStatus.VERIFIED.value) is True
    assert organization_may_host_partner_offers(VerificationStatus.PENDING.value) is False
    assert organization_may_host_partner_offers(VerificationStatus.REJECTED.value) is False


def test_partner_offer_column_defaults() -> None:
    table = PartnerOffer.__table__
    status_default = table.c.status.server_default
    max_per_passport_default = table.c.max_redemptions_per_passport.server_default
    assert status_default is not None
    assert max_per_passport_default is not None


def test_partner_offer_construct_with_explicit_fields() -> None:
    offer = PartnerOffer(
        id=uuid.uuid4(),
        organization_id=uuid.uuid4(),
        title="Café offert",
        offer_type=PartnerOfferType.DRINK,
        status=PartnerOfferStatus.DRAFT,
        max_redemptions_per_passport=1,
    )
    assert offer.status == PartnerOfferStatus.DRAFT
    assert offer.max_redemptions_per_passport == 1
