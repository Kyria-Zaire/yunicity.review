"""DATA-CLEANUP-01 — run read-only inventory SQL (no DELETE/UPDATE).

Usage (Railway prod, from backend/):
    npx @railway/cli run -- uv run python scripts/data_cleanup_01_inventory_run.py
"""

from __future__ import annotations

import asyncio
import os
import re
import sys
from pathlib import Path

import asyncpg

SQL_PATH = Path(__file__).with_name("data_cleanup_01_inventory.sql")
SECTION_RE = re.compile(r"^--\s*(\d+)\)\s*(.+)$")


def _asyncpg_dsn(database_url: str) -> str:
    url = database_url.strip()
    for prefix in ("postgresql+asyncpg://", "postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgres://" + url.removeprefix(prefix)
    return url


def _load_sections(path: Path) -> list[tuple[str, str]]:
    sections: list[tuple[str, str]] = []
    current_title: str | None = None
    current_lines: list[str] = []

    for line in path.read_text(encoding="utf-8").splitlines():
        match = SECTION_RE.match(line.strip())
        if match:
            if current_title and current_lines:
                sections.append((current_title, "\n".join(current_lines).strip()))
            current_title = f"{match.group(1)}) {match.group(2)}"
            current_lines = []
            continue
        if current_title is not None and not line.strip().startswith("-- DATA-CLEANUP"):
            current_lines.append(line)

    if current_title and current_lines:
        sections.append((current_title, "\n".join(current_lines).strip()))
    return sections


def _format_rows(columns: list[str], rows: list[asyncpg.Record]) -> None:
    if not rows:
        print("(0 rows)\n")
        return
    widths = [len(c) for c in columns]
    str_rows: list[list[str]] = []
    for row in rows:
        cells = ["" if v is None else str(v) for v in row]
        str_rows.append(cells)
        for i, cell in enumerate(cells):
            widths[i] = max(widths[i], len(cell))

    header = " | ".join(c.ljust(widths[i]) for i, c in enumerate(columns))
    sep = "-+-".join("-" * w for w in widths)
    print(header)
    print(sep)
    for cells in str_rows:
        print(" | ".join(cells[i].ljust(widths[i]) for i, c in enumerate(cells)))
    print(f"\n({len(rows)} rows)\n")


async def _run() -> int:
    database_url = os.environ.get("DATABASE_URL", "").strip()
    if not database_url:
        print("ERROR: DATABASE_URL is not set. Use: npx @railway/cli run -- uv run python ...", file=sys.stderr)
        return 1

    if not SQL_PATH.is_file():
        print(f"ERROR: missing {SQL_PATH}", file=sys.stderr)
        return 1

    sections = _load_sections(SQL_PATH)
    conn = await asyncpg.connect(_asyncpg_dsn(database_url))
    try:
        print("DATA-CLEANUP-01 — Smoke Data Inventory (READ-ONLY)\n")
        for title, sql in sections:
            print(f"=== {title} ===")
            try:
                rows = await conn.fetch(sql)
            except Exception as exc:
                print(f"ERROR: {exc}\n")
                continue
            if rows:
                _format_rows(list(rows[0].keys()), rows)
            else:
                print("(0 rows)\n")
    finally:
        await conn.close()
    return 0


def main() -> None:
    raise SystemExit(asyncio.run(_run()))


if __name__ == "__main__":
    main()
