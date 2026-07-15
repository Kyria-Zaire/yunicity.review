"""SEED-PROD-01B Phase 2 — migrate cultural_places.gallery_images to the R2/CDN cover.

gallery_images was left out of the SEED-PROD-01B cover migration, so entries still
point at the dead legacy host `https://yunicity.city/places/reims/{slug}/cover.jpg`
(404). This repoints them at the already-uploaded R2 cover on `media.yunicity.city`
(same path, host swap only). No R2 upload — the cover object already exists.

Safe by default (dry-run: reads DB, prints the URL mapping, writes nothing).
--execute performs the UPDATE and REQUIRES --slug (small batches). Env-driven, so
it runs inside the target env via Railway (secrets never leave prod):

    railway run python scripts/seed_prod_01b_gallery_migrate.py                 # dry-run all
    railway run python scripts/seed_prod_01b_gallery_migrate.py --execute --slug cryptoportique

Only URLs under the legacy host + `/places/reims/…` are rewritten; everything else
(alt, credit, source, other entries) is preserved. Idempotent. Snapshot first:
scripts/seed_prod_01b_snapshot.py.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any

import asyncpg

# Windows consoles default to cp1252; force UTF-8 so accents/URLs render intact.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")  # type: ignore[union-attr]

BACKEND_ROOT = Path(__file__).resolve().parents[1]
MANIFEST = BACKEND_ROOT / "app" / "db" / "seeds" / "media_manifest_reims.json"

LEGACY_PREFIX = "https://yunicity.city/"
CDN_PREFIX = "https://media.yunicity.city/"
LEGACY_COVER_PREFIX = f"{LEGACY_PREFIX}places/reims/"


def _asyncpg_dsn(url: str) -> str:
    for prefix in ("postgresql+asyncpg://", "postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgres://" + url.removeprefix(prefix)
    return url


def _target_slugs() -> list[str]:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    return [p["slug"] for p in manifest["places"]]


def _filter_slugs(slugs: list[str], selected: str | None) -> list[str]:
    if not selected:
        return slugs
    wanted = {s.strip() for s in selected.split(",") if s.strip()}
    missing = wanted - set(slugs)
    if missing:
        raise SystemExit(f"[ERREUR] slugs hors périmètre: {sorted(missing)}")
    return [s for s in slugs if s in wanted]


def _migrate_url(url: str | None) -> str | None:
    """Rewrite only the dead legacy cover host; leave everything else untouched."""
    if url and url.startswith(LEGACY_COVER_PREFIX):
        return CDN_PREFIX + url[len(LEGACY_PREFIX) :]
    return url


def _migrate_gallery(gallery: Any) -> tuple[list[dict[str, Any]], int]:
    """Return (new_gallery, changed_count). Preserves alt/credit/source + other entries."""
    if isinstance(gallery, str):
        gallery = json.loads(gallery)
    if not isinstance(gallery, list):
        return [], 0
    out: list[dict[str, Any]] = []
    changed = 0
    for entry in gallery:
        if isinstance(entry, dict) and "url" in entry:
            new_url = _migrate_url(entry.get("url"))
            if new_url != entry.get("url"):
                changed += 1
            out.append({**entry, "url": new_url})
        else:
            out.append(entry)
    return out, changed


async def _run(*, execute: bool, slugs_filter: str | None) -> int:
    database_url = os.environ.get("DATABASE_URL", "").strip()
    if not database_url:
        print(
            "[ERREUR] DATABASE_URL non défini. Lancer via: "
            "railway run python scripts/seed_prod_01b_gallery_migrate.py …",
            file=sys.stderr,
        )
        return 1
    if execute and not slugs_filter:
        print("[BLOQUÉ] --execute exige --slug (petits lots obligatoires).", file=sys.stderr)
        return 2

    slugs = _filter_slugs(_target_slugs(), slugs_filter)
    mode = "EXECUTE" if execute else "DRY-RUN"
    print("=" * 78)
    print(f"SEED-PROD-01B Phase 2 — galerie -> media.yunicity.city [{mode}]")
    print(f"Lieux : {len(slugs)} -> {slugs}")
    print("=" * 78)

    conn = await asyncpg.connect(_asyncpg_dsn(database_url))
    changed_rows = 0
    try:
        for slug in slugs:
            row = await conn.fetchrow(
                "SELECT gallery_images FROM cultural_places WHERE slug = $1", slug
            )
            if row is None:
                print(f"\n> {slug}\n  [!] absent en DB")
                continue
            raw = row["gallery_images"]
            old_gallery = json.loads(raw) if isinstance(raw, str) else (raw or [])
            new_gallery, changed = _migrate_gallery(old_gallery)
            old_urls = [e.get("url") for e in old_gallery if isinstance(e, dict)]
            new_urls = [e.get("url") for e in new_gallery if isinstance(e, dict)]
            print(f"\n> {slug}  ({changed} URL à migrer)")
            for old, new in zip(old_urls, new_urls, strict=True):
                mark = "->" if old != new else "=="
                print(f"    {old}\n    {mark} {new}")
            if execute and changed:
                await conn.execute(
                    "UPDATE cultural_places SET gallery_images = $1::jsonb WHERE slug = $2",
                    json.dumps(new_gallery, ensure_ascii=False),
                    slug,
                )
                changed_rows += 1
                print("    [DB] gallery_images mis à jour")
    finally:
        await conn.close()

    print("\n" + "=" * 78)
    if execute:
        print(f"EXECUTE terminé : {changed_rows} ligne(s) mise(s) à jour.")
    else:
        print("DRY-RUN : aucune écriture. Relancer avec --execute --slug pour appliquer.")
    print("=" * 78)
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="SEED-PROD-01B Phase 2 gallery migration.")
    parser.add_argument("--execute", action="store_true", help="Applique l'UPDATE (exige --slug).")
    parser.add_argument("--slug", default=None, help="Slugs séparés par des virgules.")
    args = parser.parse_args(argv)
    return asyncio.run(_run(execute=args.execute, slugs_filter=args.slug))


if __name__ == "__main__":
    raise SystemExit(main())
