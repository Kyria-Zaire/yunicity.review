from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

AppEnv = Literal["dev", "recette", "preprod", "prod"]
CookieSameSite = Literal["lax", "strict", "none"]
EmailProvider = Literal["none", "resend"]

_DEV_JWT_PLACEHOLDER = "dev-only-insecure-jwt-secret-change-in-env-32chars"
_WEAK_JWT_SECRETS = frozenset(
    {
        _DEV_JWT_PLACEHOLDER,
        "changeme",
        "secret",
        "jwt-secret",
        "your-secret-key",
    }
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = Field(default="Yunicity API", alias="APP_NAME")
    app_env: AppEnv = Field(default="dev", alias="APP_ENV")
    debug: bool = Field(default=False, alias="DEBUG")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    database_url: str | None = Field(default=None, alias="DATABASE_URL")
    redis_url: str | None = Field(default=None, alias="REDIS_URL")
    cors_origins: list[str] | str = Field(default="", alias="CORS_ORIGINS")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # Weather provider (WEB-SEARCH-02A)
    openweather_api_key: str | None = Field(default=None, alias="OPENWEATHER_API_KEY")

    jwt_secret_key: str = Field(default=_DEV_JWT_PLACEHOLDER, alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=15, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")
    refresh_cookie_name: str = Field(default="refresh_token", alias="REFRESH_COOKIE_NAME")
    refresh_cookie_secure: bool = Field(default=False, alias="REFRESH_COOKIE_SECURE")
    refresh_cookie_samesite: CookieSameSite = Field(default="lax", alias="REFRESH_COOKIE_SAMESITE")
    refresh_token_pepper: str = Field(default="", alias="REFRESH_TOKEN_PEPPER")
    web_frontend_url: str = Field(default="http://localhost:3000", alias="WEB_FRONTEND_URL")
    password_reset_expire_hours: int = Field(default=1, alias="PASSWORD_RESET_EXPIRE_HOURS")

    email_provider: EmailProvider = Field(default="none", alias="EMAIL_PROVIDER")
    resend_api_key: str | None = Field(default=None, alias="RESEND_API_KEY")
    email_from: str | None = Field(default=None, alias="EMAIL_FROM")

    expo_push_enabled: bool = Field(default=False, alias="EXPO_PUSH_ENABLED")
    expo_access_token: str | None = Field(default=None, alias="EXPO_ACCESS_TOKEN")

    passport_stamp_feed_events: bool = Field(
        default=False,
        alias="PASSPORT_STAMP_FEED_EVENTS",
    )

    grand_reims_gtfs_url: str | None = Field(default=None, alias="GRAND_REIMS_GTFS_URL")
    grand_reims_gtfs_rt_url: str | None = Field(default=None, alias="GRAND_REIMS_GTFS_RT_URL")
    grand_reims_gtfs_local_path: str | None = Field(
        default=None,
        alias="GRAND_REIMS_GTFS_LOCAL_PATH",
    )

    stripe_secret_key: str | None = Field(default=None, alias="STRIPE_SECRET_KEY")
    stripe_price_plus_monthly: str | None = Field(default=None, alias="STRIPE_PRICE_PLUS_MONTHLY")
    stripe_price_plus_annual: str | None = Field(default=None, alias="STRIPE_PRICE_PLUS_ANNUAL")
    stripe_price_premium_monthly: str | None = Field(
        default=None,
        alias="STRIPE_PRICE_PREMIUM_MONTHLY",
    )
    stripe_price_premium_annual: str | None = Field(
        default=None,
        alias="STRIPE_PRICE_PREMIUM_ANNUAL",
    )
    stripe_checkout_success_url: str | None = Field(
        default=None,
        alias="STRIPE_CHECKOUT_SUCCESS_URL",
    )
    stripe_checkout_cancel_url: str | None = Field(
        default=None,
        alias="STRIPE_CHECKOUT_CANCEL_URL",
    )

    media_upload_dir: str = Field(default="uploads", alias="MEDIA_UPLOAD_DIR")
    media_public_base_url: str = Field(
        default="http://localhost:8000",
        alias="MEDIA_PUBLIC_BASE_URL",
    )

    local_video_storage_backend: Literal["filesystem", "r2"] = Field(
        default="filesystem",
        alias="LOCAL_VIDEO_STORAGE_BACKEND",
    )
    local_video_max_bytes: int = Field(default=52_428_800, alias="LOCAL_VIDEO_MAX_BYTES")
    local_video_max_duration_seconds: int = Field(
        default=60,
        alias="LOCAL_VIDEO_MAX_DURATION_SECONDS",
    )
    local_video_presigned_ttl_seconds: int = Field(
        default=900,
        alias="LOCAL_VIDEO_PRESIGNED_TTL_SECONDS",
    )
    local_video_cdn_base_url: str | None = Field(default=None, alias="LOCAL_VIDEO_CDN_BASE_URL")
    local_video_r2_endpoint: str | None = Field(default=None, alias="LOCAL_VIDEO_R2_ENDPOINT")
    local_video_r2_access_key_id: str | None = Field(
        default=None,
        alias="LOCAL_VIDEO_R2_ACCESS_KEY_ID",
    )
    local_video_r2_secret_access_key: str | None = Field(
        default=None,
        alias="LOCAL_VIDEO_R2_SECRET_ACCESS_KEY",
    )
    local_video_r2_bucket: str | None = Field(default=None, alias="LOCAL_VIDEO_R2_BUCKET")

    bootstrap_admin_email: str | None = Field(
        default=None,
        alias="YUNICITY_BOOTSTRAP_ADMIN_EMAIL",
    )
    bootstrap_admin_password: str | None = Field(
        default=None,
        alias="YUNICITY_BOOTSTRAP_ADMIN_PASSWORD",
    )
    bootstrap_admin_full_name: str = Field(
        default="Yunicity Bootstrap Admin",
        alias="YUNICITY_BOOTSTRAP_ADMIN_FULL_NAME",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> list[str]:
        if value is None or value == "":
            return []
        if isinstance(value, list):
            return [str(item).strip().rstrip("/") for item in value if str(item).strip()]
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return []
            if stripped.startswith("["):
                import json

                parsed = json.loads(stripped)
                if not isinstance(parsed, list):
                    raise ValueError("CORS_ORIGINS must be a list")
                return [str(item).strip().rstrip("/") for item in parsed if str(item).strip()]
            return [part.strip().rstrip("/") for part in stripped.split(",") if part.strip()]
        raise ValueError("Invalid CORS_ORIGINS")

    @property
    def resolved_cors_origins(self) -> list[str]:
        """Origins effectives : env + WEB_FRONTEND_URL + paire apex/www yunicity.city."""
        seen: set[str] = set()
        origins: list[str] = []
        for raw in [*self.cors_origins, self.web_frontend_url.rstrip("/")]:
            if not raw or raw in seen:
                continue
            seen.add(raw)
            origins.append(raw)
        apex = "https://yunicity.city"
        www = "https://www.yunicity.city"
        if apex in seen and www not in seen:
            seen.add(www)
            origins.append(www)
        if www in seen and apex not in seen:
            seen.add(apex)
            origins.append(apex)
        return origins

    @field_validator("jwt_secret_key", mode="before")
    @classmethod
    def strip_jwt_secret(cls, value: object) -> str:
        if value is None:
            return _DEV_JWT_PLACEHOLDER
        return str(value).strip()

    @staticmethod
    def _is_localhost_url(url: str) -> bool:
        lowered = url.lower()
        return "localhost" in lowered or "127.0.0.1" in lowered

    @model_validator(mode="after")
    def validate_environment_rules(self) -> "Settings":
        if self.app_env == "prod" and self.debug:
            raise ValueError("DEBUG must be false when APP_ENV is prod")
        if self.app_env == "prod" and "*" in self.cors_origins:
            raise ValueError("CORS wildcard is not allowed in prod")
        if self.app_env in ("preprod", "prod"):
            if len(self.jwt_secret_key) < 32:
                raise ValueError("JWT_SECRET_KEY must be at least 32 characters")
            if self.jwt_secret_key in _WEAK_JWT_SECRETS:
                raise ValueError("JWT_SECRET_KEY is too weak for this environment")
            if not self.refresh_token_pepper.strip():
                raise ValueError("REFRESH_TOKEN_PEPPER must be set for this environment")
            if len(self.refresh_token_pepper.strip()) < 16:
                raise ValueError("REFRESH_TOKEN_PEPPER must be at least 16 characters")
        if self.app_env == "prod":
            if not self.refresh_cookie_secure:
                raise ValueError("REFRESH_COOKIE_SECURE must be true in prod")
            if not self.database_url:
                raise ValueError("DATABASE_URL is required in prod")
            if not self.redis_url:
                raise ValueError("REDIS_URL is required in prod (rate limits and sessions)")
            if not self.cors_origins:
                raise ValueError("CORS_ORIGINS must list the public web and admin origins in prod")
            if self._is_localhost_url(self.web_frontend_url):
                raise ValueError("WEB_FRONTEND_URL must not use localhost in prod")
            if any(self._is_localhost_url(origin) for origin in self.cors_origins):
                raise ValueError("CORS_ORIGINS must not include localhost in prod")
            if self._is_localhost_url(self.media_public_base_url):
                raise ValueError("MEDIA_PUBLIC_BASE_URL must not use localhost in prod")
            if self.email_provider != "resend":
                raise ValueError("EMAIL_PROVIDER must be 'resend' in prod")
            if not self.resend_api_key or not self.resend_api_key.strip():
                raise ValueError("RESEND_API_KEY is required in prod")
            if not self.email_from or not self.email_from.strip():
                raise ValueError("EMAIL_FROM is required in prod")
        return self

    @property
    def refresh_cookie_path(self) -> str:
        return f"{self.api_v1_prefix.rstrip('/')}/auth"

    @property
    def local_video_public_base_url(self) -> str:
        if self.local_video_cdn_base_url and self.local_video_cdn_base_url.strip():
            return self.local_video_cdn_base_url.rstrip("/")
        return self.media_public_base_url.rstrip("/")

    @property
    def access_token_ttl_seconds(self) -> int:
        return self.access_token_expire_minutes * 60


@lru_cache
def get_settings() -> Settings:
    return Settings()
