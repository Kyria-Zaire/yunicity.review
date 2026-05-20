"""Local event moderation transitions (TICKET-505)."""

from __future__ import annotations

from app.core.errors import AppError
from app.core.local_event_constants import LocalEventModerationStatus

EventStatusSet = frozenset[LocalEventModerationStatus]
ALLOWED_EVENT_TRANSITIONS: dict[LocalEventModerationStatus, EventStatusSet] = {
    LocalEventModerationStatus.PENDING_REVIEW: frozenset(
        {
            LocalEventModerationStatus.APPROVED,
            LocalEventModerationStatus.REJECTED,
        }
    ),
    LocalEventModerationStatus.APPROVED: frozenset({LocalEventModerationStatus.REJECTED}),
    LocalEventModerationStatus.REJECTED: frozenset({LocalEventModerationStatus.PENDING_REVIEW}),
}


def assert_event_transition_allowed(
    current: str | LocalEventModerationStatus,
    target: LocalEventModerationStatus,
) -> None:
    if isinstance(current, LocalEventModerationStatus):
        current_status = current
    else:
        current_status = LocalEventModerationStatus(current)
    allowed = ALLOWED_EVENT_TRANSITIONS.get(current_status, frozenset())
    if target not in allowed:
        raise AppError(
            status_code=409,
            code="EVENT_STATUS_TRANSITION_FORBIDDEN",
            detail="Transition de statut événement non autorisée.",
        )
