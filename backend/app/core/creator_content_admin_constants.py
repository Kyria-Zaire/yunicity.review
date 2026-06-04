"""Admin partner creator content moderation audit constants (ADMIN-06D-A)."""

from __future__ import annotations

from enum import StrEnum

CREATOR_CONTENT_ADMIN_ACTION_LIST_PAGE_SIZE_DEFAULT = 20
CREATOR_CONTENT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX = 50

CREATOR_CONTENT_ADMIN_ACTIONS: frozenset[str] = frozenset({"approve", "reject", "archive"})

CREATOR_CONTENT_ADMIN_APPROVE_REASON = "Contenu approuvé et publié."
CREATOR_CONTENT_ADMIN_ARCHIVE_REASON = "Contenu archivé."


class CreatorContentAdminAction(StrEnum):
    APPROVE = "approve"
    REJECT = "reject"
    ARCHIVE = "archive"
