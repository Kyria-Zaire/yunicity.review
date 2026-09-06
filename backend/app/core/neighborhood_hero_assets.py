"""Neighborhood hero media conventions — Yunicity-owned, R2-ready (Q2-S1-04)."""

from __future__ import annotations

REIMS_CITY_SLUG = "reims"
NEIGHBORHOOD_HERO_MEDIA_PREFIX = f"neighborhoods/{REIMS_CITY_SLUG}"
NEIGHBORHOOD_HERO_FILENAME = "hero.jpg"
NEIGHBORHOOD_COVER_FILENAME = "cover.jpg"
NEIGHBORHOOD_HERO_PLACEHOLDER_FILENAME = "hero-placeholder.jpg"

# Media CDN per environment (INFRA-01): media.{env}.yunicity.city, prod drops the env label.
YUNICITY_MEDIA_CDN_DOMAIN = "yunicity.city"
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

# Les 12 secteurs ACTIFS (conseils de quartier de Reims). Cette liste avait divergé du
# catalogue apres QUARTIER-01 phase 3c : elle portait encore boulingrin/cernay/jean-jaures
# (fusionnes puis desactives) et ignorait cernay-jean-jaures/courlancy/chatillons, donc 3
# secteurs actifs ne recevaient jamais leur hero. Garde-fou : tests/test_reims_official_sectors.py.
REIMS_NEIGHBORHOOD_HERO_SLUGS: tuple[str, ...] = (
    "centre-ville",
    "saint-remi",
    "clairmarais",
    "cernay-jean-jaures",
    "croix-rouge",
    "murigny",
    "courlancy",
    "chatillons",
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


def neighborhood_seed_cover_url(
    slug: str,
    *,
    app_env: str,
    web_frontend_url: str,
) -> str:
    """Cover URL written by seeds — DEV relative path, prod absolute via web app."""
    relative = neighborhood_dev_public_hero_url(slug)
    if app_env == "dev":
        return relative
    if app_env in ("prod", "preprod"):
        return f"{web_frontend_url.rstrip('/')}{relative}"
    if app_env == "recette":
        return neighborhood_cdn_hero_url(slug, app_env=app_env)
    return relative


def neighborhood_media_cdn_base_url(app_env: str) -> str:
    """Media CDN base for an environment (INFRA-01 convention).

    dev/recette/preprod -> https://media.{env}.yunicity.city
    prod                -> https://media.yunicity.city
    """
    env = app_env.strip().lower()
    if env == "prod":
        return f"https://media.{YUNICITY_MEDIA_CDN_DOMAIN}"
    return f"https://media.{env}.{YUNICITY_MEDIA_CDN_DOMAIN}"


def neighborhood_cdn_hero_url(slug: str, *, app_env: str) -> str:
    base = neighborhood_media_cdn_base_url(app_env)
    return f"{base}/{neighborhood_hero_storage_key(slug)}"


def is_forbidden_neighborhood_cover_url(url: str | None) -> bool:
    if not url:
        return False
    lowered = url.strip().lower()
    return any(fragment in lowered for fragment in FORBIDDEN_COVER_URL_FRAGMENTS)
