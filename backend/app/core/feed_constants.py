"""Citizen feed constants (TICKET-402 / PRD-401)."""

from enum import StrEnum

POST_BODY_MAX_LENGTH = 5000
COMMENT_BODY_MAX_LENGTH = 500
FEED_PAGE_SIZE_DEFAULT = 20
FEED_PAGE_SIZE_MAX = 50


class PostAuthorType(StrEnum):
    CITIZEN = "citizen"
    ORGANIZATION = "organization"


class PostType(StrEnum):
    POST = "post"
    OFFER = "offer"


class ReportReason(StrEnum):
    SPAM = "spam"
    INAPPROPRIATE = "inappropriate"
    OTHER = "other"


class ReportStatus(StrEnum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    DISMISSED = "dismissed"
    ACTION_TAKEN = "action_taken"
