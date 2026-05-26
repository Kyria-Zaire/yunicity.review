#!/usr/bin/env python3
"""Import Grand Reims Mobilités GTFS static feed into PostgreSQL.

Usage (from backend/):
  uv run python scripts/import_grand_reims_gtfs.py

Requires GRAND_REIMS_GTFS_URL or GRAND_REIMS_GTFS_LOCAL_PATH in environment.
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import httpx

_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from app.core.config import get_settings  # noqa: E402
from app.db.session import get_session_factory, init_db  # noqa: E402
from app.repositories.transit_repository import TransitRepository  # noqa: E402
from app.services.gtfs_import import GtfsImportResult, load_gtfs_bytes, parse_gtfs_zip  # noqa: E402


async def _fetch_gtfs(url: str) -> bytes:
    async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.content


async def run_import() -> GtfsImportResult:
    import time

    settings = get_settings()
    if settings.grand_reims_gtfs_local_path:
        data = load_gtfs_bytes(Path(settings.grand_reims_gtfs_local_path))
        source_url = f"file://{settings.grand_reims_gtfs_local_path}"
    elif settings.grand_reims_gtfs_url:
        data = await _fetch_gtfs(settings.grand_reims_gtfs_url)
        source_url = settings.grand_reims_gtfs_url
    else:
        raise SystemExit(
            "Configure GRAND_REIMS_GTFS_URL or GRAND_REIMS_GTFS_LOCAL_PATH before import."
        )

    t0 = time.perf_counter()
    stops, departures, meta = parse_gtfs_zip(data)
    print(f"Parsed {len(stops)} stops, {len(departures)} departures in {time.perf_counter() - t0:.1f}s")
    meta.gtfs_url = source_url

    init_db(settings)
    session_factory = get_session_factory()
    if session_factory is None:
        raise SystemExit("DATABASE_URL is required for GTFS import.")

    async with session_factory() as session:
        repo = TransitRepository(session)
        t1 = time.perf_counter()
        await repo.replace_all_feed_data(stops=stops, departures=departures, meta=meta)
        print(f"Persisted feed in {time.perf_counter() - t1:.1f}s")
        await session.commit()

    return GtfsImportResult(stops=len(stops), departures=len(departures))


def main() -> None:
    print("Downloading and parsing GTFS…")
    result = asyncio.run(run_import())
    print(f"Imported {result.stops} stops, {result.departures} departures.")


if __name__ == "__main__":
    main()
