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
    )
    _session_factory = async_sessionmaker(
        bind=_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


def get_engine() -> AsyncEngine | None:
    return _engine


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
