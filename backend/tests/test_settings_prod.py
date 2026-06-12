import pytest
from app.core.config import Settings
from pydantic import ValidationError


def _prod_settings(**overrides: object) -> Settings:
    base: dict[str, object] = {
        "APP_ENV": "prod",
        "DEBUG": False,
        "JWT_SECRET_KEY": "x" * 48,
        "REFRESH_TOKEN_PEPPER": "y" * 32,
        "REFRESH_COOKIE_SECURE": True,
        "DATABASE_URL": "postgresql+asyncpg://user:pass@db:5432/yunicity_prod",
        "REDIS_URL": "redis://redis:6379/0",
        "CORS_ORIGINS": ["https://yunicity.fr", "https://admin.yunicity.fr"],
        "WEB_FRONTEND_URL": "https://yunicity.fr",
        "MEDIA_PUBLIC_BASE_URL": "https://api.yunicity.fr",
    }
    base.update(overrides)
    return Settings(**base)


def test_prod_settings_accepts_valid_configuration() -> None:
    settings = _prod_settings()
    assert settings.app_env == "prod"
    assert settings.refresh_cookie_secure is True


def test_prod_rejects_debug_enabled() -> None:
    with pytest.raises(ValidationError, match="DEBUG must be false"):
        _prod_settings(DEBUG=True)


def test_prod_rejects_insecure_refresh_cookie() -> None:
    with pytest.raises(ValidationError, match="REFRESH_COOKIE_SECURE"):
        _prod_settings(REFRESH_COOKIE_SECURE=False)


def test_prod_rejects_localhost_frontend_url() -> None:
    with pytest.raises(ValidationError, match="WEB_FRONTEND_URL"):
        _prod_settings(WEB_FRONTEND_URL="http://localhost:3000")


def test_prod_requires_redis_url() -> None:
    with pytest.raises(ValidationError, match="REDIS_URL"):
        _prod_settings(REDIS_URL=None)


def test_preprod_requires_refresh_token_pepper() -> None:
    with pytest.raises(ValidationError, match="REFRESH_TOKEN_PEPPER"):
        Settings(
            APP_ENV="preprod",
            JWT_SECRET_KEY="x" * 48,
            REFRESH_TOKEN_PEPPER="",
        )
