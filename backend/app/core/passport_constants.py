"""Passport domain constants and enums — MVP foundation (TICKET-302)."""

from __future__ import annotations

from enum import StrEnum

PASSPORT_NUMBER_MAX_LENGTH = 32
PASSPORT_QR_TOKEN_MAX_LENGTH = 128
PASSPORT_CITY_MAX_LENGTH = 128
PASSPORT_ONBOARDING_STEP_MAX_LENGTH = 64

PARTNER_OFFER_TITLE_MAX_LENGTH = 160
PARTNER_OFFER_DESCRIPTION_MAX_LENGTH = 2000
PARTNER_OFFER_REJECTION_REASON_MAX_LENGTH = 1000

DEFAULT_PASSPORT_TIER_CODE = "basic"
DEFAULT_MAX_REDEMPTIONS_PER_PASSPORT = 1


class PassportTierCode(StrEnum):
    BASIC = "basic"
    SILVER = "silver"
    GOLD = "gold"
    NEO_ARRIVANT = "neo_arrivant"
    PRESS_CREATOR = "press_creator"
    BUSINESS = "business"


class PassportStatus(StrEnum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REVOKED = "revoked"


class PassportStampSource(StrEnum):
    """MVP: ORGANIZATION = partner scanned user QR; QR = user claimed partner QR."""

    ORGANIZATION = "organization"
    QR = "qr"


class PartnerOfferType(StrEnum):
    DRINK = "drink"
    DISCOUNT = "discount"
    VIP = "vip"
    GIFT = "gift"
    EVENT_ACCESS = "event_access"
    CUSTOM = "custom"


class PartnerOfferStatus(StrEnum):
    """Product offer_status — stored in partner_offers.status (TICKET-305A)."""

    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    PUBLISHED = "published"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class OfferRedemptionStatus(StrEnum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"


PASSPORT_TIER_CODES: frozenset[str] = frozenset(member.value for member in PassportTierCode)
PASSPORT_STATUSES: frozenset[str] = frozenset(member.value for member in PassportStatus)
PASSPORT_STAMP_SOURCES: frozenset[str] = frozenset(member.value for member in PassportStampSource)
PARTNER_OFFER_TYPES: frozenset[str] = frozenset(member.value for member in PartnerOfferType)
PARTNER_OFFER_STATUSES: frozenset[str] = frozenset(member.value for member in PartnerOfferStatus)
OFFER_REDEMPTION_STATUSES: frozenset[str] = frozenset(
    member.value for member in OfferRedemptionStatus
)

# MVP tier seed metadata (display_order, visibility, flags) — applied in Alembic migration.
MVP_PASSPORT_TIER_SEED: tuple[dict[str, object], ...] = (
    {
        "code": PassportTierCode.BASIC.value,
        "name": "Basic",
        "display_order": 10,
        "is_publicly_visible": True,
        "flags": {},
    },
    {
        "code": PassportTierCode.SILVER.value,
        "name": "Silver",
        "display_order": 20,
        "is_publicly_visible": True,
        "flags": {"min_engagement": "regular"},
    },
    {
        "code": PassportTierCode.GOLD.value,
        "name": "Gold",
        "display_order": 30,
        "is_publicly_visible": True,
        "flags": {"min_engagement": "high"},
    },
    {
        "code": PassportTierCode.NEO_ARRIVANT.value,
        "name": "Néo-arrivant",
        "display_order": 40,
        "is_publicly_visible": True,
        "flags": {"audience": "newcomer"},
    },
    {
        "code": PassportTierCode.PRESS_CREATOR.value,
        "name": "Press / Creator",
        "display_order": 50,
        "is_publicly_visible": True,
        "flags": {"audience": "press_creator"},
    },
    {
        "code": PassportTierCode.BUSINESS.value,
        "name": "Business",
        "display_order": 60,
        "is_publicly_visible": False,
        "flags": {"scope": "organization"},
    },
)
