"""Partner media conventions — Yunicity-owned, prod-safe (PROD-DATA-05D)."""

from __future__ import annotations

REIMS_CITY_SLUG = "reims"
PARTNER_LOGO_FILENAME = "logo.svg"
PARTNER_BANNER_FILENAME = "banner.svg"
DEV_PUBLIC_PARTNER_MEDIA_PREFIX = f"/partners/{REIMS_CITY_SLUG}"

# Demo-only organizations from reims_demo_content.py — must never appear in prod catalog.
DEMO_PARTNER_SLUGS: frozenset[str] = frozenset(
    {
        "cafe-du-centre-reims",
        "caveau-saint-pierre",
    }
)


def partner_dev_public_logo_url(slug: str) -> str:
    normalized = slug.strip().lower()
    return f"{DEV_PUBLIC_PARTNER_MEDIA_PREFIX}/{normalized}/{PARTNER_LOGO_FILENAME}"


def partner_dev_public_banner_url(slug: str) -> str:
    normalized = slug.strip().lower()
    return f"{DEV_PUBLIC_PARTNER_MEDIA_PREFIX}/{normalized}/{PARTNER_BANNER_FILENAME}"


def partner_seed_logo_url(
    slug: str,
    *,
    app_env: str,
    web_frontend_url: str,
) -> str:
    """Absolute logo URL for prod-safe partner seeds."""
    relative = partner_dev_public_logo_url(slug)
    if app_env in ("prod", "preprod"):
        return f"{web_frontend_url.rstrip('/')}{relative}"
    return f"/seed/partners/{slug}-logo.svg"


def partner_seed_banner_url(
    slug: str,
    *,
    app_env: str,
    web_frontend_url: str,
) -> str:
    """Absolute banner URL for prod-safe partner seeds."""
    relative = partner_dev_public_banner_url(slug)
    if app_env in ("prod", "preprod"):
        return f"{web_frontend_url.rstrip('/')}{relative}"
    return f"/seed/partners/{slug}-banner.svg"
