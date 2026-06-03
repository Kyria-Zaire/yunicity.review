"""Activation wave domain constants (ADMIN-02C)."""

from __future__ import annotations

from enum import StrEnum

REIMS_CITY_DEFAULT = "Reims"

CHECKLIST_V1_KEYS: tuple[str, ...] = (
    "contact_confirmed",
    "assets_received",
    "passport_offer_ready",
    "qr_ready",
    "go_public_ready",
)


class ActivationWaveStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ActivationWaveItemStatus(StrEnum):
    CANDIDATE = "candidate"
    READY = "ready"
    ACTIVATED = "activated"
    LATER = "later"
    ABANDONED = "abandoned"


ACTIVATION_WAVE_STATUSES: frozenset[str] = frozenset(m.value for m in ActivationWaveStatus)
ACTIVATION_WAVE_ITEM_STATUSES: frozenset[str] = frozenset(m.value for m in ActivationWaveItemStatus)


def default_activation_checklist() -> dict[str, bool]:
    """V1 checklist template — all flags false."""
    return dict.fromkeys(CHECKLIST_V1_KEYS, False)
