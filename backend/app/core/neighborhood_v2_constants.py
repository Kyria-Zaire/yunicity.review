"""Quartiers V2 editorial constants (FEATURE-QUARTIERS-V2 / Q2-S1-01)."""

from enum import StrEnum

NEIGHBORHOOD_FEATURED_QUOTE_MAX_LENGTH = 512
NEIGHBORHOOD_ALIAS_NAME_MAX_LENGTH = 120
NEIGHBORHOOD_ALIAS_SLUG_MAX_LENGTH = 80
NEIGHBORHOOD_TIMELINE_TITLE_MAX_LENGTH = 200
NEIGHBORHOOD_CONTRIBUTION_BODY_MIN_LENGTH = 40
NEIGHBORHOOD_CONTRIBUTION_BODY_MAX_LENGTH = 800
NEIGHBORHOOD_CONTRIBUTION_TITLE_MAX_LENGTH = 200
NEIGHBORHOOD_V2_MOODS_MAX_PER_HOOD = 3

NEIGHBORHOOD_DETAIL_VIDEOS_LIMIT = 3
NEIGHBORHOOD_DETAIL_PLACES_LIMIT = 6
NEIGHBORHOOD_DETAIL_EVENTS_LIMIT = 6
NEIGHBORHOOD_DETAIL_TRIBES_LIMIT = 6
NEIGHBORHOOD_DETAIL_CREATORS_LIMIT = 6
NEIGHBORHOOD_DETAIL_PASSPORT_OFFERS_LIMIT = 3
NEIGHBORHOOD_DETAIL_CONTRIBUTIONS_LIMIT = 3
NEIGHBORHOOD_OFFICIAL_LABEL_DEFAULT = "Quartier officiel"


class NeighborhoodMood(StrEnum):
    """Ticket Q2-S1-01 — moods autorisés (identifiants API)."""

    STUDENT = "student"
    FAMILY = "family"
    CREATIVE = "creative"
    FESTIVE = "festive"
    CALM = "calm"
    GOURMET = "gourmet"
    HERITAGE = "heritage"


MVP_NEIGHBORHOOD_MOODS: frozenset[str] = frozenset(m.value for m in NeighborhoodMood)


class NeighborhoodContributionStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


NEIGHBORHOOD_V2_MOOD_LABELS: dict[str, str] = {
    NeighborhoodMood.STUDENT.value: "Étudiant",
    NeighborhoodMood.FAMILY.value: "Familial",
    NeighborhoodMood.CREATIVE.value: "Créatif",
    NeighborhoodMood.FESTIVE.value: "Festif",
    NeighborhoodMood.CALM.value: "Calme",
    NeighborhoodMood.GOURMET.value: "Gourmand",
    NeighborhoodMood.HERITAGE.value: "Patrimonial",
}
