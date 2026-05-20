"""Local search constants (FEATURE-B / TICKET-B.4)."""

from __future__ import annotations

from enum import StrEnum

SEARCH_QUERY_MIN_LENGTH = 2
SEARCH_QUERY_MAX_LENGTH = 120
SEARCH_LIMIT_DEFAULT = 20
SEARCH_LIMIT_MAX = 50
SEARCH_MULTI_TYPE_PER_GROUP_CAP = 8
SEARCH_RATE_LIMIT = 30
SEARCH_RATE_WINDOW_SECONDS = 60
SEARCH_STATEMENT_TIMEOUT_MS = 3000
SEARCH_RANKING_EXPLANATION = "full_text_rank_then_chronological"
FTS_CONFIG = "french"


class SearchEntityType(StrEnum):
    POST = "post"
    EVENT = "event"
    ORGANIZATION = "org"
    OFFER = "offer"
    TRIBE = "tribe"
    USER = "user"
    NEIGHBORHOOD = "neighborhood"


class SearchPeriod(StrEnum):
    UPCOMING = "upcoming"
    PAST = "past"
    ALL = "all"


SEARCH_ENTITY_TYPES: frozenset[str] = frozenset(t.value for t in SearchEntityType)
SEARCH_PERIODS: frozenset[str] = frozenset(t.value for t in SearchPeriod)

# Fixed order when type=all (action-first).
SEARCH_ALL_TYPE_ORDER: tuple[SearchEntityType, ...] = (
    SearchEntityType.EVENT,
    SearchEntityType.ORGANIZATION,
    SearchEntityType.NEIGHBORHOOD,
    SearchEntityType.OFFER,
    SearchEntityType.POST,
    SearchEntityType.TRIBE,
    SearchEntityType.USER,
)
