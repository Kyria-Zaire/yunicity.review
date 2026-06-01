"""Partner creator content constants (WEB-PARTNERS-06A)."""

from enum import StrEnum

PARTNER_CREATOR_CONTENT_TITLE_MAX_LENGTH = 160
PARTNER_CREATOR_CONTENT_BODY_MAX_LENGTH = 5000
PARTNER_CREATOR_CONTENT_MEDIA_URL_MAX_LENGTH = 500
PARTNER_CREATOR_CONTENT_REJECTION_REASON_MAX_LENGTH = 500

PARTNER_CREATOR_CONTENT_STATUSES: frozenset[str] = frozenset(
    {
        "draft",
        "pending_review",
        "published",
        "rejected",
        "archived",
    }
)


class PartnerCreatorContentStatus(StrEnum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    PUBLISHED = "published"
    REJECTED = "rejected"
    ARCHIVED = "archived"
