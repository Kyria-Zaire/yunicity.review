from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

AppEnv = Literal["dev", "recette", "preprod", "prod"]
CookieSameSite = Literal["lax", "strict", "none"]

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
    cors_origins: list[str] = Field(default_factory=list, alias="CORS_ORIGINS")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    jwt_secret_key: str = Field(default=_DEV_JWT_PLACEHOLDER, alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=15, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")
    refresh_cookie_name: str = Field(default="refresh_token", alias="REFRESH_COOKIE_NAME")
    refresh_cookie_secure: bool = Field(default=False, alias="REFRESH_COOKIE_SECURE")
    refresh_cookie_samesite: CookieSameSite = Field(default="lax", alias="REFRESH_COOKIE_SAMESITE")
    refresh_token_pepper: str = Field(default="", alias="REFRESH_TOKEN_PEPPER")

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

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> list[str]:
        if value is None or value == "":
            return []
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("["):
                import json

                parsed = json.loads(stripped)
                if not isinstance(parsed, list):
                    raise ValueError("CORS_ORIGINS must be a list")
                return [str(item) for item in parsed]
            return [part.strip() for part in value.split(",") if part.strip()]
        raise ValueError("Invalid CORS_ORIGINS")

    @field_validator("jwt_secret_key", mode="before")
    @classmethod
    def strip_jwt_secret(cls, value: object) -> str:
        if value is None:
            return _DEV_JWT_PLACEHOLDER
        return str(value).strip()

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
        if self.app_env == "prod" and not self.refresh_cookie_secure:
            raise ValueError("REFRESH_COOKIE_SECURE must be true in prod")
        return self

    @property
    def refresh_cookie_path(self) -> str:
        return f"{self.api_v1_prefix.rstrip('/')}/auth"

    @property
    def access_token_ttl_seconds(self) -> int:
        return self.access_token_expire_minutes * 60


@lru_cache
def get_settings() -> Settings:
    return Settings()
