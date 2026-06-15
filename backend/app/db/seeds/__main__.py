"""Run seeds: python -m app.db.seeds [--demo]"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import Settings, get_settings
from app.db.seeds.auth_rbac import seed_auth_rbac
from app.db.seeds.bootstrap_admin import seed_bootstrap_admin
from app.db.seeds.passport_badges import seed_passport_badges
from app.db.seeds.passport_challenges import seed_passport_challenges
from app.db.seeds.passport_tiers import seed_passport_tiers
from app.db.seeds.reims_activation_waves import seed_reims_activation_waves
from app.db.seeds.reims_cultural_places_catalog import seed_reims_cultural_places_catalog
from app.db.seeds.reims_demo_content import seed_reims_demo_content
from app.db.seeds.reims_neighborhoods_catalog import seed_reims_neighborhoods_catalog
from app.db.seeds.reims_neighborhoods_v2_editorial import seed_reims_neighborhoods_v2_editorial
from app.db.seeds.reims_neighborhoods_v2_hero_assets import seed_reims_neighborhoods_v2_hero_assets
from app.db.seeds.reims_partner_events import seed_reims_partner_events
from app.db.seeds.reims_partner_offers import seed_reims_partner_offers
from app.db.seeds.reims_pilot_partner_memberships import seed_reims_pilot_partner_memberships
from app.db.seeds.reims_signed_partners import seed_reims_signed_partners
from app.db.seeds.reims_tribes import seed_reims_tribes
from app.db.seeds.stamp_definitions import seed_stamp_definitions
from app.db.seeds.yunicity_categories import seed_yunicity_categories
from app.db.seeds.yunicity_categories_catalog import seed_yunicity_categories_catalog

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


def _assert_pilot_seed_allowed(settings: Settings) -> None:
    """Pilot partner accounts must never be created in preprod or prod."""
    app_env = settings.app_env
    if app_env in ("preprod", "prod"):
        print(
            f"Refusing --pilot seed: APP_ENV={app_env}. "
            "Pilot partner accounts are allowed only in dev or recette.",
            file=sys.stderr,
        )
        raise SystemExit(2)


def _assert_exclusive_catalog_seed(
    *,
    neighborhoods: bool,
    categories: bool,
    cultural_places: bool,
    demo: bool,
    pilot: bool,
) -> None:
    catalog_flags = int(neighborhoods) + int(categories) + int(cultural_places)
    if catalog_flags > 1:
        print(
            "Refusing multiple catalog seeds: use only one of "
            "--neighborhoods, --categories, or --cultural-places.",
            file=sys.stderr,
        )
        raise SystemExit(2)
    if (neighborhoods or categories or cultural_places) and (demo or pilot):
        print(
            "Refusing catalog seed with --demo or --pilot: "
            "use a single catalog flag alone for production catalog seeding.",
            file=sys.stderr,
        )
        raise SystemExit(2)


async def run(
    *,
    demo: bool,
    pilot: bool,
    neighborhoods: bool,
    categories: bool,
    cultural_places: bool,
) -> None:
    settings = get_settings()
    if demo:
        _assert_demo_seed_allowed(settings)
    if pilot:
        _assert_pilot_seed_allowed(settings)
    _assert_exclusive_catalog_seed(
        neighborhoods=neighborhoods,
        categories=categories,
        cultural_places=cultural_places,
        demo=demo,
        pilot=pilot,
    )
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
            if neighborhoods:
                await seed_reims_neighborhoods_catalog(session, settings)
            elif categories:
                await seed_yunicity_categories_catalog(session)
            elif cultural_places:
                await seed_reims_cultural_places_catalog(session, settings)
            else:
                from app.db.seeds.reims_cultural_places import seed_reims_cultural_places
                from app.db.seeds.reims_neighborhoods import seed_reims_neighborhoods

                await seed_auth_rbac(session)
                await seed_bootstrap_admin(session, settings)
                await seed_passport_tiers(session)
                await seed_passport_badges(session)
                await seed_passport_challenges(session)
                await seed_stamp_definitions(session)
                await seed_yunicity_categories(session)
                await seed_reims_neighborhoods(session, settings=settings)
                await seed_reims_neighborhoods_v2_editorial(session)
                await seed_reims_neighborhoods_v2_hero_assets(session, settings=settings)
                await seed_reims_cultural_places(session)
                await seed_reims_signed_partners(session)
                await seed_reims_activation_waves(session)
                await seed_reims_partner_offers(session)
                await seed_reims_partner_events(session)
                if pilot:
                    await seed_reims_pilot_partner_memberships(session)
                if demo:
                    await seed_reims_demo_content(session)
                    await seed_reims_tribes(session)
            await session.commit()
        logger.info(
            "Seed completed (demo=%s, pilot=%s, neighborhoods=%s, categories=%s, cultural_places=%s)",
            demo,
            pilot,
            neighborhoods,
            categories,
            cultural_places,
        )
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(description="Yunicity database seeds")
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Reims QA content (dev/recette only — blocked in preprod/prod)",
    )
    parser.add_argument(
        "--pilot",
        action="store_true",
        help="Reims pilot partner OWNER accounts (dev/recette only — blocked in preprod/prod)",
    )
    parser.add_argument(
        "--neighborhoods",
        action="store_true",
        help=(
            "Reims official neighborhood catalog only (12 quartiers, idempotent, "
            "safe for prod/preprod — no demo partners or fake content)"
        ),
    )
    parser.add_argument(
        "--categories",
        action="store_true",
        help=(
            "Yunicity official category catalog only (12 categories, idempotent, "
            "safe for prod/preprod — no demo partners or fake content)"
        ),
    )
    parser.add_argument(
        "--cultural-places",
        action="store_true",
        help=(
            "Reims official cultural places only (12 lieux réels, idempotent, "
            "safe for prod/preprod — no demo partners or fake content)"
        ),
    )
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    asyncio.run(
        run(
            demo=args.demo,
            pilot=args.pilot,
            neighborhoods=args.neighborhoods,
            categories=args.categories,
            cultural_places=args.cultural_places,
        )
    )


if __name__ == "__main__":
    main()
