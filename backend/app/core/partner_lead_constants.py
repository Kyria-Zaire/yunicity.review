"""Partner lead domain constants and enums."""

from __future__ import annotations

from enum import StrEnum

PARTNER_LEAD_NAME_MAX_LENGTH = 160
PARTNER_LEAD_NOTES_MAX_LENGTH = 5000
PARTNER_LEAD_TAGS_MAX_COUNT = 20
PARTNER_LEAD_TAG_MAX_LENGTH = 64
PARTNER_LEAD_IMPORT_MAX_ROWS = 500
PARTNER_LEAD_LIST_PAGE_SIZE_DEFAULT = 20
PARTNER_LEAD_LIST_PAGE_SIZE_MAX = 100
PARTNER_LEAD_INTERNAL_RATING_MIN = 1
PARTNER_LEAD_INTERNAL_RATING_MAX = 5


class PartnerLeadSource(StrEnum):
    LANDING_PAGE = "landing_page"
    PHYSICAL_PROSPECTING = "physical_prospecting"
    REFERRAL = "referral"
    INSTAGRAM = "instagram"
    EVENT = "event"
    INBOUND = "inbound"
    OUTBOUND = "outbound"
    MANUAL = "manual"
    OTHER = "other"


class PartnerLeadStatus(StrEnum):
    NEW = "new"
    CONTACTED = "contacted"
    INTERESTED = "interested"
    MEETING_SCHEDULED = "meeting_scheduled"
    SIGNED = "signed"
    CONVERTED = "converted"
    REJECTED = "rejected"
    ARCHIVED = "archived"


PARTNER_LEAD_SOURCES: frozenset[str] = frozenset(m.value for m in PartnerLeadSource)
PARTNER_LEAD_STATUSES: frozenset[str] = frozenset(m.value for m in PartnerLeadStatus)

CONVERTED_PARTNER_LEAD_STATUSES: frozenset[str] = frozenset({PartnerLeadStatus.CONVERTED.value})
