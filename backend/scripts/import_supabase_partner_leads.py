#!/usr/bin/env python3
"""Import historical Supabase partners into partner_leads (dry-run by default)."""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPORTS_DIR = BACKEND_ROOT / "reports"
DEFAULT_IMPORT_REPORT = REPORTS_DIR / "supabase_partner_import_report.md"

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import get_settings  # noqa: E402
from app.services.supabase_recovery.connection import get_supabase_database_url  # noqa: E402
from app.services.supabase_recovery.discovery import discover_from_database  # noqa: E402
from app.services.supabase_recovery.import_service import (  # noqa: E402
    SupabasePartnerImportError,
    SupabasePartnerImportService,
)
from app.services.supabase_recovery.reader import pick_default_source_table  # noqa: E402
from app.services.supabase_recovery.report import render_import_report  # noqa: E402
from sqlalchemy.ext.asyncio import (  # noqa: E402
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

logger = logging.getLogger(__name__)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Migration Supabase → partner_leads (dry-run par défaut).",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Écriture en base Yunicity. Sans ce flag: dry-run uniquement.",
    )
    parser.add_argument(
        "--source-table",
        type=str,
        help="Table source Supabase (ex. landing_partners).",
    )
    parser.add_argument(
        "--schema",
        type=str,
        default="public",
        help="Schéma PostgreSQL (défaut: public).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limiter le nombre de lignes scannées.",
    )
    parser.add_argument(
        "--report-only",
        action="store_true",
        help="Génère uniquement le rapport Markdown (nécessite --apply ou dry-run implicite).",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=str(DEFAULT_IMPORT_REPORT),
        help=f"Rapport import (défaut: {DEFAULT_IMPORT_REPORT})",
    )
    return parser


async def _resolve_source_table(database_url: str, explicit: str | None) -> str:
    if explicit:
        return explicit
    discoveries = await discover_from_database(database_url)
    picked = pick_default_source_table(discoveries)
    if not picked:
        raise SupabasePartnerImportError(
            "Impossible de déduire la table source — passer --source-table."
        )
    logger.info("Table source auto-sélectionnée: %s", picked)
    return picked


async def _run(
    *,
    apply: bool,
    source_table: str | None,
    schema: str,
    limit: int | None,
    report_only: bool,
    output: Path,
) -> int:
    supabase_url = get_supabase_database_url()
    if not supabase_url:
        print("SUPABASE_DATABASE_URL est requis.", file=sys.stderr)
        return 1

    settings = get_settings()
    if not settings.database_url:
        print("DATABASE_URL (CRM Yunicity) est requis.", file=sys.stderr)
        return 1

    table = await _resolve_source_table(supabase_url, source_table)
    yunicity_engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    session_factory = async_sessionmaker(
        bind=yunicity_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )

    try:
        async with session_factory() as session:
            service = SupabasePartnerImportService(session)
            summary = await service.run_from_database(
                supabase_url,
                schema=schema,
                source_table=table,
                limit=limit,
                apply=apply and not report_only,
            )
    finally:
        await yunicity_engine.dispose()

    mode = "APPLY" if apply and not report_only else "DRY-RUN"
    report_md = render_import_report(summary, mode=mode)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(report_md, encoding="utf-8")

    print(f"=== Supabase partner import ({mode}) ===")
    print(json.dumps(summary.as_dict(), indent=2, ensure_ascii=False))
    print(f"Rapport: {output}")
    return 0


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    parser = _build_parser()
    args = parser.parse_args()
    try:
        exit_code = asyncio.run(
            _run(
                apply=args.apply,
                source_table=args.source_table,
                schema=args.schema,
                limit=args.limit,
                report_only=args.report_only,
                output=Path(args.output).resolve(),
            )
        )
    except SupabasePartnerImportError as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1) from exc
    raise SystemExit(exit_code)


if __name__ == "__main__":
    main()
