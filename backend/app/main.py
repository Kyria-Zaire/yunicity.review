import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.errors import AppError, app_error_handler
from app.core.logging import configure_logging
from app.core.media_root import prepare_media_root
from app.core.observability import RequestContextMiddleware, init_sentry
from app.db.session import dispose_db, init_db
from app.integrations.redis import close_redis, init_redis

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings)
    if init_sentry(settings):
        logger.info("sentry_enabled environment=%s", settings.app_env)
    if settings.app_env == "prod" and settings.email_provider == "console":
        logger.warning("Production email provider is console; real emails are disabled.")
    init_db(settings)
    await init_redis(settings)
    from app.core.profile_media_policy import validate_profile_media_storage_config
    from app.core.story_media_policy import validate_story_media_storage_config

    profile_media_warnings = validate_profile_media_storage_config(settings)
    for warning in profile_media_warnings:
        logger.warning("profile_media_storage_config: %s", warning)
    story_media_warnings = validate_story_media_storage_config(settings)
    for warning in story_media_warnings:
        logger.warning("story_media_storage_config: %s", warning)
    yield
    await close_redis()
    await dispose_db()


class MediaStaticFiles(StaticFiles):
    """`StaticFiles` + en-têtes média.

    Starlette gère déjà Range/206, `Accept-Ranges`, l'ETag et le refus des chemins
    remontants ; il ne liste jamais un répertoire (`html=False` par défaut). On ajoute
    seulement ce qui manque : `nosniff`, et un cache long légitime parce que les clés
    portent un UUID — un objet ne change jamais de contenu sous la même clé.
    """

    def is_not_modified(self, response_headers, request_headers):  # type: ignore[no-untyped-def]
        response_headers.setdefault("X-Content-Type-Options", "nosniff")
        response_headers.setdefault("Cache-Control", "public, max-age=31536000, immutable")
        return super().is_not_modified(response_headers, request_headers)

    async def get_response(self, path, scope):  # type: ignore[no-untyped-def]
        response = await super().get_response(path, scope)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Cache-Control", "public, max-age=31536000, immutable")
        return response


def create_app() -> FastAPI:
    settings = get_settings()
    hide_api_docs = settings.app_env == "prod"
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
        debug=settings.debug,
        docs_url=None if hide_api_docs else "/docs",
        redoc_url=None if hide_api_docs else "/redoc",
        openapi_url=None if hide_api_docs else "/openapi.json",
    )
    cors_origins = settings.resolved_cors_origins
    if cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    # Added last → outermost: sets request_id (contextvar + X-Request-ID response header)
    # before anything else runs, so every downstream log/error is correlated.
    app.add_middleware(RequestContextMiddleware)
    app.add_exception_handler(AppError, app_error_handler)  # type: ignore[arg-type]
    upload_root = prepare_media_root(
        settings.media_upload_dir,
        app_env=settings.app_env,
        opt_in=settings.managed_persistent_media_enabled,
    )
    # Montage public LIMITE a local-video. Monter toute la racine exposerait
    # `profiles/` et `stories/` en acces direct, contournant leurs endpoints et leurs
    # regles d'audience : une story privee ne doit jamais dependre du seul secret de son
    # UUID. Ces deux domaines gardent leurs routes /api/v1 dediees.
    local_video_root = upload_root / "local-video"
    local_video_root.mkdir(parents=True, exist_ok=True)
    app.mount(
        "/media/local-video",
        MediaStaticFiles(directory=str(local_video_root)),
        name="media-local-video",
    )
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app
