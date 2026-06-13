"""Neighborhood hero media conventions — Yunicity-owned, R2-ready (Q2-S1-04)."""

from __future__ import annotations

REIMS_CITY_SLUG = "reims"
NEIGHBORHOOD_HERO_MEDIA_PREFIX = f"neighborhoods/{REIMS_CITY_SLUG}"
NEIGHBORHOOD_HERO_FILENAME = "hero.jpg"
NEIGHBORHOOD_COVER_FILENAME = "cover.jpg"
NEIGHBORHOOD_HERO_PLACEHOLDER_FILENAME = "hero-placeholder.jpg"

YUNICITY_CDN_BASE_URL = "https://cdn.yunicity.fr"
DEV_PUBLIC_NEIGHBORHOOD_MEDIA_PREFIX = f"/neighborhoods/{REIMS_CITY_SLUG}"

FORBIDDEN_COVER_URL_FRAGMENTS: frozenset[str] = frozenset(
    {
        "bing",
        "istock",
        "unsplash",
        "shutterstock",
        "rossel",
        "hebdo",
        "wikipedia",
        "wikimedia",
    }
)

REIMS_NEIGHBORHOOD_HERO_SLUGS: tuple[str, ...] = (
    "centre-ville",
    "saint-remi",
    "boulingrin",
    "clairmarais",
    "cernay",
    "croix-rouge",
    "murigny",
    "jean-jaures",
    "la-neuvillette",
    "orgeval",
    "chemin-vert",
    "maison-blanche",
)


def neighborhood_hero_storage_key(slug: str) -> str:
    normalized = slug.strip().lower()
    return f"{NEIGHBORHOOD_HERO_MEDIA_PREFIX}/{normalized}/{NEIGHBORHOOD_HERO_FILENAME}"


def neighborhood_cover_storage_key(slug: str) -> str:
    normalized = slug.strip().lower()
    return f"{NEIGHBORHOOD_HERO_MEDIA_PREFIX}/{normalized}/{NEIGHBORHOOD_COVER_FILENAME}"


def neighborhood_dev_public_hero_url(slug: str) -> str:
    normalized = slug.strip().lower()
    return f"{DEV_PUBLIC_NEIGHBORHOOD_MEDIA_PREFIX}/{normalized}/{NEIGHBORHOOD_HERO_FILENAME}"


def neighborhood_cdn_hero_url(slug: str) -> str:
    return f"{YUNICITY_CDN_BASE_URL}/{neighborhood_hero_storage_key(slug)}"


def is_forbidden_neighborhood_cover_url(url: str | None) -> bool:
    if not url:
        return False
    lowered = url.strip().lower()
    return any(fragment in lowered for fragment in FORBIDDEN_COVER_URL_FRAGMENTS)
