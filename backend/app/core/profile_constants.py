"""Profile domain constants — interests whitelist, limits."""

from __future__ import annotations

BIO_MAX_LENGTH = 500
INTERESTS_MAX_COUNT = 10
ONBOARDING_STEP_DONE = "done"

ALLOWED_INTERESTS: frozenset[str] = frozenset(
    {
        "food",
        "sports",
        "tech",
        "nightlife",
        "business",
        "gaming",
        "culture",
        "fitness",
        "music",
        "art",
        "entrepreneurship",
    }
)
