"""Local events constants (TICKET-505)."""

from enum import StrEnum

DEFAULT_EVENT_TIMEZONE = "Europe/Paris"
LOCAL_EVENT_LIST_PAGE_SIZE_DEFAULT = 20
LOCAL_EVENT_LIST_PAGE_SIZE_MAX = 50


class LocalEventVisibility(StrEnum):
    PUBLIC = "public"


class LocalEventModerationStatus(StrEnum):
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class LocalEventType(StrEnum):
    """MVP event categories — stored as string, not rigid DB enum."""

    CAFE_MEETUP = "cafe_meetup"
    LOCAL_MARKET = "local_market"
    ASSOCIATION_EVENING = "association_evening"
    STUDENT_EVENT = "student_event"
    LOCAL_CONCERT = "local_concert"
    EXHIBITION = "exhibition"
    CREATOR_MEETUP = "creator_meetup"
    PARTNER_EVENT = "partner_event"


MVP_LOCAL_EVENT_TYPES: tuple[str, ...] = tuple(t.value for t in LocalEventType)
