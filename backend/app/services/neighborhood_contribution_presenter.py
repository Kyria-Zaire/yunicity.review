"""Neighborhood contribution presentation helpers (FEATURE-QUARTIERS-V2 / Q2-S3-02)."""

from __future__ import annotations

from app.core.neighborhood_v2_constants import (
    NEIGHBORHOOD_CONTRIBUTION_IDENTITY_API_TYPES,
    NEIGHBORHOOD_CONTRIBUTION_REJECTION_MESSAGES,
    NeighborhoodContributionIdentityType,
    NeighborhoodContributionRejectionCode,
    NeighborhoodContributionStatus,
)
from app.models.neighborhood import Neighborhood
from app.models.neighborhood_editorial import NeighborhoodContribution
from app.schemas.neighborhood import (
    NeighborhoodContributionMeItem,
    NeighborhoodContributionMeNeighborhood,
    NeighborhoodContributionModerationResponse,
)


def rejection_message_for_code(code: str | None) -> str | None:
    if code is None:
        return None
    try:
        parsed = NeighborhoodContributionRejectionCode(code)
    except ValueError:
        return NEIGHBORHOOD_CONTRIBUTION_REJECTION_MESSAGES[
            NeighborhoodContributionRejectionCode.OTHER
        ]
    return NEIGHBORHOOD_CONTRIBUTION_REJECTION_MESSAGES[parsed]


def api_identity_type(storage_type: str) -> str:
    mapped = NEIGHBORHOOD_CONTRIBUTION_IDENTITY_API_TYPES.get(storage_type)
    if mapped is None:
        return NeighborhoodContributionIdentityType.PSEUDO.value
    return mapped.value


def to_me_neighborhood(neighborhood: Neighborhood) -> NeighborhoodContributionMeNeighborhood:
    return NeighborhoodContributionMeNeighborhood(
        id=neighborhood.id,
        slug=neighborhood.slug,
        display_name=neighborhood.display_name,
    )


def to_me_item(contribution: NeighborhoodContribution) -> NeighborhoodContributionMeItem:
    neighborhood = contribution.neighborhood
    if neighborhood is None:
        raise ValueError("Neighborhood must be loaded for contribution me item")
    return NeighborhoodContributionMeItem(
        id=contribution.id,
        neighborhood=to_me_neighborhood(neighborhood),
        title=contribution.title,
        body=contribution.body,
        status=contribution.status,
        submitted_at=contribution.submitted_at,
        approved_at=contribution.approved_at,
        reviewed_at=contribution.reviewed_at,
        display_identity_label=contribution.display_identity_label,
        display_identity_type=api_identity_type(contribution.display_identity_type),
        passport_verified_snapshot=contribution.passport_verified_snapshot,
        rejection_reason_code=contribution.rejection_reason_code,
        rejection_message=rejection_message_for_code(contribution.rejection_reason_code),
    )


def to_moderation_response(
    contribution: NeighborhoodContribution,
) -> NeighborhoodContributionModerationResponse:
    return NeighborhoodContributionModerationResponse(
        id=contribution.id,
        status=contribution.status,
        approved_at=contribution.approved_at,
        reviewed_at=contribution.reviewed_at,
        reviewed_by_user_id=contribution.reviewed_by,
        rejection_reason_code=contribution.rejection_reason_code,
        rejection_note=contribution.rejection_note,
    )


def is_reviewed_status(status: str) -> bool:
    return status in {
        NeighborhoodContributionStatus.APPROVED.value,
        NeighborhoodContributionStatus.REJECTED.value,
    }
