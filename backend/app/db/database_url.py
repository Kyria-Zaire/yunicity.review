"""Normalize PostgreSQL URLs for SQLAlchemy async (asyncpg)."""

from __future__ import annotations


def to_asyncpg_url(url: str) -> str:
    """Map Railway/Heroku-style URLs to postgresql+asyncpg:// for create_async_engine."""
    normalized = url.strip()
    if normalized.startswith("postgres://"):
        normalized = "postgresql+asyncpg://" + normalized[len("postgres://") :]
    elif normalized.startswith("postgresql://"):
        normalized = "postgresql+asyncpg://" + normalized[len("postgresql://") :]
    elif normalized.startswith("postgresql+psycopg2://"):
        normalized = "postgresql+asyncpg://" + normalized[len("postgresql+psycopg2://") :]
    elif normalized.startswith("postgresql+psycopg://"):
        normalized = normalized.replace(
            "postgresql+psycopg://",
            "postgresql+asyncpg://",
            1,
        )
    if not normalized.startswith("postgresql+asyncpg://"):
        raise ValueError(
            "DATABASE_URL must be a PostgreSQL URL "
            "(postgres://, postgresql://, or postgresql+asyncpg://)."
        )
    return normalized
