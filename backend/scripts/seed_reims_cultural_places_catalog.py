"""Railway/prod one-shot — 12 official Reims cultural places (FEATURE-PROD-DATA-05 / 05C)."""

from __future__ import annotations

from app.db.seeds.__main__ import main

if __name__ == "__main__":
    import sys

    if "--cultural-places" not in sys.argv:
        sys.argv.append("--cultural-places")
    main()
