"""Partner offer status transitions — moderated self-service (TICKET-305A)."""

from __future__ import annotations

from app.core.errors import AppError
from app.core.passport_constants import PartnerOfferStatus

ALLOWED_OFFER_TRANSITIONS: dict[PartnerOfferStatus, frozenset[PartnerOfferStatus]] = {
    PartnerOfferStatus.DRAFT: frozenset({PartnerOfferStatus.PENDING_REVIEW}),
    PartnerOfferStatus.PENDING_REVIEW: frozenset(
        {PartnerOfferStatus.PUBLISHED, PartnerOfferStatus.REJECTED}
    ),
    PartnerOfferStatus.REJECTED: frozenset({PartnerOfferStatus.DRAFT}),
    PartnerOfferStatus.PUBLISHED: frozenset({PartnerOfferStatus.ARCHIVED}),
    PartnerOfferStatus.ARCHIVED: frozenset(),
}

PARTNER_EDITABLE_STATUSES: frozenset[PartnerOfferStatus] = frozenset(
    {PartnerOfferStatus.DRAFT, PartnerOfferStatus.REJECTED}
)


def normalize_offer_status(value: PartnerOfferStatus | str) -> PartnerOfferStatus:
    if isinstance(value, PartnerOfferStatus):
        return value
    return PartnerOfferStatus(value)


def is_offer_active(status: PartnerOfferStatus) -> bool:
    return status == PartnerOfferStatus.PUBLISHED


def assert_transition_allowed(
    current: PartnerOfferStatus | str,
    target: PartnerOfferStatus | str,
) -> None:
    current_status = normalize_offer_status(current)
    target_status = normalize_offer_status(target)
    allowed = ALLOWED_OFFER_TRANSITIONS.get(current_status, frozenset())
    if target_status not in allowed:
        raise AppError(
            status_code=422,
            code="INVALID_OFFER_TRANSITION",
            detail=f"Transition interdite : {current_status.value} → {target_status.value}.",
        )


def assert_partner_can_edit(status: PartnerOfferStatus | str) -> None:
    current = normalize_offer_status(status)
    if current not in PARTNER_EDITABLE_STATUSES:
        raise AppError(
            status_code=422,
            code="OFFER_NOT_EDITABLE",
            detail="Seules les offres en brouillon ou rejetées peuvent être modifiées.",
        )
