"""Admin offer moderation audit constants (ADMIN-04E-B1)."""

from __future__ import annotations

from enum import StrEnum

OFFER_ADMIN_ACTIONS: frozenset[str] = frozenset({"approve", "reject", "archive"})

OFFER_ADMIN_APPROVE_REASON = "Offre approuvée et publiée."
OFFER_ADMIN_ARCHIVE_REASON = "Offre archivée."


class OfferAdminAction(StrEnum):
    APPROVE = "approve"
    REJECT = "reject"
    ARCHIVE = "archive"
