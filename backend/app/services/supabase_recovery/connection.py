"""Supabase PostgreSQL connection helpers (env-only, no hardcoded secrets)."""

from __future__ import annotations

import os
import re


def get_supabase_database_url() -> str | None:
    raw = os.environ.get("SUPABASE_DATABASE_URL", "").strip()
    return raw or None


def to_asyncpg_url(url: str) -> str:
    normalized = url.strip()
    if normalized.startswith("postgres://"):
        normalized = "postgresql+asyncpg://" + normalized[len("postgres://") :]
    elif normalized.startswith("postgresql://"):
        normalized = "postgresql+asyncpg://" + normalized[len("postgresql://") :]
    elif normalized.startswith("postgresql+psycopg://"):
        normalized = normalized.replace(
            "postgresql+psycopg://",
            "postgresql+asyncpg://",
            1,
        )
    if not normalized.startswith("postgresql+asyncpg://"):
        raise ValueError(
            "SUPABASE_DATABASE_URL doit être une URL PostgreSQL "
            "(postgres://, postgresql:// ou postgresql+asyncpg://)."
        )
    return normalized


def sanitize_identifier(value: str) -> str:
    if not re.fullmatch(r"[a-zA-Z_][a-zA-Z0-9_]*", value):
        raise ValueError(f"Identifiant SQL invalide : {value!r}")
    return value
