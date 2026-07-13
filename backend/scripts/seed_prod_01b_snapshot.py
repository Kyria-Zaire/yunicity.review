"""SEED-PROD-01B — authoritative pre-execute snapshot of the 12 cultural_places rows.

READ-ONLY. Selects every column needed to restore the exact prior state and writes
a timestamped JSON to backend/data/audit-archive/. No writes, no R2, no deletes.

Run via Railway so DATABASE_URL of the target service is injected (secrets never
leave the prod env):

    npx @railway/cli run -- python scripts/seed_prod_01b_snapshot.py
    # or, with a linked project/env/service:
    railway run python scripts/seed_prod_01b_snapshot.py

Slugs are read from the manifest (media_manifest_reims.json) so the two stay in sync.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import asyncpg

BACKEND_ROOT = Path(__file__).resolve().parents[1]
MANIFEST = BACKEND_ROOT / "app" / "db" / "seeds" / "media_manifest_reims.json"
SNAPSHOT_DIR = BACKEND_ROOT / "data" / "audit-archive"

# Columns captured for a faithful restore.
COLUMNS = (
    "slug",
    "hero_image_url",
    "image_url",
    "thumbnail_image_url",
    "image_source",
    "image_license",
    "photo_credit",
    "gallery_images",
)


def _asyncpg_dsn(url: str) -> str:
    for prefix in ("postgresql+asyncpg://", "postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgres://" + url.removeprefix(prefix)
    return url


def _target_slugs() -> list[str]:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    return [p["slug"] for p in manifest["places"]]


def _jsonable(value: Any) -> Any:
    # gallery_images comes back as a JSON string from asyncpg; keep it structured.
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.startswith(("[", "{")):
            try:
                return json.loads(stripped)
            except json.JSONDecodeError:
                return value
    return value


async def _run() -> int:
    database_url = os.environ.get("DATABASE_URL", "").strip()
    if not database_url:
        print(
            "[ERREUR] DATABASE_URL non défini. Lancer via: "
            "npx @railway/cli run -- python scripts/seed_prod_01b_snapshot.py",
            file=sys.stderr,
        )
        return 1

    slugs = _target_slugs()
    conn = await asyncpg.connect(_asyncpg_dsn(database_url))
    try:
        rows = await conn.fetch(
            f"SELECT {', '.join(COLUMNS)} FROM cultural_places WHERE slug = ANY($1::text[])",
            slugs,
        )
    finally:
        await conn.close()

    captured = {
        r["slug"]: {col: _jsonable(r[col]) for col in COLUMNS}
        for r in rows
    }
    missing = [s for s in slugs if s not in captured]

    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    snapshot = {
        "_ticket": "SEED-PROD-01B",
        "_kind": "authoritative-pre-execute-DB-snapshot",
        "captured_at_utc": stamp,
        "source": "SELECT cultural_places (prod DB via Railway)",
        "targets_total": len(slugs),
        "captured_count": len(captured),
        "missing_slugs": missing,
        "columns": list(COLUMNS),
        "rows": captured,
    }

    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    path = SNAPSHOT_DIR / f"seed-prod-01b-snapshot-{stamp}.json"
    path.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Snapshot écrit : {path}")
    print(f"Lignes capturées : {len(captured)}/{len(slugs)}")
    if missing:
        print(f"[ATTENTION] slugs absents en DB : {missing}")
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(_run()))
