from datetime import datetime
from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.local_video_constants import LOCAL_VIDEO_MAX_DURATION_SECONDS
from app.db.database_url import to_asyncpg_url

AppEnv = Literal["dev", "recette", "preprod", "prod"]
CookieSameSite = Literal["lax", "strict", "none"]
EmailProvider = Literal["none", "resend", "console"]

MAX_ROTATION_REPLAY_WINDOW_SECONDS = 30
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
    sentry_dsn: str | None = Field(default=None, alias="SENTRY_DSN")
    sentry_traces_sample_rate: float = Field(default=0.1, alias="SENTRY_TRACES_SAMPLE_RATE")

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: object) -> str | None:
        if value is None:
            return None
        if isinstance(value, str) and not value.strip():
            return None
        return to_asyncpg_url(str(value).strip())

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
    refresh_rotation_replay_window_seconds: int = Field(
        default=5, alias="REFRESH_ROTATION_REPLAY_WINDOW_SECONDS"
    )
    #: Ferme la creation de nouveaux comptes SANS toucher aux comptes existants
    #: (REGISTRATION-CONTAINMENT-01). Par defaut ouvert : seul un environnement
    #: qui le declare explicitement se ferme, donc aucun deploiement existant ne
    #: change de comportement en installant cette version.
    registration_enabled: bool = Field(default=True, alias="REGISTRATION_ENABLED")
    #: Inscriptions autorisees par heure et par IP. Defaut 5 : la valeur en vigueur
    #: jusqu'ici, donc Production et tout deploiement qui ne declare pas cette
    #: variable gardent EXACTEMENT le comportement actuel.
    #:
    #: Elle existe parce que le decompte porte sur l'IP publique vue par l'edge :
    #: derriere le NAT d'un etablissement, une promotion entiere partage une seule
    #: IP et 5 inscriptions suffisent a bloquer tout le monde. Relever cette seule
    #: valeur, sur un environnement donne, est preferable a desactiver la
    #: protection ou a la contourner par une allowlist.
    registration_rate_limit_per_hour: int = Field(
        default=5, ge=1, alias="REGISTRATION_RATE_LIMIT_PER_HOUR"
    )
    #: Mode d'ouverture : closed, pilot ou public (AUTH-04A). Source de verite
    #: UNIQUE. Non declaree, le mode se deduit de `registration_enabled`, afin
    #: qu'un deploiement existant ne change pas de comportement en installant
    #: cette version — le Preview actuellement ouvert compris.
    registration_mode: str = Field(default="", alias="REGISTRATION_MODE")
    #: Plafond par IP en mode PILOT. Defaut 120 : une salle de 100 personnes
    #: partageant une seule IP publique passe avec de la marge.
    registration_pilot_ip_hourly_limit: int = Field(
        default=120, ge=1, alias="REGISTRATION_PILOT_IP_HOURLY_LIMIT"
    )
    #: Tentatives d'inscription par adresse et par jour. Une personne s'inscrit
    #: une fois ; trois couvre les fautes de frappe sans laisser repeter.
    #: L'adresse n'apparait JAMAIS dans la cle : voir `rate_limit_identity`.
    registration_email_daily_limit: int = Field(
        default=3, ge=1, alias="REGISTRATION_EMAIL_DAILY_LIMIT"
    )
    #: Plafond par IP sur une minute. Coupe l'automatisation en rafale sans gener
    #: une file d'attente humaine devant un QR code.
    registration_ip_burst_limit: int = Field(default=10, ge=1, alias="REGISTRATION_IP_BURST_LIMIT")
    #: Inscriptions abouties par heure, toutes IP confondues. Seul garde-fou
    #: contre un robot reparti sur de nombreuses adresses.
    registration_global_hourly_limit: int = Field(
        default=100, ge=1, alias="REGISTRATION_GLOBAL_HOURLY_LIMIT"
    )
    #: Fin d'ouverture annoncee publiquement. Informative : la fermeture reelle
    #: reste un changement de mode, jamais une horloge qui se declencherait seule.
    registration_closes_at: datetime | None = Field(default=None, alias="REGISTRATION_CLOSES_AT")
    #: Turnstile en mode PILOT : configurable, jamais impose. En PUBLIC il est
    #: toujours exige, sans reglage possible.
    turnstile_required_in_pilot: bool = Field(default=False, alias="TURNSTILE_REQUIRED_IN_PILOT")
    turnstile_secret_key: str = Field(default="", alias="TURNSTILE_SECRET_KEY")
    #: Publique par conception : sert a monter le widget, et est exposee par
    #: `GET /auth/registration-status`.
    turnstile_site_key: str = Field(default="", alias="TURNSTILE_SITE_KEY")
    #: Hote attendu dans la reponse Siteverify. Vide = controle desactive, ce qui
    #: n'est acceptable qu'en developpement.
    turnstile_expected_hostname: str = Field(default="", alias="TURNSTILE_EXPECTED_HOSTNAME")
    turnstile_timeout_seconds: float = Field(default=3.0, gt=0, alias="TURNSTILE_TIMEOUT_SECONDS")
    #: Pepper DEDIE aux cles de limitation. Ne protege pas un secret : il empeche
    #: de retrouver une adresse a partir d'une cle Redis, y compris par
    #: dictionnaire. Distinct des autres peppers.
    rate_limit_key_pepper: str = Field(default="", alias="RATE_LIMIT_KEY_PEPPER")
    #: Budget d'e-mails transactionnels par jour UTC. 0 = aucun plafond.
    email_daily_budget: int = Field(default=0, ge=0, alias="EMAIL_DAILY_BUDGET")
    #: Part du budget reservee aux e-mails critiques — reinitialisation de mot de
    #: passe, securite du compte. Une vague d'inscriptions ne doit jamais priver
    #: un utilisateur legitime de la recuperation de son compte.
    email_daily_budget_reserve: int = Field(default=10, ge=0, alias="EMAIL_DAILY_BUDGET_RESERVE")
    #: Pepper DEDIE aux jetons de verification d'adresse (AUTH-01). Volontairement
    #: distinct de `refresh_token_pepper` : compromettre l'un ne doit pas permettre
    #: de forger l'autre.
    email_verification_token_pepper: str = Field(
        default="", alias="EMAIL_VERIFICATION_TOKEN_PEPPER"
    )
    email_verification_expire_hours: int = Field(
        default=24, alias="EMAIL_VERIFICATION_EXPIRE_HOURS"
    )
    #: Date a partir de laquelle un compte NOUVELLEMENT cree doit verifier son
    #: adresse pour ouvrir une session. Non configuree = exigence DESACTIVEE :
    #: aucun compte existant ne peut etre bloque par un oubli de configuration, et
    #: installer cette version ne change le comportement d'aucun deploiement.
    email_verification_enforced_from: datetime | None = Field(
        default=None, alias="EMAIL_VERIFICATION_ENFORCED_FROM"
    )
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
    # Opt-in EXPLICITE du stockage filesystem sur un runtime manage (Railway). Faux par
    # defaut : sans volume persistant declare, ecrire sur le disque local revient a
    # perdre les medias au redeploiement (posture C3.1-R1D). Voir app.core.media_root.
    managed_persistent_media_enabled: bool = Field(
        default=False,
        alias="MANAGED_PERSISTENT_MEDIA_ENABLED",
    )
    media_public_base_url: str = Field(
        default="http://localhost:8000",
        alias="MEDIA_PUBLIC_BASE_URL",
    )

    local_video_storage_backend: Literal["filesystem", "r2"] = Field(
        default="filesystem",
        alias="LOCAL_VIDEO_STORAGE_BACKEND",
    )
    story_media_storage_backend: Literal["r2", "filesystem"] = Field(
        default="r2",
        alias="STORY_MEDIA_STORAGE_BACKEND",
    )
    story_media_upload_dir: str | None = Field(
        default=None,
        alias="STORY_MEDIA_UPLOAD_DIR",
    )
    profile_media_storage_backend: Literal["r2", "filesystem"] = Field(
        default="filesystem",
        alias="PROFILE_MEDIA_STORAGE_BACKEND",
    )
    profile_media_upload_dir: str | None = Field(
        default=None,
        alias="PROFILE_MEDIA_UPLOAD_DIR",
    )
    local_video_max_bytes: int = Field(default=52_428_800, alias="LOCAL_VIDEO_MAX_BYTES")
    # VIDEO-04A-CONTRACT-FIX-01 — le defaut derive de la constante du domaine.
    # Une valeur dupliquee ici avait diverge (60) de la constante et du client (90) :
    # le client acceptait 61-90 s, le serveur rejetait avec un message annoncant 90.
    local_video_max_duration_seconds: int = Field(
        default=LOCAL_VIDEO_MAX_DURATION_SECONDS,
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
    local_video_default_city_slug: str = Field(
        default="reims",
        alias="LOCAL_VIDEO_DEFAULT_CITY_SLUG",
    )
    local_video_processing_job_timeout_seconds: int = Field(
        default=600,
        ge=300,
        alias="LOCAL_VIDEO_PROCESSING_JOB_TIMEOUT_SECONDS",
    )

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
    bootstrap_super_admin_email: str | None = Field(
        default=None,
        alias="YUNICITY_BOOTSTRAP_SUPER_ADMIN_EMAIL",
    )

    @field_validator("refresh_rotation_replay_window_seconds")
    @classmethod
    def _bound_rotation_replay_window(cls, value: int) -> int:
        """Borne la tolerance au rejeu d'une rotation (C3.1-R1K).

        0 desactive la tolerance et restaure le comportement strict a usage
        unique. La borne haute existe pour qu'une erreur de configuration ne
        puisse pas transformer la fenetre en session de secours durable :
        au-dela de quelques secondes, un token consomme redeviendrait une
        cible utile pour un attaquant.
        """
        if not 0 <= value <= MAX_ROTATION_REPLAY_WINDOW_SECONDS:
            raise ValueError(
                "REFRESH_ROTATION_REPLAY_WINDOW_SECONDS doit etre compris entre 0 et "
                f"{MAX_ROTATION_REPLAY_WINDOW_SECONDS} secondes (recu : {value})."
            )
        return value

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
            if self.email_provider not in ("resend", "console"):
                raise ValueError("EMAIL_PROVIDER must be 'resend' or 'console' in prod")
            if self.email_provider == "resend":
                if not self.resend_api_key or not self.resend_api_key.strip():
                    raise ValueError(
                        "RESEND_API_KEY is required when EMAIL_PROVIDER is resend in prod"
                    )
                if not self.email_from or not self.email_from.strip():
                    raise ValueError("EMAIL_FROM is required when EMAIL_PROVIDER is resend in prod")
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
