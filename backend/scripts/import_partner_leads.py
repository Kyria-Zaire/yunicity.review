#!/usr/bin/env python3
"""Import partner leads from a controlled JSON file (dry-run by default)."""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import get_settings  # noqa: E402
from app.services.partner_lead_import import (  # noqa: E402
    PartnerLeadImportError,
    PartnerLeadImportService,
)
from sqlalchemy.ext.asyncio import (  # noqa: E402
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

logger = logging.getLogger(__name__)


def _resolve_file(path_str: str) -> Path:
    candidate = Path(path_str)
    if candidate.is_file():
        return candidate.resolve()
    from_backend = BACKEND_ROOT / path_str
    if from_backend.is_file():
        return from_backend.resolve()
    raise PartnerLeadImportError(f"Fichier introuvable : {path_str}")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Import contrôlé de partner leads (dry-run par défaut).",
    )
    parser.add_argument(
        "--file",
        required=True,
        help="Chemin JSON (ex. data/partner_leads/physical_partners_reims_2026.json)",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Écriture en base. Sans ce flag : dry-run uniquement.",
    )
    return parser


async def _run(file_path: Path, *, apply: bool) -> int:
    settings = get_settings()
    if not settings.database_url:
        print("DATABASE_URL est requis.", file=sys.stderr)
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
            service = PartnerLeadImportService(session)
            summary = await service.run_from_file(file_path, apply=apply)
    finally:
        await engine.dispose()

    mode = "APPLY" if apply else "DRY-RUN"
    print(f"=== Partner lead import ({mode}) ===")
    print(json.dumps(summary.as_dict(), indent=2, ensure_ascii=False))

    if summary.invalid > 0 and not apply:
        return 0
    return 0


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    parser = _build_parser()
    args = parser.parse_args()
    try:
        file_path = _resolve_file(args.file)
        exit_code = asyncio.run(_run(file_path, apply=args.apply))
    except PartnerLeadImportError as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1) from exc
    raise SystemExit(exit_code)


if __name__ == "__main__":
    main()
