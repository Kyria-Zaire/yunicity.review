"""Quartiers V2 response mapping (FEATURE-QUARTIERS-V2 / Q2-S1-01)."""

from __future__ import annotations

import re
import unicodedata

from app.core.neighborhood_v2_constants import NEIGHBORHOOD_V2_MOOD_LABELS
from app.models.neighborhood import Neighborhood
from app.models.neighborhood_editorial import (
    NeighborhoodAlias,
    NeighborhoodMoodAssignment,
    NeighborhoodTimelineEntry,
)
from app.schemas.neighborhood import (
    NeighborhoodAliasItem,
    NeighborhoodResponse,
    NeighborhoodTimelineItem,
)

_SLUG_RE = re.compile(r"[^a-z0-9]+")


def slugify_alias_name(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name.strip().lower())
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = _SLUG_RE.sub("-", ascii_text).strip("-")
    return slug or "alias"


def map_alias_item(row: NeighborhoodAlias) -> NeighborhoodAliasItem:
    return NeighborhoodAliasItem(
        id=row.id,
        name=row.alias,
        slug=slugify_alias_name(row.alias),
        is_primary=row.is_primary,
    )


def map_timeline_item(row: NeighborhoodTimelineEntry) -> NeighborhoodTimelineItem:
    return NeighborhoodTimelineItem(
        id=row.id,
        year=row.year,
        title=row.title,
        description=row.body,
        display_order=row.sort_order,
    )


def map_mood_slugs(assignments: list[NeighborhoodMoodAssignment]) -> list[str]:
    ordered = sorted(assignments, key=lambda item: item.sort_order)
    return [item.mood_slug for item in ordered]


def map_mood_labels(mood_slugs: list[str]) -> list[str]:
    return [NEIGHBORHOOD_V2_MOOD_LABELS.get(slug, slug) for slug in mood_slugs]


def to_neighborhood_response(
    row: Neighborhood,
    *,
    include_editorial: bool,
) -> NeighborhoodResponse:
    aliases: list[NeighborhoodAliasItem] = []
    moods: list[str] = []
    timeline: list[NeighborhoodTimelineItem] = []

    if include_editorial:
        aliases = [map_alias_item(item) for item in sorted(row.aliases, key=lambda a: a.sort_order)]
        moods = map_mood_slugs(list(row.mood_assignments))
        timeline = [
            map_timeline_item(item)
            for item in sorted(
                row.timeline_entries,
                key=lambda entry: (entry.sort_order, entry.year),
            )
        ]

    return NeighborhoodResponse(
        id=row.id,
        city=row.city,
        slug=row.slug,
        display_name=row.display_name,
        short_description=row.short_description,
        ambiance=row.ambiance,
        cover_image_url=row.cover_image_url,
        accent_color=row.accent_color,
        latitude=float(row.latitude) if row.latitude is not None else None,
        longitude=float(row.longitude) if row.longitude is not None else None,
        radius_meters=row.radius_meters,
        is_featured=row.is_featured,
        is_active=row.is_active,
        created_at=row.created_at,
        updated_at=row.updated_at,
        long_story=row.long_story if include_editorial else None,
        featured_quote=row.featured_quote if include_editorial else None,
        # Les 6 colonnes 3a suivent le meme gate editorial (colonnes directes, pas de relation).
        audience=row.audience if include_editorial else None,
        neighborhood_type=row.neighborhood_type if include_editorial else None,
        local_life=row.local_life if include_editorial else None,
        green_spaces=row.green_spaces if include_editorial else None,
        mobility=row.mobility if include_editorial else None,
        daily_life=row.daily_life if include_editorial else None,
        aliases=aliases,
        moods=moods,
        timeline=timeline,
    )
