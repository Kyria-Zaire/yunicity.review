"""Railway/prod one-shot — signed Reims partners catalog (FEATURE-PROD-DATA-05 / 05D)."""

from __future__ import annotations

from app.db.seeds.__main__ import main

if __name__ == "__main__":
    import sys

    if "--partners" not in sys.argv:
        sys.argv.append("--partners")
    main()
