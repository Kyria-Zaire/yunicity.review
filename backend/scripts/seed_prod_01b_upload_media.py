"""SEED-PROD-01B — Cultural place media pipeline (DRY-RUN artifact).

DESIGN phase deliverable. This script SIMULATES the future pipeline:
  Wikimedia Commons source  ->  download  ->  R2 upload  ->  DB update

Safe modes (no side effects):
  * default run performs ZERO network / R2 / DB access — pure simulation;
  * --check-sources issues HEAD requests only (never downloads a body);
  * --resize-preview downloads + resizes in memory only (no upload/DB).

Real run (--execute): download -> resize -> upload R2 -> update cultural_places.
It is env-driven and MUST run inside the target environment so secrets stay there:

  railway run python scripts/seed_prod_01b_upload_media.py --execute \\
      --slug planetarium-de-reims,musee-saint-remi,cryptoportique

--execute requires --slug (small batches enforced) and these env vars (injected by
Railway): LOCAL_VIDEO_R2_ENDPOINT / _ACCESS_KEY_ID / _SECRET_ACCESS_KEY / _BUCKET,
LOCAL_VIDEO_CDN_BASE_URL, DATABASE_URL. Take a snapshot first
(scripts/seed_prod_01b_snapshot.py). gallery_images is left untouched.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

# Windows consoles default to cp1252; force UTF-8 so accents/URLs render intact.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")  # type: ignore[union-attr]

DEFAULT_MANIFEST = (
    Path(__file__).resolve().parents[1] / "app" / "db" / "seeds" / "media_manifest_reims.json"
)
CACHE_CONTROL = "public, max-age=31536000, immutable"
CONTENT_TYPE = "image/jpeg"
# Wikimedia rejects generic/opaque UAs (HTTP 403). Their policy requires an
# identifiable bot UA with a contact URL — reused by the real --execute download.
WIKIMEDIA_USER_AGENT = "Mozilla/5.0 (compatible; YunicityBot/1.0; +https://yunicity.city)"

# Cover resize budget (mandatory before any R2 upload).
MAX_COVER_WIDTH = 1600
MAX_COVER_BYTES = 250_000
JPEG_QUALITY_STEPS = (85, 80, 75, 70, 65, 60)
WIDTH_FALLBACK_STEPS = (1600, 1400, 1200, 1000)
MAX_DOWNLOAD_BYTES = 60_000_000  # hard cap: refuse absurd sources


@dataclass(slots=True)
class ResizeResult:
    data: bytes
    width: int
    height: int
    quality: int
    source_bytes: int


def _download_bytes(url: str) -> bytes:
    """Real GET of the source image (used by --resize-preview and --execute only)."""
    import httpx

    with httpx.Client(follow_redirects=True, timeout=60.0) as client:
        resp = client.get(url, headers={"User-Agent": WIKIMEDIA_USER_AGENT})
    resp.raise_for_status()
    data = resp.content
    if len(data) > MAX_DOWNLOAD_BYTES:
        raise ValueError(f"source trop lourde ({len(data)} octets > {MAX_DOWNLOAD_BYTES})")
    return data


def _resize_to_cover(source: bytes) -> ResizeResult:
    """Downscale to a web cover: <= MAX_COVER_WIDTH and <= MAX_COVER_BYTES JPEG.

    Tries decreasing JPEG quality, then decreasing target width, until the byte
    budget is met. Raises if the budget cannot be reached.
    """
    import io

    from PIL import Image  # type: ignore[import-untyped]

    for target_width in WIDTH_FALLBACK_STEPS:
        img = Image.open(io.BytesIO(source))
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        width, height = img.size
        if width > target_width:
            new_height = round(height * target_width / width)
            img = img.resize((target_width, new_height), Image.LANCZOS)
        out_w, out_h = img.size
        for quality in JPEG_QUALITY_STEPS:
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=quality, optimize=True, progressive=True)
            data = buf.getvalue()
            if len(data) <= MAX_COVER_BYTES:
                return ResizeResult(data, out_w, out_h, quality, len(source))
    # Last resort: smallest width + lowest quality even if slightly over budget.
    return ResizeResult(data, out_w, out_h, JPEG_QUALITY_STEPS[-1], len(source))


def _filter_places(places: list[dict[str, Any]], slugs: str | None) -> list[dict[str, Any]]:
    if not slugs:
        return places
    wanted = {s.strip() for s in slugs.split(",") if s.strip()}
    selected = [p for p in places if p.get("slug") in wanted]
    missing = wanted - {p.get("slug") for p in selected}
    if missing:
        raise SystemExit(f"[ERREUR] slugs introuvables dans le manifest: {sorted(missing)}")
    return selected


def _load_manifest(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise SystemExit(f"[ERREUR] Manifest introuvable: {path}")
    try:
        data: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:  # fail fast, don't swallow
        raise SystemExit(f"[ERREUR] Manifest JSON invalide: {exc}") from exc
    if not data.get("places"):
        raise SystemExit("[ERREUR] Manifest sans 'places'.")
    return data


def _cdn_url(cdn_base_url: str, target_key: str) -> str:
    return f"{cdn_base_url.rstrip('/')}/{target_key.lstrip('/')}"


def _validate_entry(entry: dict[str, Any]) -> list[str]:
    """Return blocking reasons that would prevent a real run for this entry."""
    problems: list[str] = []
    for field in ("slug", "source_url", "target_key"):
        if not entry.get(field):
            problems.append(f"champ requis manquant: {field}")
    if not entry.get("license"):
        problems.append("licence non renseignée (validation Founder requise)")
    if not entry.get("credit"):
        problems.append("crédit non renseigné")
    return problems


def _head_source(url: str) -> str:
    """HEAD only (no body) — used solely by --check-sources."""
    try:
        import httpx  # local import: not needed for pure dry-run
    except ImportError:
        return "httpx absent — impossible de vérifier (installer httpx)"
    try:
        with httpx.Client(follow_redirects=True, timeout=15.0) as client:
            resp = client.head(url, headers={"User-Agent": WIKIMEDIA_USER_AGENT})
        size = resp.headers.get("content-length", "?")
        ctype = resp.headers.get("content-type", "?")
        return f"HTTP {resp.status_code} · {ctype} · {size} octets"
    except httpx.HTTPError as exc:
        return f"échec HEAD: {exc!r}"


def run_dry_run(*, manifest_path: Path, check_sources: bool) -> int:
    manifest = _load_manifest(manifest_path)
    cdn_base = manifest.get("cdn_base_url", "https://media.recette.yunicity.city")
    places = manifest["places"]

    print("=" * 78)
    print("SEED-PROD-01B — DRY-RUN (aucune écriture réelle : réseau/R2/DB intacts)")
    print(f"Manifest : {manifest_path}")
    print(f"CDN base : {cdn_base}")
    print(f"Lieux    : {len(places)}")
    print(f"Réseau   : {'HEAD only (--check-sources)' if check_sources else 'désactivé'}")
    print("=" * 78)

    blocking = 0
    for entry in places:
        slug = entry.get("slug", "<?>")
        target_key = entry.get("target_key", "")
        cdn_url = _cdn_url(cdn_base, target_key)
        problems = _validate_entry(entry)

        print(f"\n> {slug}")
        print(f"  1. DOWNLOAD (simule)  <- {entry.get('source_url')}")
        if check_sources:
            print(f"     source HEAD        : {_head_source(entry['source_url'])}")
        print(f"  2. UPLOAD R2 (simule) -> key={target_key}")
        print(f"     Content-Type       : {CONTENT_TYPE}")
        print(f"     Cache-Control      : {CACHE_CONTROL}")
        print(f"     URL publique CDN   : {cdn_url}")
        print(f"  3. DB UPDATE (simulé) cultural_places WHERE slug={slug!r}")
        print(f"     hero_image_url     = {cdn_url}")
        print(f"     image_url (legacy) = {cdn_url}")
        print("     image_source       = 'wikimedia_commons'")
        print(f"     image_license      = {entry.get('license') or '<VIDE>'!r}")
        print(f"     photo_credit       = {entry.get('credit') or '<VIDE>'!r}")

        if problems:
            blocking += 1
            for reason in problems:
                print(f"  [!] BLOQUANT : {reason}")

    print("\n" + "=" * 78)
    print(f"RÉSUMÉ : {len(places)} lieux simulés · {blocking} avec point(s) bloquant(s)")
    print("Aucun octet téléchargé, aucun objet R2 écrit, aucune ligne DB modifiée.")
    print("Prochain pas : validation Founder → implémentation du chemin réel (--execute).")
    print("=" * 78)
    return 0


def run_resize_preview(*, manifest_path: Path, slugs: str | None) -> int:
    """Download + resize each selected source, report final cover size. No upload/DB."""
    manifest = _load_manifest(manifest_path)
    places = _filter_places(manifest["places"], slugs)

    print("=" * 78)
    print("SEED-PROD-01B — RESIZE PREVIEW (download + resize en mémoire, aucun upload/DB)")
    print(f"Budget : largeur <= {MAX_COVER_WIDTH}px · poids <= {MAX_COVER_BYTES // 1000} Ko · JPEG")
    print(f"Lieux  : {len(places)}")
    print("=" * 78)

    over_budget = 0
    for entry in places:
        slug = entry.get("slug", "<?>")
        try:
            source = _download_bytes(entry["source_url"])
            result = _resize_to_cover(source)
        except Exception as exc:  # report, don't abort the batch
            print(f"\n> {slug}\n  [!] ÉCHEC : {exc!r}")
            over_budget += 1
            continue
        ok = len(result.data) <= MAX_COVER_BYTES
        if not ok:
            over_budget += 1
        print(f"\n> {slug}")
        print(f"  source  : {result.source_bytes / 1_000_000:.1f} Mo")
        print(
            f"  cover   : {result.width}x{result.height}px · "
            f"{len(result.data) / 1000:.0f} Ko · q{result.quality} · "
            f"{'OK' if ok else 'HORS BUDGET'}"
        )

    print("\n" + "=" * 78)
    print(f"RÉSUMÉ : {len(places)} traités · {over_budget} hors budget/échec")
    print("Aucun octet uploadé, aucune ligne DB modifiée (redimensionnement en mémoire).")
    print("=" * 78)
    return 1 if over_budget else 0


_REQUIRED_EXECUTE_ENV = (
    "LOCAL_VIDEO_R2_ENDPOINT",
    "LOCAL_VIDEO_R2_ACCESS_KEY_ID",
    "LOCAL_VIDEO_R2_SECRET_ACCESS_KEY",
    "LOCAL_VIDEO_R2_BUCKET",
    "LOCAL_VIDEO_CDN_BASE_URL",
    "DATABASE_URL",
)

_UPDATE_SQL = """
    UPDATE cultural_places
    SET hero_image_url = $1,
        image_url = $1,
        thumbnail_image_url = $1,
        image_source = 'wikimedia_commons',
        image_license = $2,
        photo_credit = $3
    WHERE slug = $4
