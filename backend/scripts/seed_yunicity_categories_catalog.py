"""Railway/prod one-shot — 12 official Yunicity categories (FEATURE-PROD-DATA-05 / 05B)."""

from __future__ import annotations

from app.db.seeds.__main__ import main

if __name__ == "__main__":
    import sys

    if "--categories" not in sys.argv:
        sys.argv.append("--categories")
    main()
