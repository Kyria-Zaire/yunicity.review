#!/usr/bin/env python3
"""Bootstrap or repair the platform SUPER_ADMIN account (PLATFORM-AUTH-RECOVERY-01).

Usage (Docker):
  docker compose exec backend python scripts/bootstrap_admin.py

Usage (local):
  cd backend && python scripts/bootstrap_admin.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import get_settings  # noqa: E402
from app.services.bootstrap_admin_service import (  # noqa: E402
    BootstrapCredentialsMissingError,
    bootstrap_admin_account,
)
from sqlalchemy.ext.asyncio import (  # noqa: E402
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


def _require_bootstrap_allowed() -> None:
    settings = get_settings()
    if settings.app_env == "prod":
        print(
            "Refusé : bootstrap admin interdit lorsque APP_ENV=prod. "
            "Utiliser une procédure ops contrôlée.",
            file=sys.stderr,
        )
        raise SystemExit(1)


async def _run() -> int:
    _require_bootstrap_allowed()
    settings = get_settings()
    if not settings.database_url:
        print("DATABASE_URL is required", file=sys.stderr)
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
                result = await bootstrap_admin_account(session, settings)
            except BootstrapCredentialsMissingError as exc:
                print(str(exc), file=sys.stderr)
                return 1
            await session.commit()
    finally:
        await engine.dispose()

    print("Admin bootstrap complete:")
    print(f"- email: {result.email}")
    print(f"- user_id: {result.user_id}")
    print(f"- role: {result.role}")
    print(f"- active: {result.active}")
    print(f"- created: {result.created}")
    print(f"- password_reset: {result.password_reset}")
    print(f"- role_restored: {result.role_restored}")
    return 0


def main() -> None:
    raise SystemExit(asyncio.run(_run()))


if __name__ == "__main__":
    main()
