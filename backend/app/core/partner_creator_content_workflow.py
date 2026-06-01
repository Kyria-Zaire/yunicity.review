"""Partner creator content status transitions (WEB-PARTNERS-06A)."""

from __future__ import annotations

from app.core.errors import AppError
from app.core.partner_creator_content_constants import PartnerCreatorContentStatus

ALLOWED_CREATOR_CONTENT_TRANSITIONS: dict[
    PartnerCreatorContentStatus, frozenset[PartnerCreatorContentStatus]
] = {
    PartnerCreatorContentStatus.DRAFT: frozenset({PartnerCreatorContentStatus.PENDING_REVIEW}),
    PartnerCreatorContentStatus.PENDING_REVIEW: frozenset(
        {
            PartnerCreatorContentStatus.PUBLISHED,
            PartnerCreatorContentStatus.REJECTED,
        }
    ),
    PartnerCreatorContentStatus.REJECTED: frozenset({PartnerCreatorContentStatus.DRAFT}),
    PartnerCreatorContentStatus.PUBLISHED: frozenset({PartnerCreatorContentStatus.ARCHIVED}),
    PartnerCreatorContentStatus.ARCHIVED: frozenset(),
}

PARTNER_EDITABLE_CREATOR_CONTENT_STATUSES: frozenset[PartnerCreatorContentStatus] = frozenset(
    {PartnerCreatorContentStatus.DRAFT, PartnerCreatorContentStatus.REJECTED}
)


def normalize_creator_content_status(
    value: PartnerCreatorContentStatus | str,
) -> PartnerCreatorContentStatus:
    if isinstance(value, PartnerCreatorContentStatus):
        return value
    return PartnerCreatorContentStatus(value)


def is_creator_content_published(status: PartnerCreatorContentStatus | str) -> bool:
    return normalize_creator_content_status(status) == PartnerCreatorContentStatus.PUBLISHED


def assert_creator_content_transition_allowed(
    current: PartnerCreatorContentStatus | str,
    target: PartnerCreatorContentStatus | str,
) -> None:
    current_status = normalize_creator_content_status(current)
    target_status = normalize_creator_content_status(target)
    allowed = ALLOWED_CREATOR_CONTENT_TRANSITIONS.get(current_status, frozenset())
    if target_status not in allowed:
        raise AppError(
            status_code=422,
            code="INVALID_CREATOR_CONTENT_TRANSITION",
            detail=f"Transition interdite : {current_status.value} → {target_status.value}.",
        )


def assert_partner_can_edit_creator_content(status: PartnerCreatorContentStatus | str) -> None:
    current = normalize_creator_content_status(status)
    if current not in PARTNER_EDITABLE_CREATOR_CONTENT_STATUSES:
        raise AppError(
            status_code=422,
            code="CREATOR_CONTENT_NOT_EDITABLE",
            detail="Seuls les contenus en brouillon ou rejetés peuvent être modifiés.",
        )
