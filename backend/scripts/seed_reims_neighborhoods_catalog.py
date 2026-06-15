"""Railway/prod one-shot — 12 official Reims neighborhoods (FEATURE-PROD-DATA-05 / 05A)."""

from __future__ import annotations

from app.db.seeds.__main__ import main

if __name__ == "__main__":
    import sys

    if "--neighborhoods" not in sys.argv:
        sys.argv.append("--neighborhoods")
    main()
