"""Admin staff management constants (ADMIN-08B)."""

from __future__ import annotations

from enum import StrEnum

from app.db.seeds.auth_rbac import ROLE_DEFINITIONS

STAFF_ADMIN_LIST_PAGE_SIZE_DEFAULT = 20
STAFF_ADMIN_LIST_PAGE_SIZE_MAX = 50

STAFF_ADMIN_ACTION_LIST_PAGE_SIZE_DEFAULT = 20
STAFF_ADMIN_ACTION_LIST_PAGE_SIZE_MAX = 50

STAFF_ADMIN_REASON_MAX_LENGTH = 1000

SYSTEM_ADMIN_PERMISSION = "system.admin"

# Platform staff roles (users listed in GET /admin/staff).
STAFF_PLATFORM_ROLE_KEYS: frozenset[str] = frozenset(
    {
        "MODERATOR",
        "CITY_ADMIN",
        "SUPER_ADMIN",
    }
)

# All assignable seeded role keys (no dynamic roles in V1).
ASSIGNABLE_STAFF_ROLE_KEYS: frozenset[str] = frozenset(ROLE_DEFINITIONS.keys())


class StaffAdminActionType(StrEnum):
    ASSIGN_ROLE = "assign_role"
    REVOKE_ROLE = "revoke_role"
    SUSPEND = "suspend"
    REACTIVATE = "reactivate"
