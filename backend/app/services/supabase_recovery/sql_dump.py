"""Lightweight parser for PostgreSQL plain SQL dumps (discovery only)."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class DumpColumn:
    name: str
    data_type: str
    nullable: bool = True


@dataclass
class DumpTable:
    schema: str
    name: str
    columns: list[DumpColumn] = field(default_factory=list)
    row_count: int | None = None


_CREATE_TABLE_RE = re.compile(
    r"CREATE\s+TABLE\s+(?:(?P<schema>\w+)\.)?(?P<name>\w+)\s*\(",
    re.IGNORECASE,
)
_COLUMN_LINE_RE = re.compile(
    r"^\s*(?P<name>\w+)\s+(?P<type>[\w\[\]()]+)",
    re.IGNORECASE,
)
_RESERVED_COL_PREFIXES = frozenset(
    {"constraint", "primary", "unique", "foreign", "check"},
)


def parse_sql_dump(path: Path) -> list[DumpTable]:
    if not path.is_file():
        raise FileNotFoundError(f"Dump SQL introuvable : {path}")

    text = path.read_text(encoding="utf-8", errors="replace")
    tables: dict[tuple[str, str], DumpTable] = {}
    current: DumpTable | None = None
    in_create = False

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("--"):
            continue

        create_match = _CREATE_TABLE_RE.search(stripped)
        if create_match:
            schema = create_match.group("schema") or "public"
            name = create_match.group("name")
            current = DumpTable(schema=schema, name=name)
            tables[(schema, name)] = current
            in_create = True
            continue

        if in_create and current is not None:
            if stripped.startswith(")"):
                in_create = False
                current = None
                continue
            col_match = _COLUMN_LINE_RE.match(stripped)
            if col_match and col_match.group("name").lower() not in _RESERVED_COL_PREFIXES:
                current.columns.append(
                    DumpColumn(
                        name=col_match.group("name"),
                        data_type=col_match.group("type"),
                        nullable="not null" not in stripped.lower(),
                    )
                )

    return sorted(tables.values(), key=lambda t: (t.schema, t.name))
