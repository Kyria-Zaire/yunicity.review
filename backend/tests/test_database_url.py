import pytest
from app.core.config import Settings
from app.db.database_url import to_asyncpg_url

RAILWAY_URL = "postgresql://user:pass@containers-us-west-123.railway.app:5432/railway"
ASYNCPG_URL = "postgresql+asyncpg://user:pass@db:5432/yunicity_prod"


def test_to_asyncpg_url_from_postgresql_scheme() -> None:
    assert to_asyncpg_url(RAILWAY_URL) == (
        "postgresql+asyncpg://user:pass@containers-us-west-123.railway.app:5432/railway"
    )


def test_to_asyncpg_url_from_postgres_scheme() -> None:
    assert to_asyncpg_url("postgres://user:pass@host:5432/db") == (
        "postgresql+asyncpg://user:pass@host:5432/db"
    )


def test_to_asyncpg_url_keeps_asyncpg_scheme() -> None:
    assert to_asyncpg_url(ASYNCPG_URL) == ASYNCPG_URL


def test_to_asyncpg_url_rejects_non_postgres() -> None:
    with pytest.raises(ValueError, match="DATABASE_URL must be a PostgreSQL URL"):
        to_asyncpg_url("mysql://user:pass@localhost/db")


def test_settings_normalizes_railway_database_url() -> None:
    settings = Settings(
        DATABASE_URL=RAILWAY_URL,
    )
    assert settings.database_url == (
        "postgresql+asyncpg://user:pass@containers-us-west-123.railway.app:5432/railway"
    )


def test_prod_settings_accepts_railway_postgresql_url() -> None:
    settings = Settings(
        APP_ENV="prod",
        DEBUG=False,
        JWT_SECRET_KEY="x" * 48,
        REFRESH_TOKEN_PEPPER="y" * 32,
        REFRESH_COOKIE_SECURE=True,
        DATABASE_URL=RAILWAY_URL,
        REDIS_URL="redis://redis:6379/0",
        CORS_ORIGINS=["https://yunicity.city"],
        WEB_FRONTEND_URL="https://yunicity.city",
        MEDIA_PUBLIC_BASE_URL="https://api.yunicity.city",
        EMAIL_PROVIDER="console",
    )
    assert settings.database_url is not None
    assert settings.database_url.startswith("postgresql+asyncpg://")
