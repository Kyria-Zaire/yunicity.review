"""Run RBAC seeds: python -m app.db.seeds"""

import asyncio
import logging
import sys

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.db.seeds.auth_rbac import seed_auth_rbac

logger = logging.getLogger(__name__)


async def run() -> None:
    settings = get_settings()
    if not settings.database_url:
        print("DATABASE_URL is required to run seeds", file=sys.stderr)
        raise SystemExit(1)

    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    try:
        async with session_factory() as session:
            await seed_auth_rbac(session)
            await session.commit()
        logger.info("RBAC seed completed")
    finally:
        await engine.dispose()


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run())


if __name__ == "__main__":
    main()
