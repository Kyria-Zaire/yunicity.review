"""Public creator directory (FEATURE-CREATORS-V1 C1-04)."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.creator_public_constants import (
    CREATOR_DIRECTORY_LIST_LIMIT_MAX,
    CREATOR_DIRECTORY_SEARCH_MAX_LENGTH,
)
from app.core.partner_constants import PartnershipType, PartnerStatus
from app.models.organization import Organization
from app.repositories.public_creator_repository import PublicCreatorRepository
from app.schemas.creator_public import (
    CreatorPublicDirectoryItem,
    CreatorPublicDirectoryListResponse,
    CreatorPublicTerritory,
)
from app.services.public_creator_profile_service import (
    _resolve_display_name,
    _resolve_neighborhood_name,
)


class PublicCreatorDirectoryService:
    def __init__(self, session: AsyncSession) -> None:
        self._creators = PublicCreatorRepository(session)

    async def list_public_creators(
        self,
        *,
        city: str,
        query: str | None,
        limit: int,
        offset: int,
    ) -> CreatorPublicDirectoryListResponse:
        trimmed_city = city.strip() or "Reims"
        capped_limit = min(max(limit, 1), CREATOR_DIRECTORY_LIST_LIMIT_MAX)
        safe_offset = max(offset, 0)
        normalized_query = self._normalize_query(query)
        rows, total = await self._creators.list_public_creators_with_published_content(
            city=trimmed_city,
            query=normalized_query,
            limit=capped_limit,
            offset=safe_offset,
        )
        return CreatorPublicDirectoryListResponse(
            city=trimmed_city,
            items=[self._to_directory_item(org, count) for org, count in rows],
            total=total,
            limit=capped_limit,
            offset=safe_offset,
        )

    @staticmethod
    def _normalize_query(query: str | None) -> str | None:
        normalized = (query or "").strip()
        if not normalized:
            return None
        return normalized[:CREATOR_DIRECTORY_SEARCH_MAX_LENGTH]

    def _to_directory_item(
        self,
        organization: Organization,
        published_content_count: int,
    ) -> CreatorPublicDirectoryItem:
        profile = organization.partner_profile
        partnership_type: PartnershipType | None = None
        partner_status: PartnerStatus | None = None
        if profile is not None:
            if profile.partnership_type:
                partnership_type = (
                    profile.partnership_type
                    if isinstance(profile.partnership_type, PartnershipType)
                    else PartnershipType(profile.partnership_type)
                )
            if profile.partner_status:
                partner_status = (
                    profile.partner_status
                    if isinstance(profile.partner_status, PartnerStatus)
                    else PartnerStatus(profile.partner_status)
                )
        return CreatorPublicDirectoryItem(
            id=organization.id,
            kind="partner",
            display_name=_resolve_display_name(organization),
            slug=organization.slug,
            description=organization.description,
            logo_url=organization.logo_url,
            territory=CreatorPublicTerritory(
                city=organization.city,
                neighborhood_name=_resolve_neighborhood_name(organization),
            ),
            partnership_type=partnership_type,
            partner_status=partner_status,
            published_content_count=published_content_count,
        )
