"""Retire test partner orgs from public citizen surfaces (PILOT-REIMS / PARTNER-CLEANUP-P1).

Does not delete rows — sets partner_status=signed and organization.visibility=private.
Writes a JSON backup before apply for rollback.

Usage (from backend/):
    uv run python scripts/cleanup_test_partner_public_surfaces.py --dry-run
    uv run python scripts/cleanup_test_partner_public_surfaces.py --apply
    uv run python scripts/cleanup_test_partner_public_surfaces.py --restore \\
        data/dev_backups/<file>.json
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import get_settings  # noqa: E402
from app.core.organization_constants import OrganizationVisibility  # noqa: E402
from app.core.partner_constants import PartnerStatus  # noqa: E402
from app.db.session import dispose_db, get_engine, init_db  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.partner_profile import PartnerProfile  # noqa: E402
from sqlalchemy import select  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker  # noqa: E402
from sqlalchemy.orm import joinedload  # noqa: E402

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

DEFAULT_SLUGS = ("admin-creator-org-reject",)
BACKUP_DIR = BACKEND_ROOT / "data" / "dev_backups"
TARGET_PARTNER_STATUS = PartnerStatus.SIGNED
TARGET_VISIBILITY = OrganizationVisibility.PRIVATE


def _snapshot(org: Organization, profile: PartnerProfile) -> dict[str, Any]:
    return {
        "organization_id": str(org.id),
        "partner_profile_id": str(profile.id),
        "slug": org.slug,
        "name": org.name,
        "partner_status": str(profile.partner_status),
        "visibility": str(org.visibility),
        "backed_up_at": datetime.now(UTC).isoformat(),
    }


async def _load_targets(
    session: AsyncSession,
    slugs: tuple[str, ...],
) -> list[tuple[Organization, PartnerProfile]]:
    rows: list[tuple[Organization, PartnerProfile]] = []
    for slug in slugs:
        result = await session.execute(
            select(PartnerProfile)
            .join(PartnerProfile.organization)
            .options(joinedload(PartnerProfile.organization))
            .where(Organization.slug == slug)
        )
        profile = result.scalars().unique().one_or_none()
        if profile is None:
            logger.warning("skip slug=%s (no partner_profile)", slug)
            continue
        rows.append((profile.organization, profile))
    return rows


def _ensure_db() -> None:
    init_db(get_settings())
    if get_engine() is None:
        raise RuntimeError("DATABASE_URL is not configured (check backend/.env)")


async def dry_run(slugs: tuple[str, ...]) -> int:
    _ensure_db()
    engine = get_engine()
    assert engine is not None

    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        targets = await _load_targets(session, slugs)
        for org, profile in targets:
            logger.info(
                "would_update slug=%s partner_status %s -> %s visibility %s -> %s",
                org.slug,
                profile.partner_status,
                TARGET_PARTNER_STATUS.value,
                org.visibility,
                TARGET_VISIBILITY.value,
            )
    await dispose_db()
    return len(targets)


async def apply(slugs: tuple[str, ...]) -> Path:
    _ensure_db()
    engine = get_engine()
    assert engine is not None

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    backup_path = BACKUP_DIR / f"partner-public-cleanup-{timestamp}.json"

    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    snapshots: list[dict[str, Any]] = []

    async with factory() as session:
        targets = await _load_targets(session, slugs)
        if not targets:
            raise RuntimeError("No target organizations found — aborting without backup write")

        for org, profile in targets:
            snapshots.append(_snapshot(org, profile))
            profile.partner_status = TARGET_PARTNER_STATUS
            org.visibility = TARGET_VISIBILITY
            logger.info(
                "updated slug=%s partner_status=%s visibility=%s",
                org.slug,
                profile.partner_status,
                org.visibility,
            )

        backup_path.write_text(
            json.dumps({"entries": snapshots}, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        await session.commit()
        logger.info("backup_written path=%s", backup_path)

    await dispose_db()
    return backup_path


async def restore(backup_file: Path) -> None:
    _ensure_db()
    engine = get_engine()
    assert engine is not None

    payload = json.loads(backup_file.read_text(encoding="utf-8"))
    entries: list[dict[str, Any]] = payload.get("entries", [])
    if not entries:
        raise RuntimeError("Backup file has no entries")

    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        for entry in entries:
            org_id = entry["organization_id"]
            profile_id = entry["partner_profile_id"]
            org = await session.get(Organization, org_id)
            profile = await session.get(PartnerProfile, profile_id)
            if org is None or profile is None:
                logger.warning("skip missing ids slug=%s", entry.get("slug"))
                continue
            profile.partner_status = PartnerStatus(entry["partner_status"])
            org.visibility = OrganizationVisibility(entry["visibility"])
            logger.info(
                "restored slug=%s partner_status=%s visibility=%s",
                org.slug,
                profile.partner_status,
                org.visibility,
            )
        await session.commit()

    await dispose_db()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true", help="Log planned changes only")
    group.add_argument("--apply", action="store_true", help="Backup then apply cleanup")
    group.add_argument("--restore", metavar="BACKUP_JSON", help="Restore from backup file")
    parser.add_argument(
        "--slug",
        action="append",
        default=None,
        help="Organization slug (repeatable; default: admin-creator-org-reject)",
    )
    args = parser.parse_args()
    slugs = tuple(args.slug) if args.slug else DEFAULT_SLUGS

    if args.restore:
        asyncio.run(restore(Path(args.restore)))
        return
    if args.dry_run:
        count = asyncio.run(dry_run(slugs))
        logger.info("dry_run_complete targets=%s", count)
        return
    if args.apply:
        path = asyncio.run(apply(slugs))
        logger.info("apply_complete backup=%s", path)


if __name__ == "__main__":
    main()
