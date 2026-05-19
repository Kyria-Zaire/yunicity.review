"""Safety guards for dev CLI tools."""

from __future__ import annotations

import sys

from app.core.config import Settings


def require_non_production_env(settings: Settings) -> None:
    """Block CLI when APP_ENV is prod (production)."""
    if settings.app_env == "prod":
        print(
            "Refusé : cette commande est réservée au développement local "
            "(APP_ENV=prod).",
            file=sys.stderr,
        )
        raise SystemExit(1)
