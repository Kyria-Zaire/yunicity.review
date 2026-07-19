"""Controle de sante des couvertures de lieux culturels (#146). LECTURE SEULE.

Pourquoi ce script existe
-------------------------
Le 2026-07-19, un run de seed a bascule 12 couvertures du CDN vers une URL qui renvoie 404.
Aucun test, aucune erreur, aucun log ne l'a signale : la base restait parfaitement coherente
— 23 lieux, 23 actifs, 23 avec hero_image_url, 23 avec photo_credit. Ce qui l'a revele est
un comptage manuel (« 11 sur le CDN au lieu de 23 »).

#144 et #145 empechent ce chemin precis de se reproduire. Ce script est le filet pour les
chemins non prevus — y compris ceux ou aucun code applicatif ne tourne, comme un objet R2
supprime cote stockage.

Deux verifications, volontairement distinctes
--------------------------------------------
1. FORME  : combien de lieux actifs portent une couverture hebergee sur le CDN configure.
2. FOND   : un echantillon de ces URLs repond-il reellement (HEAD -> 200 + content-type image).

La seconde n'est pas redondante. Une URL peut etre bien formee et l'objet absent : c'est
exactement l'etat d'un lieu entre sa creation et son upload. Verifier le format seul
reviendrait a mesurer une chaine de caracteres et croire qu'on a mesure une image.

Lancement (DATABASE_URL injecte par Railway, secrets jamais exfiltres) :

    railway run -- python scripts/cultural_media_health_check.py
    railway run -- python scripts/cultural_media_health_check.py --sample 10

Sortie : 0 si tout va bien, 1 sinon. Les anomalies sont loguees en ERROR, donc remontees
par Sentry (OBS-01).
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import random
import sys
import urllib.error
import urllib.request

import asyncpg

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("cultural_media_health_check")

DEFAULT_SAMPLE = 5
HEAD_TIMEOUT_SECONDS = 20


def _asyncpg_dsn(url: str) -> str:
    for prefix in ("postgresql+asyncpg://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql://" + url[len(prefix) :]
    return url


def _head_is_image(url: str) -> tuple[bool, str]:
    """HEAD sur une URL de couverture. Renvoie (ok, detail lisible)."""
    request = urllib.request.Request(
        url, method="HEAD", headers={"User-Agent": "yunicity-media-health-check/1.0"}
    )
    try:
        with urllib.request.urlopen(request, timeout=HEAD_TIMEOUT_SECONDS) as response:
            content_type = response.headers.get("Content-Type", "")
            length = int(response.headers.get("Content-Length", 0) or 0)
            if response.status != 200:
                return False, f"HTTP {response.status}"
            if not content_type.startswith("image/"):
                return False, f"content-type={content_type or 'absent'}"
            if length < 1000:
                return False, f"taille suspecte ({length} octets)"
            return True, f"{content_type} {length // 1024} Ko"
    except urllib.error.HTTPError as exc:
        return False, f"HTTP {exc.code}"
    except Exception as exc:  # noqa: BLE001 — toute panne reseau doit remonter, pas planter
        return False, f"{type(exc).__name__}"


async def _run(sample_size: int) -> int:
    database_url = os.environ.get("DATABASE_URL", "").strip()
    cdn_base = os.environ.get("LOCAL_VIDEO_CDN_BASE_URL", "").strip().rstrip("/")
    if not database_url:
        logger.error("cultural_media_health_check DATABASE_URL absent")
        return 1
    if not cdn_base:
        logger.error("cultural_media_health_check LOCAL_VIDEO_CDN_BASE_URL absent")
        return 1

    conn = await asyncpg.connect(_asyncpg_dsn(database_url))
    try:
        active = await conn.fetchval("SELECT count(*) FROM cultural_places WHERE is_active")
        on_cdn = await conn.fetchval(
            "SELECT count(*) FROM cultural_places WHERE is_active AND hero_image_url LIKE $1",
            f"{cdn_base}/%",
        )
        offenders = await conn.fetch(
            """SELECT slug, hero_image_url FROM cultural_places
               WHERE is_active AND (hero_image_url IS NULL OR hero_image_url NOT LIKE $1)
               ORDER BY slug""",
            f"{cdn_base}/%",
        )
        hosted = await conn.fetch(
            """SELECT slug, hero_image_url FROM cultural_places
               WHERE is_active AND hero_image_url LIKE $1""",
            f"{cdn_base}/%",
        )
    finally:
        await conn.close()

    failures = 0

    print(f"lieux actifs          : {active}")
    print(f"couvertures sur le CDN: {on_cdn}")
    if offenders:
        failures += 1
        logger.error(
            "cultural_media_cover_off_cdn count=%s slugs=%s — couverture absente ou hors CDN",
            len(offenders),
            [row["slug"] for row in offenders],
        )
        for row in offenders:
            print(f"  HORS CDN  {row['slug']:<40} {row['hero_image_url'] or '(vide)'}")

    # Verification de fond : l'URL repond-elle vraiment ?
    urls = [(row["slug"], row["hero_image_url"]) for row in hosted]
    checked = random.sample(urls, min(sample_size, len(urls))) if urls else []
    print(f"\nHEAD sur {len(checked)} couverture(s) tirees au hasard :")
    broken: list[str] = []
    for slug, url in checked:
        ok, detail = _head_is_image(url)
        print(f"  {'OK ' if ok else 'KO '} {slug:<40} {detail}")
        if not ok:
            broken.append(slug)
    if broken:
        failures += 1
        logger.error(
            "cultural_media_cover_unreachable slugs=%s — URL sur le CDN mais objet illisible",
            broken,
        )

    if failures:
        print("\nRESULTAT : anomalies detectees (voir les logs ERROR ci-dessus)")
        return 1
    print("\nRESULTAT : toutes les couvertures actives sont sur le CDN et l'echantillon repond")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--sample",
        type=int,
        default=DEFAULT_SAMPLE,
        help=f"Nombre d'URLs verifiees par HEAD (defaut {DEFAULT_SAMPLE}, 0 pour aucune).",
    )
    args = parser.parse_args(argv)
    return asyncio.run(_run(max(0, args.sample)))


if __name__ == "__main__":
    sys.exit(main())
