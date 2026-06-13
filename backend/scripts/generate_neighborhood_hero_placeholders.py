#!/usr/bin/env python3
"""Generate controlled DEV placeholder JPEGs for Reims neighborhood heroes (Q2-S1-04)."""

from __future__ import annotations

import base64
from pathlib import Path

from app.core.neighborhood_hero_assets import (
    NEIGHBORHOOD_HERO_FILENAME,
    REIMS_CITY_SLUG,
    REIMS_NEIGHBORHOOD_HERO_SLUGS,
)

# Minimal valid 1×1 JPEG (stdlib only — replace with editorial assets later).
_MINIMAL_JPEG_B64 = (
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9"
    "PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeS4w/8AAEQgAAQABAwEiAAIRAQMRAf/E"
    "ABQAAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAA"
    "AGgP//Z"
)
_MINIMAL_JPEG = base64.b64decode(_MINIMAL_JPEG_B64 + "=" * (-len(_MINIMAL_JPEG_B64) % 4))

_REPO_ROOT = Path(__file__).resolve().parents[2]
_PUBLIC_ROOT = (
    _REPO_ROOT / "frontend" / "apps" / "web" / "public" / "neighborhoods" / REIMS_CITY_SLUG
)


def main() -> None:
    for slug in REIMS_NEIGHBORHOOD_HERO_SLUGS:
        target_dir = _PUBLIC_ROOT / slug
        target_dir.mkdir(parents=True, exist_ok=True)
        hero_path = target_dir / NEIGHBORHOOD_HERO_FILENAME
        hero_path.write_bytes(_MINIMAL_JPEG)
        print(f"wrote {hero_path.relative_to(_REPO_ROOT)}")


if __name__ == "__main__":
    main()
