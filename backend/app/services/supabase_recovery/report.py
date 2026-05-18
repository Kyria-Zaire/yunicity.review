"""Markdown report generation for Supabase partner import."""

from __future__ import annotations

from datetime import UTC, datetime

from app.services.supabase_recovery.import_service import SupabasePartnerImportSummary


def render_import_report(
    summary: SupabasePartnerImportSummary,
    *,
    mode: str,
) -> str:
    now = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        "# Supabase partner import report",
        "",
        f"**Generated:** {now}",
        f"**Mode:** {mode}",
        f"**Source table:** `{summary.source_table}`",
        "",
        "## Summary",
        "",
        "| Metric | Count |",
        "|--------|------:|",
        f"| Total scanned | {summary.total_scanned} |",
        f"| Imported (or would import) | {summary.imported} |",
        f"| Duplicates skipped | {summary.skipped_duplicates} |",
        f"| Invalid | {summary.invalid} |",
        f"| Suspicious | {summary.suspicious} |",
        "",
        "## Missing / suspicious fields",
        "",
    ]

    if summary.missing_fields_summary:
        lines.append("| Flag | Count |")
        lines.append("|------|------:|")
        for flag, count in sorted(summary.missing_fields_summary.items()):
            lines.append(f"| `{flag}` | {count} |")
    else:
        lines.append("_None._")

    lines.extend(["", "## Duplicate skips (sample)", ""])
    if summary.duplicate_rows:
        for row in summary.duplicate_rows[:20]:
            lines.append(f"- Row {row.row_index} `{row.name or '?'}` — **{row.reason}**")
    else:
        lines.append("_None._")

    lines.extend(["", "## Invalid rows (sample)", ""])
    if summary.invalid_rows:
        for row in summary.invalid_rows[:20]:
            detail = ", ".join(row.details) if row.details else "—"
            lines.append(f"- Row {row.row_index} `{row.name or '?'}` — **{row.reason}** ({detail})")
    else:
        lines.append("_None._")

    lines.extend(["", "## Suspicious rows (sample)", ""])
    if summary.suspicious_rows:
        for row in summary.suspicious_rows[:20]:
            detail = ", ".join(row.details) if row.details else "—"
            lines.append(f"- Row {row.row_index} `{row.name}` — {detail}")
    else:
        lines.append("_None._")

    lines.extend(
        [
            "",
            "## Notes",
            "",
            "- `source` forcé à `landing_page`.",
            "- Aucune organization créée ni vérifiée.",
            "- Les doublons existants ne sont jamais écrasés.",
            "- Relancer en `--dry-run` avant tout `--apply`.",
            "",
        ]
    )
    return "\n".join(lines)
