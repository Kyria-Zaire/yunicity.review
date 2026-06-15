"""Cultural place media conventions — Yunicity-owned, prod-safe (PROD-DATA-05C)."""

from __future__ import annotations

REIMS_CITY_SLUG = "reims"
CULTURAL_PLACE_COVER_FILENAME = "cover.jpg"
DEV_PUBLIC_CULTURAL_MEDIA_PREFIX = f"/places/{REIMS_CITY_SLUG}"

REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS: tuple[str, ...] = (
    "cathedrale-notre-dame",
    "palais-du-tau",
    "basilique-saint-remi",
    "musee-saint-remi",
    "musee-des-beaux-arts",
    "porte-de-mars",
    "cryptoportique",
    "opera-de-reims",
    "halles-boulingrin",
    "parc-de-champagne",
    "planetarium-de-reims",
    "frac-grand-est",
)


def cultural_place_dev_public_cover_url(slug: str) -> str:
    normalized = slug.strip().lower()
    return f"{DEV_PUBLIC_CULTURAL_MEDIA_PREFIX}/{normalized}/{CULTURAL_PLACE_COVER_FILENAME}"


def cultural_place_seed_cover_url(
    slug: str,
    *,
    app_env: str,
    web_frontend_url: str,
) -> str:
    """Absolute cover URL for prod-safe cultural place seeds."""
    relative = cultural_place_dev_public_cover_url(slug)
    return f"{web_frontend_url.rstrip('/')}{relative}"
