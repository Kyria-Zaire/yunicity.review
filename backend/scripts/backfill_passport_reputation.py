#!/usr/bin/env python3
"""Backfill passport reputation from historical stamps and redemptions (PASSPORT-01B).

Usage (from backend/):
    python scripts/backfill_passport_reputation.py --stamps --dry-run
    python scripts/backfill_passport_reputation.py --stamps --execute --limit 100
    python scripts/backfill_passport_reputation.py --redemptions --execute
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import get_settings  # noqa: E402
from app.services.passport_reputation_backfill_service import (  # noqa: E402
    BackfillReport,
    PassportReputationBackfillService,
)
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine  # noqa: E402

logger = logging.getLogger(__name__)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Backfill réputation Passport V2 depuis tampons et redemptions historiques.",
    )
    parser.add_argument(
        "--stamps",
        action="store_true",
        help="Traiter les passport_stamps existants.",
    )
    parser.add_argument(
        "--redemptions",
        action="store_true",
        help="Traiter les redemptions COMPLETED existantes.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Prévisualiser sans écrire (mode par défaut).",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Écrire les reputation_events manquants.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        metavar="N",
        help="Limiter le nombre de lignes scannées par catégorie.",
    )
    return parser


def _print_report(label: str, report: BackfillReport) -> None:
    print(f"\n=== {label} ===")
    print(f"scanned          : {report.scanned}")
    print(f"eligible         : {report.eligible}")
    print(f"created          : {report.created}")
    print(f"skipped_existing : {report.skipped_existing}")
    print(f"skipped_invalid  : {report.skipped_invalid}")
    print(f"errors           : {report.errors}")
    for detail in report.error_details[:20]:
        print(f"  - {detail}")
    if len(report.error_details) > 20:
        print(f"  ... {len(report.error_details) - 20} autres erreurs")


async def _run(
    *,
    stamps: bool,
    redemptions: bool,
    execute: bool,
    limit: int | None,
) -> int:
    settings = get_settings()
    if not settings.database_url:
        logger.error("DATABASE_URL is not configured")
        return 1

    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    combined = BackfillReport()

    async with factory() as session:
        service = PassportReputationBackfillService(session)
        if stamps:
            report = (
                await service.execute_stamps(limit=limit)
                if execute
                else await service.preview_stamps(limit=limit)
            )
            _print_report("STAMPS", report)
            combined.merge(report)
        if redemptions:
            report = (
                await service.execute_redemptions(limit=limit)
                if execute
                else await service.preview_redemptions(limit=limit)
            )
            _print_report("REDEMPTIONS", report)
            combined.merge(report)

    await engine.dispose()

    mode = "EXECUTE" if execute else "DRY-RUN"
    print(f"\nMode: {mode}")
    if combined.errors > 0:
        return 1
    return 0


def main() -> int:
    logging.basicConfig(level=logging.INFO)
    parser = _build_parser()
    args = parser.parse_args()

    if args.dry_run and args.execute:
        parser.error("Utiliser --dry-run ou --execute, pas les deux.")
    if not args.stamps and not args.redemptions:
        parser.error("Spécifier au moins --stamps et/ou --redemptions.")

    execute = args.execute
    return asyncio.run(
        _run(
            stamps=args.stamps,
            redemptions=args.redemptions,
            execute=execute,
            limit=args.limit,
        )
    )


if __name__ == "__main__":
    raise SystemExit(main())
