"""Dev database CLI — python -m app.db.dev <command>"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys

from app.core.config import get_settings
from app.db.dev._guards import require_non_production_env
from app.db.dev.promote_user import promote_user

logger = logging.getLogger(__name__)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m app.db.dev",
        description="Outils base de données réservés au développement local (jamais prod).",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    promote = subparsers.add_parser(
        "promote_user",
        help="Attribuer un rôle RBAC seedé à un utilisateur existant",
    )
    promote.add_argument("--email", required=True, help="Email du compte existant")
    promote.add_argument(
        "--role",
        required=True,
        help="Clé de rôle seedée (ex. SUPER_ADMIN, MODERATOR)",
    )
    return parser


async def _run_promote_user(email: str, role: str) -> int:
    try:
        result = await promote_user(email=email, role_key=role)
    except LookupError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    if result.created:
        print(f"OK — rôle {result.role_key} attribué à {result.email} (user_id={result.user_id})")
    else:
        print(
            f"OK — {result.email} avait déjà le rôle {result.role_key} "
            f"(user_id={result.user_id}, inchangé)"
        )
    return 0


def main(argv: list[str] | None = None) -> None:
    logging.basicConfig(level=logging.INFO)
    args = _build_parser().parse_args(argv)

    if args.command == "promote_user":
        settings = get_settings()
        require_non_production_env(settings)
        exit_code = asyncio.run(_run_promote_user(args.email, args.role))
        raise SystemExit(exit_code)

    raise SystemExit(f"Commande inconnue : {args.command}")


if __name__ == "__main__":
    main()
