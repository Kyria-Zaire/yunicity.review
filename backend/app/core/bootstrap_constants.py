"""Bootstrap admin constants (PLATFORM-AUTH-RECOVERY-01)."""

from __future__ import annotations

# Dev/recette fallback only — override via env in all environments for real accounts.
DEV_BOOTSTRAP_ADMIN_EMAIL = "admin@yunicity.dev"
DEV_BOOTSTRAP_ADMIN_PASSWORD = "ChangeMeBootstrap1!Dev"
DEV_BOOTSTRAP_ADMIN_FULL_NAME = "Yunicity Bootstrap Admin"

SYSTEM_ACCOUNT_PROTECTED_MSG = (
    "System account cannot be suspended or deleted."
)

BOOTSTRAP_SUPER_ADMIN_ROLE = "SUPER_ADMIN"
BOOTSTRAP_CITY_ADMIN_ROLE = "CITY_ADMIN"
BOOTSTRAP_STAFF_ROLE = "MODERATOR"

PROD_BOOTSTRAP_ADMIN_EMAIL = "admin@yunicity.city"
PROD_BOOTSTRAP_STAFF_EMAIL = "staff@yunicity.city"

BOOTSTRAP_ACCOUNT_SUPER_ADMIN = "SUPER_ADMIN"
BOOTSTRAP_ACCOUNT_ADMIN = "ADMIN"
BOOTSTRAP_ACCOUNT_STAFF = "STAFF"
