"""Public creator profile (FEATURE-CREATORS-V1 C1-03)."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.creator_public_constants import CREATOR_PROFILE_CONTENTS_LIMIT_MAX
from app.core.errors import AppError
from app.models.organization import Organization
from app.repositories.partner_creator_content_repository import PartnerCreatorContentRepository
from app.repositories.public_creator_repository import PublicCreatorRepository
from app.schemas.creator_public import (
    CreatorPublicProfileResponse,
    CreatorPublicProfileStats,
    CreatorPublicTerritory,
)
from app.services.public_creator_hub_service import PublicCreatorHubService


class PublicCreatorProfileService:
    def __init__(self, session: AsyncSession) -> None:
        self._creators = PublicCreatorRepository(session)
        self._contents = PartnerCreatorContentRepository(session)
        self._hub = PublicCreatorHubService(session)

    async def get_public_profile(
        self,
        creator_id: uuid.UUID,
        *,
        limit: int,
        offset: int,
    ) -> CreatorPublicProfileResponse:
        organization = await self._creators.get_public_creator_organization(creator_id)
        if organization is None:
            raise AppError(
                404,
                "CREATOR_NOT_FOUND",
                "Créateur introuvable.",
            )

        capped_limit = min(max(limit, 1), CREATOR_PROFILE_CONTENTS_LIMIT_MAX)
        safe_offset = max(offset, 0)
        rows, total = await self._contents.list_published_public_for_creator(
            organization.id,
            limit=capped_limit,
            offset=safe_offset,
        )

        return CreatorPublicProfileResponse(
            id=organization.id,
            kind="partner",
            display_name=_resolve_display_name(organization),
            slug=organization.slug,
            description=organization.description,
            logo_url=organization.logo_url,
            banner_url=organization.banner_url,
            territory=CreatorPublicTerritory(
                city=organization.city,
                neighborhood_name=_resolve_neighborhood_name(organization),
            ),
            stats=CreatorPublicProfileStats(published_content_count=total),
            contents=[self._hub._to_public_item(row) for row in rows],
            contents_total=total,
            contents_limit=capped_limit,
            contents_offset=safe_offset,
        )


def _resolve_display_name(organization: Organization) -> str:
    profile = organization.partner_profile
    if profile is not None:
        label = (profile.public_partner_label or "").strip()
        if label:
            return label
    return organization.name.strip()


def _resolve_neighborhood_name(organization: Organization) -> str | None:
    neighborhood = organization.neighborhood
    if neighborhood is None:
        return None
    name = neighborhood.display_name.strip()
    return name or None
