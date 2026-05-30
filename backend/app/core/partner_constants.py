"""Signed partner domain constants (WEB-PARTNERS-01)."""

from __future__ import annotations

from enum import StrEnum

PARTNER_LIST_LIMIT_DEFAULT = 20
PARTNER_LIST_LIMIT_MAX = 100


class PartnerStatus(StrEnum):
    SIGNED = "signed"
    ACTIVE = "active"
    PAUSED = "paused"
    PREMIUM = "premium"
    FOUNDING_PARTNER = "founding_partner"


class PartnershipType(StrEnum):
    LOCAL_BUSINESS = "local_business"
    ASSOCIATION = "association"
    SPORTS_CLUB = "sports_club"
    RESTAURANT = "restaurant"
    NIGHTLIFE = "nightlife"
    CREATOR_PARTNER = "creator_partner"
    INSTITUTIONAL = "institutional"
    INTERNAL_PROJECT = "internal_project"


PARTNER_STATUSES: frozenset[str] = frozenset(m.value for m in PartnerStatus)
PARTNERSHIP_TYPES: frozenset[str] = frozenset(m.value for m in PartnershipType)

PUBLIC_PARTNER_STATUSES: frozenset[PartnerStatus] = frozenset(
    {
        PartnerStatus.ACTIVE,
        PartnerStatus.PREMIUM,
        PartnerStatus.FOUNDING_PARTNER,
    }
)


def is_public_partner_status(status: PartnerStatus | str) -> bool:
    resolved = status if isinstance(status, PartnerStatus) else PartnerStatus(status)
    return resolved in PUBLIC_PARTNER_STATUSES
