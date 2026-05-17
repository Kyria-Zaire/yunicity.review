from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

AppEnv = Literal["dev", "recette", "preprod", "prod"]


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

    @model_validator(mode="after")
    def validate_environment_rules(self) -> "Settings":
        if self.app_env == "prod" and self.debug:
            raise ValueError("DEBUG must be false when APP_ENV is prod")
        if self.app_env == "prod" and "*" in self.cors_origins:
            raise ValueError("CORS wildcard is not allowed in prod")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
