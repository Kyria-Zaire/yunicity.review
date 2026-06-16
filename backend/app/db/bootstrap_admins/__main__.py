"""Bootstrap initial production admin accounts: python -m app.db.bootstrap_admins"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.services.bootstrap_admins_service import (
    BootstrapAdminAccountResult,
    BootstrapSuperAdminEmailMissingError,
    bootstrap_initial_admin_accounts,
)

logger = logging.getLogger(__name__)


def _print_results(results: list[BootstrapAdminAccountResult]) -> None:
    created = [item for item in results if item.created]
    skipped = [item for item in results if not item.created]

    if created:
        print("=== Comptes administrateurs créés (mots de passe affichés une seule fois) ===")
        for item in created:
            print(f"- {item.account_key}: {item.email}")
            print(f"  rôle: {item.role_key}")
            print("  force_password_reset: true")
            if item.temporary_password:
                print(f"  mot de passe temporaire: {item.temporary_password}")
        print("Conservez ces mots de passe hors Git et changez-les après la première connexion.")

    if skipped:
        print("=== Comptes déjà existants (aucun mot de passe régénéré) ===")
        for item in skipped:
            print(f"- {item.account_key}: {item.email} (ignoré)")

    if not created and not skipped:
        print("Aucun compte administrateur traité.")


async def run() -> int:
    settings = get_settings()
    if not settings.database_url:
        print("DATABASE_URL is required to bootstrap admin accounts", file=sys.stderr)
        return 1

    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    try:
        async with session_factory() as session:
            try:
                results = await bootstrap_initial_admin_accounts(session, settings)
            except BootstrapSuperAdminEmailMissingError as exc:
                print(str(exc), file=sys.stderr)
                return 1
            await session.commit()
    finally:
        await engine.dispose()

    _print_results(results)
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Bootstrap initial Yunicity admin accounts (SUPER_ADMIN, ADMIN, STAFF). "
            "Idempotent: existing emails are skipped without password reset."
        )
    )
    parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    raise SystemExit(asyncio.run(run()))


if __name__ == "__main__":
    main()
