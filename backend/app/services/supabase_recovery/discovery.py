"""Discover tables/columns in a restored Supabase database or SQL dump."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.services.supabase_recovery.connection import sanitize_identifier, to_asyncpg_url
from app.services.supabase_recovery.sql_dump import DumpTable, parse_sql_dump

PARTNER_TABLE_KEYWORDS: frozenset[str] = frozenset(
    {
        "partner",
        "lead",
        "contact",
        "form",
        "landing",
        "submission",
        "inscription",
        "business",
        "merchant",
        "commerce",
        "prospect",
        "waitlist",
        "signup",
        "register",
    }
)

PARTNER_COLUMN_KEYWORDS: frozenset[str] = frozenset(
    {
        "name",
        "company",
        "business",
        "email",
        "phone",
        "ville",
        "city",
        "instagram",
        "contact",
        "partner",
        "lead",
        "notes",
        "message",
        "category",
        "signed",
        "status",
    }
)


@dataclass
class ColumnInfo:
    name: str
    data_type: str
    nullable: bool


@dataclass
class IndexInfo:
    name: str
    definition: str


@dataclass
class TableDiscovery:
    schema: str
    name: str
    columns: list[ColumnInfo] = field(default_factory=list)
    indexes: list[IndexInfo] = field(default_factory=list)
    row_count: int | None = None
    relevance_score: int = 0
    relevance_reasons: list[str] = field(default_factory=list)

    @property
    def qualified_name(self) -> str:
        return f"{self.schema}.{self.name}"


def score_table_relevance(table_name: str, column_names: list[str]) -> tuple[int, list[str]]:
    score = 0
    reasons: list[str] = []
    lower_name = table_name.lower()
    for keyword in PARTNER_TABLE_KEYWORDS:
        if keyword in lower_name:
            score += 3
            reasons.append(f"nom de table contient '{keyword}'")

    col_hits = sum(
        1
        for col in column_names
        if any(keyword in col.lower() for keyword in PARTNER_COLUMN_KEYWORDS)
    )
    if col_hits:
        score += min(col_hits, 6)
        reasons.append(f"{col_hits} colonne(s) type partenaire/lead")

    return score, reasons


def _from_dump_table(dump: DumpTable) -> TableDiscovery:
    column_names = [c.name for c in dump.columns]
    score, reasons = score_table_relevance(dump.name, column_names)
    return TableDiscovery(
        schema=dump.schema,
        name=dump.name,
        columns=[
            ColumnInfo(name=c.name, data_type=c.data_type, nullable=c.nullable)
            for c in dump.columns
        ],
        row_count=dump.row_count,
        relevance_score=score,
        relevance_reasons=reasons,
    )


async def discover_from_database(database_url: str) -> list[TableDiscovery]:
    engine: AsyncEngine = create_async_engine(
        to_asyncpg_url(database_url),
        pool_pre_ping=True,
    )
    discoveries: list[TableDiscovery] = []
    try:
        async with engine.connect() as conn:
            tables_result = await conn.execute(
                text(
                    """
                    SELECT table_schema, table_name
                    FROM information_schema.tables
                    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
                      AND table_type = 'BASE TABLE'
                    ORDER BY table_schema, table_name
                    """
                )
            )
            for schema_raw, name_raw in tables_result.fetchall():
                schema = str(schema_raw)
                name = str(name_raw)
                cols_result = await conn.execute(
                    text(
                        """
                        SELECT column_name, data_type, is_nullable
                        FROM information_schema.columns
                        WHERE table_schema = :schema AND table_name = :name
                        ORDER BY ordinal_position
                        """
                    ),
                    {"schema": schema, "name": name},
                )
                columns = [
                    ColumnInfo(
                        name=str(row[0]),
                        data_type=str(row[1]),
                        nullable=str(row[2]).upper() == "YES",
                    )
                    for row in cols_result.fetchall()
                ]

                safe_schema = sanitize_identifier(schema)
                safe_name = sanitize_identifier(name)
                count_result = await conn.execute(
                    text(f'SELECT COUNT(*) FROM "{safe_schema}"."{safe_name}"')  # noqa: S608
                )
                row_count = int(count_result.scalar_one())

                idx_result = await conn.execute(
                    text(
                        """
                        SELECT indexname, indexdef
                        FROM pg_indexes
                        WHERE schemaname = :schema AND tablename = :name
                        ORDER BY indexname
                        """
                    ),
                    {"schema": schema, "name": name},
                )
                indexes = [
                    IndexInfo(name=str(row[0]), definition=str(row[1]))
                    for row in idx_result.fetchall()
                ]

                column_names = [c.name for c in columns]
                score, reasons = score_table_relevance(name, column_names)
                discoveries.append(
                    TableDiscovery(
                        schema=schema,
                        name=name,
                        columns=columns,
                        indexes=indexes,
                        row_count=row_count,
                        relevance_score=score,
                        relevance_reasons=reasons,
                    )
                )
    finally:
        await engine.dispose()

    discoveries.sort(key=lambda t: (-t.relevance_score, t.schema, t.name))
    return discoveries


def discover_from_sql_dump(path: Path) -> list[TableDiscovery]:
    dump_tables = parse_sql_dump(path)
    discoveries = [_from_dump_table(table) for table in dump_tables]
    discoveries.sort(key=lambda t: (-t.relevance_score, t.schema, t.name))
    return discoveries


def render_discovery_report(
    discoveries: list[TableDiscovery],
    *,
    source_label: str,
) -> str:
    lines = [
        "# Supabase discovery report",
        "",
        f"**Source:** {source_label}",
        "",
        "## Summary",
        "",
        f"- Tables discovered: **{len(discoveries)}**",
        f"- Partner-relevant (score ≥ 3): "
        f"**{sum(1 for t in discoveries if t.relevance_score >= 3)}**",
        "",
        "## Partner-relevant tables (heuristic)",
        "",
    ]

    relevant = [t for t in discoveries if t.relevance_score >= 3]
    if not relevant:
        lines.append("_Aucune table avec score ≥ 3 — voir inventaire complet._")
        lines.append("")
    else:
        for table in relevant:
            lines.append(f"### `{table.qualified_name}` (score {table.relevance_score})")
            if table.relevance_reasons:
                lines.append("- " + "; ".join(table.relevance_reasons))
            count_label = table.row_count if table.row_count is not None else "unknown"
            lines.append(f"- Row count: {count_label}")
            lines.append("")
            lines.append("| Column | Type | Nullable |")
            lines.append("|--------|------|----------|")
            for col in table.columns:
                lines.append(
                    f"| `{col.name}` | {col.data_type} | {'yes' if col.nullable else 'no'} |"
                )
            if table.indexes:
                lines.append("")
                lines.append("**Indexes:**")
                for idx in table.indexes:
                    lines.append(f"- `{idx.name}`")
            lines.append("")

    lines.extend(
        [
            "## Full table inventory",
            "",
            "| Schema | Table | Rows | Relevance |",
            "|--------|-------|------|-----------|",
        ]
    )
    for table in discoveries:
        rows = table.row_count if table.row_count is not None else "?"
        lines.append(f"| `{table.schema}` | `{table.name}` | {rows} | {table.relevance_score} |")

    lines.append("")
    lines.append(
        "_Généré par `scripts/supabase_discovery.py` — valider le mapping dans "
        "`supabase_partner_mapping.md`._"
    )
    lines.append("")
    return "\n".join(lines)
