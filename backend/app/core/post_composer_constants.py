"""Citizen post composer (FEED-POST-COMPOSER-01)."""

from __future__ import annotations

from enum import StrEnum

POST_COMPOSER_BODY_MAX_LENGTH = 2200
POST_MEDIA_MAX_COUNT = 10
POST_POLL_OPTIONS_MAX = 4
POST_POLL_OPTIONS_MIN = 2
POST_POLL_QUESTION_MAX_LENGTH = 280
POST_POLL_OPTION_MAX_LENGTH = 80
POST_LOCATION_LABEL_MAX_LENGTH = 120
POST_ACTIVITY_LABEL_MAX_LENGTH = 120
POST_TAGGED_USERS_MAX = 20


class PostVisibility(StrEnum):
    PUBLIC = "public"
    FOLLOWERS = "followers"
    CLOSE_FRIENDS = "close_friends"
    CUSTOM = "custom"


class PostFormat(StrEnum):
    PHOTO = "photo"
    VIDEO = "video"
    TEXT = "text"
    POLL = "poll"
    LOCATION = "location"
