"""Local Video V2 (FEATURE-CREATORS-V2 / C2-S1)."""

from __future__ import annotations

from enum import StrEnum

LOCAL_VIDEO_MAX_BYTES = 50 * 1024 * 1024
LOCAL_VIDEO_MAX_DURATION_SECONDS = 60
LOCAL_VIDEO_PRESIGNED_TTL_SECONDS = 900
LOCAL_VIDEO_UPLOAD_RATE_LIMIT = 10
LOCAL_VIDEO_UPLOAD_RATE_WINDOW_SECONDS = 3600
LOCAL_VIDEO_TITLE_MAX_LENGTH = 80
LOCAL_VIDEO_DESCRIPTION_MAX_LENGTH = 300
LOCAL_VIDEO_DEFAULT_CITY = "Reims"
LOCAL_VIDEO_FEED_DEFAULT_LIMIT = 10
LOCAL_VIDEO_FEED_MAX_LIMIT = 20
LOCAL_VIDEO_COMMENT_BODY_MAX_LENGTH = 500
LOCAL_VIDEO_COMMENT_PAGE_DEFAULT = 20
LOCAL_VIDEO_COMMENT_PAGE_MAX = 50
LOCAL_VIDEO_REPORT_REVIEW_PRIORITY_THRESHOLD = 3

ALLOWED_LOCAL_VIDEO_CONTENT_TYPES = frozenset(
    {
        "video/mp4",
        "video/quicktime",
    }
)

EXTENSION_BY_LOCAL_VIDEO_MIME = {
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
}


class LocalVideoType(StrEnum):
    BON_PLAN = "bon_plan"
    MOMENT = "moment"
    QUARTIER = "quartier"
    LIEU = "lieu"
    TRIBU = "tribu"
    AUTRE = "autre"


class LocalVideoUploadStatus(StrEnum):
    PENDING = "pending"
    UPLOADED = "uploaded"
    CONSUMED = "consumed"
    EXPIRED = "expired"
    FAILED = "failed"


class LocalVideoStatus(StrEnum):
    PROCESSING = "processing"
    PUBLISHED = "published"
    FAILED = "failed"
    HIDDEN = "hidden"
    DELETED = "deleted"


class LocalVideoProcessingStatus(StrEnum):
    """Pipeline worker states (VIDEO-03A). READY maps to LocalVideoStatus.PUBLISHED."""

    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


LOCAL_VIDEO_PROCESSING_MAX_TRIES = 3
LOCAL_VIDEO_PROCESSING_RETRY_BACKOFF_SECONDS = (30, 120, 300)
# ARQ job_timeout — min. 300 s recommandé (vidéo 60 s + transcode Railway). Défaut 600 s.
LOCAL_VIDEO_PROCESSING_JOB_TIMEOUT_SECONDS = 600

LOCAL_VIDEO_PROCESSING_NON_RETRYABLE_CODES = frozenset(
    {
        "LOCAL_VIDEO_INVALID_MEDIA",
        "LOCAL_VIDEO_TOO_LONG",
        "LOCAL_VIDEO_TRANSCODE_FAILED",
        "LOCAL_VIDEO_THUMBNAIL_FAILED",
        "LOCAL_VIDEO_CITY_SLUG_MISMATCH",
    }
)


class LocalVideoReportReason(StrEnum):
    SPAM = "spam"
    HARASSMENT = "harassment"
    HATE = "hate"
    VIOLENCE = "violence"
    SEXUAL = "sexual"
    COPYRIGHT = "copyright"
    OTHER = "other"


class LocalVideoReportStatus(StrEnum):
    PENDING = "pending"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


LOCAL_VIDEO_REPORT_REASONS = frozenset(reason.value for reason in LocalVideoReportReason)
