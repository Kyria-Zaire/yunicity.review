"""Run seeds: python -m app.db.seeds [--demo]"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import Settings, get_settings
from app.db.seeds.auth_rbac import seed_auth_rbac
from app.db.seeds.passport_tiers import seed_passport_tiers
from app.db.seeds.reims_demo_content import seed_reims_demo_content
from app.db.seeds.stamp_definitions import seed_stamp_definitions

logger = logging.getLogger(__name__)


def _assert_demo_seed_allowed(settings: Settings) -> None:
    """Demo accounts must never be created in preprod or prod."""
    app_env = settings.app_env
    if app_env in ("preprod", "prod"):
        print(
            f"Refusing --demo seed: APP_ENV={app_env}. "
            "Demo content is allowed only in dev or recette.",
            file=sys.stderr,
        )
        raise SystemExit(2)


async def run(*, demo: bool) -> None:
    settings = get_settings()
    if demo:
        _assert_demo_seed_allowed(settings)
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
            await seed_passport_tiers(session)
            await seed_stamp_definitions(session)
            if demo:
                await seed_reims_demo_content(session)
            await session.commit()
        logger.info("Seed completed (demo=%s)", demo)
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(description="Yunicity database seeds")
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Reims QA content (dev/recette only — blocked in preprod/prod)",
    )
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run(demo=args.demo))


if __name__ == "__main__":
    main()
