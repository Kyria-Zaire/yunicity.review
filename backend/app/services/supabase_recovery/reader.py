"""Read rows from a restored Supabase PostgreSQL database."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.services.supabase_recovery.connection import sanitize_identifier, to_asyncpg_url


async def fetch_table_rows(
    database_url: str,
    *,
    schema: str,
    table: str,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    safe_schema = sanitize_identifier(schema)
    safe_table = sanitize_identifier(table)
    engine: AsyncEngine = create_async_engine(
        to_asyncpg_url(database_url),
        pool_pre_ping=True,
    )
    query = f'SELECT * FROM "{safe_schema}"."{safe_table}"'  # noqa: S608
    if limit is not None:
        query += f" LIMIT {int(limit)}"

    rows: list[dict[str, Any]] = []
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text(query))
            columns = list(result.keys())
            for record in result.fetchall():
                rows.append({col: record[idx] for idx, col in enumerate(columns)})
    finally:
        await engine.dispose()
    return rows


def pick_default_source_table(discoveries: list[Any]) -> str | None:
    """Pick highest-scoring public table name from discovery results."""
    relevant = [d for d in discoveries if getattr(d, "relevance_score", 0) >= 3]
    if not relevant:
        return None
    best = relevant[0]
    return str(best.name)
