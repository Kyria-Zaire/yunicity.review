#!/usr/bin/env python3
"""Gate osv-scanner JSON output on High/Critical severity only.

Replaces the retired `pnpm audit --audit-level=high` (npm retired the legacy audit
endpoint → HTTP 410). osv-scanner queries the OSV.dev database instead (no npm
endpoint dependency) and is genuinely functional: it flags real vulnerabilities.

We deliberately preserve the previous policy — fail ONLY on High/Critical
(CVSS >= 7.0). Medium/Low findings are printed for visibility but do not fail CI,
exactly as `--audit-level=high` behaved. Per-advisory, time-boxed exceptions live
in frontend/osv-scanner.toml (never a blanket bypass).

Usage: python osv_gate_high.py <osv-scanner-json-file>
Exit 0 = no High/Critical; exit 1 = at least one High/Critical.
"""

from __future__ import annotations

import json
import sys

HIGH_THRESHOLD = 7.0


def main(path: str) -> int:
    with open(path, encoding="utf-8") as handle:
        report = json.load(handle)

    high: list[str] = []
    tolerated: list[str] = []
    for result in report.get("results", []):
        for package in result.get("packages", []):
            name = package.get("package", {}).get("name", "?")
            version = package.get("package", {}).get("version", "?")
            for group in package.get("groups", []):
                ids = ",".join(group.get("ids", []))
                raw = group.get("max_severity") or ""
                try:
                    score = float(raw)
                except ValueError:
                    score = 0.0
                line = f"{name}@{version} [{ids}] CVSS={raw or 'n/a'}"
                (high if score >= HIGH_THRESHOLD else tolerated).append(line)

    if tolerated:
        print(f"Tolerated (< {HIGH_THRESHOLD}, reported only):")
        for line in tolerated:
            print(f"  - {line}")

    if high:
        print(f"::error::{len(high)} High/Critical vulnerability(ies) (CVSS >= {HIGH_THRESHOLD}):")
        for line in high:
            print(f"  - {line}")
        return 1

    print(f"OK: no High/Critical vulnerability (CVSS >= {HIGH_THRESHOLD}).")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: osv_gate_high.py <osv-json>", file=sys.stderr)
        raise SystemExit(2)
    raise SystemExit(main(sys.argv[1]))
