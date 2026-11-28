import logging
from collections.abc import AsyncGenerator
from typing import Literal

from sqlalchemy import MetaData, text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import Settings, get_settings
from app.db.base import Base

logger = logging.getLogger(__name__)

# SQLAlchemy logs statements at INFO and, when its logger is at DEBUG, every result
# row at DEBUG. Rows carry tokens and PII: they must never be logged, whatever the
# configured level (APP-DEBUG-SQL-ECHO-TOKENS-01).
_SQLALCHEMY_ENGINE_LOGGER = "sqlalchemy.engine.Engine"


class _DropAllDebugRecords(logging.Filter):
    """Drop EVERY DEBUG record of the logger it is attached to.

    On ``sqlalchemy.engine.Engine`` this removes result rows and column names, and
    any other DEBUG message SQLAlchemy may emit there. INFO and above pass through.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        return record.levelno > logging.DEBUG


_ENGINE_DEBUG_FILTER = _DropAllDebugRecords()

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def init_db(settings: Settings | None = None) -> None:
    global _engine, _session_factory
    settings = settings or get_settings()
    if not settings.database_url:
        _engine = None
        _session_factory = None
        return
    _engine = create_async_engine(
        settings.database_url,
        pool_pre_ping=True,
        echo=settings.debug,
        # Bound values carry tokens and PII: keep them out of the SQL echo and out of
        # the text of SQLAlchemy errors, DEBUG or not. Does NOT cover values quoted by
        # the Postgres server or by asyncpg in their own error messages.
        hide_parameters=True,
    )
    engine_logger = logging.getLogger(_SQLALCHEMY_ENGINE_LOGGER)
    if _ENGINE_DEBUG_FILTER not in engine_logger.filters:
        engine_logger.addFilter(_ENGINE_DEBUG_FILTER)
    _session_factory = async_sessionmaker(
        bind=_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


def get_engine() -> AsyncEngine | None:
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession] | None:
    return _session_factory


async def dispose_db() -> None:
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _session_factory = None


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    if _session_factory is None:
        raise RuntimeError("Database is not configured (DATABASE_URL missing)")
    async with _session_factory() as session:
        yield session


CheckStatus = Literal["ok", "disabled", "error"]


async def check_database() -> CheckStatus:
    if _engine is None:
        return "disabled"
    try:
        async with _engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return "ok"
    except Exception:
        logger.exception("Database readiness check failed")
        return "error"


def get_metadata() -> MetaData:
    return Base.metadata