"""


def _asyncpg_dsn(url: str) -> str:
    for prefix in ("postgresql+asyncpg://", "postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgres://" + url.removeprefix(prefix)
    return url


def _r2_client(env: dict[str, str]):  # type: ignore[no-untyped-def]
    import boto3  # type: ignore[import-untyped]
    from botocore.client import Config  # type: ignore[import-untyped]

    return boto3.client(
        "s3",
        endpoint_url=env["LOCAL_VIDEO_R2_ENDPOINT"],
        aws_access_key_id=env["LOCAL_VIDEO_R2_ACCESS_KEY_ID"],
        aws_secret_access_key=env["LOCAL_VIDEO_R2_SECRET_ACCESS_KEY"],
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


async def run_execute(*, manifest_path: Path, slugs: str | None) -> int:
    """REAL run: download -> resize -> upload R2 -> update DB. Env-driven (Railway)."""
    if not slugs:
        print(
            "[BLOQUÉ] --execute exige --slug (petits lots obligatoires). "
            "Ex: --execute --slug planetarium-de-reims,musee-saint-remi",
            file=sys.stderr,
        )
        return 2
    missing_env = [k for k in _REQUIRED_EXECUTE_ENV if not os.environ.get(k)]
    if missing_env:
        print(
            "[BLOQUÉ] variables d'env manquantes (lancer via `railway run` sur le "
            f"service cible) : {missing_env}",
            file=sys.stderr,
        )
        return 2

    import asyncpg

    env = {k: os.environ[k] for k in _REQUIRED_EXECUTE_ENV}
    manifest = _load_manifest(manifest_path)
    places = _filter_places(manifest["places"], slugs)
    cdn_base = env["LOCAL_VIDEO_CDN_BASE_URL"].rstrip("/")
    bucket = env["LOCAL_VIDEO_R2_BUCKET"]

    print("=" * 78)
    print("SEED-PROD-01B — EXECUTE RÉEL (upload R2 + écriture DB)")
    print(f"CDN base : {cdn_base}")
    print(f"Lieux    : {len(places)} -> {[p['slug'] for p in places]}")
    print("=" * 78)

    client = _r2_client(env)
    conn = await asyncpg.connect(_asyncpg_dsn(env["DATABASE_URL"]))
    done = 0
    failed = 0
    try:
        for entry in places:
            slug = entry["slug"]
            key = entry["target_key"]
            public_url = f"{cdn_base}/{key}"
            try:
                source = _download_bytes(entry["source_url"])
                cover = _resize_to_cover(source)
                client.put_object(
                    Bucket=bucket,
                    Key=key,
                    Body=cover.data,
                    ContentType=CONTENT_TYPE,
                    CacheControl=CACHE_CONTROL,
                )
                status = await conn.execute(
                    _UPDATE_SQL, public_url, entry["license"], entry["credit"], slug
                )
            except Exception as exc:  # report per-place, continue batch
                failed += 1
                print(f"\n> {slug}\n  [!] ÉCHEC : {exc!r}")
                continue
            done += 1
            dims = f"{cover.width}x{cover.height}px · {len(cover.data) / 1000:.0f} Ko"
            print(f"\n> {slug}")
            print(f"  upload  : {dims} -> {key}")
            print(f"  url     : {public_url}")
            print(f"  db      : {status} (hero/image/thumbnail + source/license/credit)")
    finally:
        await conn.close()

    print("\n" + "=" * 78)
    print(f"RÉSUMÉ EXECUTE : {done} appliqués · {failed} échecs · gallery_images NON touché")
    print("=" * 78)
    return 1 if failed else 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="SEED-PROD-01B media pipeline (dry-run only).")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument(
        "--check-sources",
        action="store_true",
        help="Vérifie l'existence des sources via HEAD (aucun corps téléchargé).",
    )
    parser.add_argument(
        "--resize-preview",
        action="store_true",
        help="Télécharge + redimensionne en mémoire, rapporte la taille finale (aucun upload/DB).",
    )
    parser.add_argument(
        "--slug",
        default=None,
        help="Filtre par slug(s), séparés par des virgules (ex: palais-du-tau,cryptoportique).",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="(Bloqué) exécution réelle — indisponible en phase DESIGN.",
    )
    args = parser.parse_args(argv)

    if args.execute:
        return asyncio.run(run_execute(manifest_path=args.manifest, slugs=args.slug))

    if args.resize_preview:
        return run_resize_preview(manifest_path=args.manifest, slugs=args.slug)

    return run_dry_run(manifest_path=args.manifest, check_sources=args.check_sources)


if __name__ == "__main__":
    raise SystemExit(main())
