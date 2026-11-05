#!/usr/bin/env python3
"""Rotation des jetons QR Passport (PASSPORT-QR-TOKEN-ROTATION-01) — PRÉPRODUCTION.

Simulation par défaut : compte les Passports concernés, n'écrit rien.

Ciblage — le nom de base seul ne distingue pas les environnements (Railway nomme
souvent ses bases « railway ») : le script compare aussi l'endroit où il tourne,
lu dans les variables injectées par Railway, aux valeurs attendues :

    --expected-railway-project <id>      RAILWAY_PROJECT_ID
    --expected-railway-environment <id>  RAILWAY_ENVIRONMENT_ID
    --expected-railway-service <id>      RAILWAY_SERVICE_ID

S'ils sont fournis, ils sont vérifiés AVANT toute requête, simulation comprise.
L'écriture exige ``--execute``, ces trois identifiants, et :

    --expected-database <nom>   nom renvoyé par ``current_database()``
    --expected-count <N>        nombre total de Passports relevé par la simulation

Aucun jeton n'est affiché ni journalisé : seulement des compteurs.

Usage (depuis backend/) :
    python scripts/rotate_passport_qr_tokens.py
    python scripts/rotate_passport_qr_tokens.py --execute \\
        --expected-database <nom> --expected-count <N>
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from collections.abc import Mapping
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import get_settings  # noqa: E402
from app.services.passport_qr_rotation_service import (  # noqa: E402
    PassportQrRotationReport,
    PassportQrRotationService,
)
from sqlalchemy import text  # noqa: E402
from sqlalchemy.ext.asyncio import (  # noqa: E402
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Rotation des jetons QR Passport — simulation par défaut (préproduction).",
    )
    parser.add_argument("--execute", action="store_true", help="Écrire les nouveaux jetons.")
    parser.add_argument(
        "--expected-database", help="Nom exact de la base visée (obligatoire avec --execute)."
    )
    parser.add_argument(
        "--expected-count",
        type=int,
        help="Nombre total de Passports relevé par la simulation (obligatoire avec --execute).",
    )
    for cle, variable in RAILWAY_TARGET.items():
        parser.add_argument(
            f"--expected-railway-{cle}",
            help=f"{variable} attendu (obligatoire avec --execute).",
        )
    return parser


RAILWAY_TARGET = {
    "project": "RAILWAY_PROJECT_ID",
    "environment": "RAILWAY_ENVIRONMENT_ID",
    "service": "RAILWAY_SERVICE_ID",
}
RAILWAY_TARGET_NAMES = ("RAILWAY_PROJECT_NAME", "RAILWAY_ENVIRONMENT_NAME", "RAILWAY_SERVICE_NAME")


def target_errors(args: argparse.Namespace, environ: Mapping[str, str]) -> list[str]:
    """Ciblage Railway : vérifié s'il est fourni, obligatoire avec --execute."""
    errors: list[str] = []
    for cle, variable in RAILWAY_TARGET.items():
        attendu = getattr(args, f"expected_railway_{cle}")
        observe = environ.get(variable)
        if attendu is None:
            if args.execute:
                errors.append(f"--expected-railway-{cle} est obligatoire avec --execute.")
            continue
        if observe != attendu:
            errors.append(f"{variable} observé « {observe} » différent de l'attendu « {attendu} ».")
    return errors


def describe_target(environ: Mapping[str, str]) -> str:
    valeurs = [*(environ.get(v, "?") for v in RAILWAY_TARGET.values())]
    noms = [environ.get(n, "?") for n in RAILWAY_TARGET_NAMES]
    return (
        f"cible projet={noms[0]} ({valeurs[0]}) environnement={noms[1]} ({valeurs[1]}) "
        f"service={noms[2]} ({valeurs[2]})"
    )


def guard_errors(args: argparse.Namespace, *, database_name: str, total: int) -> list[str]:
    """Raisons de refuser l'écriture ; liste vide = écriture autorisée."""
    if not args.execute:
        return []
    errors: list[str] = []
    if not args.expected_database:
        errors.append("--expected-database est obligatoire avec --execute.")
    elif args.expected_database != database_name:
        errors.append(
            f"base connectée « {database_name} » différente de --expected-database "
            f"« {args.expected_database} »."
        )
    if args.expected_count is None:
        errors.append("--expected-count est obligatoire avec --execute.")
    elif args.expected_count != total:
        errors.append(f"{total} Passports trouvés, --expected-count annonce {args.expected_count}.")
    return errors


def format_report(report: PassportQrRotationReport, *, database_name: str, mode: str) -> str:
    detail = ", ".join(
        f"{status}={count}" for status, count in sorted(report.counts_by_status.items())
    )
    return (
        f"[{mode}] base={database_name} passports_total={report.total} "
        f"par_statut=({detail or 'aucun'}) jetons_remplaces={report.rotated}"
    )


def build_engine(database_url: str) -> AsyncEngine:
    """Moteur dédié au script : AUCUN paramètre SQL dans les journaux ni les erreurs.

    Les paramètres des requêtes contiennent les jetons. Le moteur de l'application
    active l'écho SQL quand ``DEBUG`` est vrai (QA, CI) : il ne doit pas servir ici.
    """
    return create_async_engine(database_url, echo=False, hide_parameters=True)


async def run(args: argparse.Namespace) -> int:
    print(describe_target(os.environ))
    errors_cible = target_errors(args, os.environ)
    if errors_cible:
        for error in errors_cible:
            print(f"REFUS : {error}", file=sys.stderr)
        return 2
    settings = get_settings()
    if not settings.database_url:
        print("REFUS : DATABASE_URL absente.", file=sys.stderr)
        return 2
    engine = build_engine(settings.database_url)
    try:
        factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with factory() as session:
            database_name = str(
                (await session.execute(text("select current_database()"))).scalar_one()
            )
            service = PassportQrRotationService(session)
            preview = await service.preview()
            print(format_report(preview, database_name=database_name, mode="simulation"))
            if not args.execute:
                print("Simulation seulement : aucune écriture.")
                return 0
            errors = guard_errors(args, database_name=database_name, total=preview.total)
            if errors:
                for error in errors:
                    print(f"REFUS : {error}", file=sys.stderr)
                return 2
            try:
                report = await service.rotate_all()
                await session.commit()
            except Exception:
                await session.rollback()
                print("ÉCHEC : rotation annulée (rollback), aucun jeton modifié.", file=sys.stderr)
                raise
            print(format_report(report, database_name=database_name, mode="execution"))
            return 0
    finally:
        await engine.dispose()


def main() -> int:
    return asyncio.run(run(build_parser().parse_args()))


if __name__ == "__main__":
    raise SystemExit(main())
