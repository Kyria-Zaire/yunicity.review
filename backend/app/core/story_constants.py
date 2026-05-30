"""Local stories portal (WEB-STORIES-01)."""

from __future__ import annotations

from enum import StrEnum


class StoryCategory(StrEnum):
    ALL = "all"
    CAFES_BARS = "cafes_bars"
    CONCERTS = "concerts"
    NATURE = "nature"
    CULTURE = "culture"
    SPORT = "sport"
    LOCAL_LIFE = "local_life"
    EVENTS = "events"


class StoryTab(StrEnum):
    FOR_YOU = "for_you"
    SUBSCRIPTIONS = "subscriptions"
    RECENT = "recent"


class StoryAudience(StrEnum):
    PUBLIC = "public"
    COMMUNITY = "community"


STORY_MEDIA_MAX_BYTES = 20 * 1024 * 1024
STORY_VIDEO_MAX_SECONDS = 15
STORY_TAGS_MAX_COUNT = 8
STORY_TAG_MAX_LENGTH = 32


STORY_CATEGORY_LABELS: dict[StoryCategory, str] = {
    StoryCategory.ALL: "Tous",
    StoryCategory.CAFES_BARS: "Cafés & Bars",
    StoryCategory.CONCERTS: "Concerts",
    StoryCategory.NATURE: "Nature",
    StoryCategory.CULTURE: "Culture",
    StoryCategory.SPORT: "Sport",
    StoryCategory.LOCAL_LIFE: "Vie locale",
    StoryCategory.EVENTS: "Événements",
}

STORY_CATEGORY_KEYWORDS: dict[StoryCategory, tuple[str, ...]] = {
    StoryCategory.CAFES_BARS: (
        "café",
        "coffee",
        "bar",
        "brasserie",
        "terrasse",
        "brunch",
    ),
    StoryCategory.CONCERTS: (
        "concert",
        "live",
        "scène",
        "musique",
        "jazz",
        "dj",
    ),
    StoryCategory.NATURE: (
        "nature",
        "parc",
        "balade",
        "forêt",
        "jardin",
        "canal",
    ),
    StoryCategory.CULTURE: (
        "culture",
        "musée",
        "expo",
        "théâtre",
        "art",
        "galerie",
        "cathédrale",
    ),
    StoryCategory.SPORT: (
        "sport",
        "running",
        "course",
        "vélo",
        "foot",
        "fitness",
        "yoga",
    ),
    StoryCategory.LOCAL_LIFE: (
        "marché",
        "quartier",
        "ville",
        "local",
        "citoyen",
        "communauté",
    ),
    StoryCategory.EVENTS: (
        "événement",
        "event",
        "festival",
        "soirée",
        "week-end",
        "weekend",
    ),
}

STORY_CAPTION_MAX_LENGTH = 100
STORY_LOCATION_LABEL_MAX_LENGTH = 120
STORY_TTL_HOURS = 24
STORY_RECENT_MINUTES = 60
STORY_PAGE_SIZE_DEFAULT = 18
STORY_PAGE_SIZE_MAX = 36
STORY_RING_MAX = 12
