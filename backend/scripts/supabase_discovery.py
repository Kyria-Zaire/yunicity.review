#!/usr/bin/env python3
"""Inspect restored Supabase PostgreSQL or SQL dump — generate discovery report."""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPORTS_DIR = BACKEND_ROOT / "reports"
DEFAULT_REPORT = REPORTS_DIR / "supabase_discovery_report.md"

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.supabase_recovery.connection import get_supabase_database_url  # noqa: E402
from app.services.supabase_recovery.discovery import (  # noqa: E402
    discover_from_database,
    discover_from_sql_dump,
    render_discovery_report,
)

logger = logging.getLogger(__name__)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Découverte dynamique du schéma Supabase (tables partenaires/leads).",
    )
    parser.add_argument(
        "--sql-dump",
        type=str,
        help="Chemin vers un dump PostgreSQL plain (.sql) si pas de DB live.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=str(DEFAULT_REPORT),
        help=f"Rapport Markdown (défaut: {DEFAULT_REPORT})",
    )
    return parser


async def _run(*, sql_dump: Path | None, output: Path) -> int:
    database_url = get_supabase_database_url()
    if sql_dump is not None:
        discoveries = discover_from_sql_dump(sql_dump)
        source_label = f"SQL dump `{sql_dump}`"
    elif database_url:
        discoveries = await discover_from_database(database_url)
        source_label = "SUPABASE_DATABASE_URL (live)"
    else:
        print(
            "Définir SUPABASE_DATABASE_URL ou passer --sql-dump path/to/backup.sql",
            file=sys.stderr,
        )
        return 1

    report = render_discovery_report(discoveries, source_label=source_label)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(report, encoding="utf-8")
    logger.info("Rapport écrit: %s (%s tables)", output, len(discoveries))
    print(f"Discovery OK - {len(discoveries)} tables -> {output}")
    return 0


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    parser = _build_parser()
    args = parser.parse_args()
    sql_dump = Path(args.sql_dump).resolve() if args.sql_dump else None
    output = Path(args.output).resolve()
    exit_code = asyncio.run(_run(sql_dump=sql_dump, output=output))
    raise SystemExit(exit_code)


if __name__ == "__main__":
    main()
