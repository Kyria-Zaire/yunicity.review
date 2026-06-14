"""Supabase PostgreSQL connection helpers (env-only, no hardcoded secrets)."""

from __future__ import annotations

import os
import re

from app.db.database_url import to_asyncpg_url

__all__ = ["get_supabase_database_url", "sanitize_identifier", "to_asyncpg_url"]


def get_supabase_database_url() -> str | None:
    raw = os.environ.get("SUPABASE_DATABASE_URL", "").strip()
    return raw or None


def sanitize_identifier(value: str) -> str:
    if not re.fullmatch(r"[a-zA-Z_][a-zA-Z0-9_]*", value):
        raise ValueError(f"Identifiant SQL invalide : {value!r}")
    return value
