"""Admin partner action audit constants (ADMIN-02D3A)."""

from __future__ import annotations

from enum import StrEnum

from app.core.partner_constants import PartnerStatus

PARTNER_ADMIN_ACTIONS: frozenset[str] = frozenset(
    {
        "create_profile",
        "activate",
        "pause",
        "upgrade_premium",
        "update_settings",
    }
)

FEATURED_ELIGIBLE_PARTNER_STATUSES: frozenset[PartnerStatus] = frozenset(
    {
        PartnerStatus.ACTIVE,
        PartnerStatus.PREMIUM,
        PartnerStatus.FOUNDING_PARTNER,
    }
)


class PartnerAdminAction(StrEnum):
    CREATE_PROFILE = "create_profile"
    ACTIVATE = "activate"
    PAUSE = "pause"
    UPGRADE_PREMIUM = "upgrade_premium"
    UPDATE_SETTINGS = "update_settings"
