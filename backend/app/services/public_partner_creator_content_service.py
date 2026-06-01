"""Public partner creator content — partner pages (WEB-PARTNERS-06B)."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES, PartnerStatus
from app.models.partner_creator_content import PartnerCreatorContent
from app.repositories.partner_creator_content_repository import PartnerCreatorContentRepository
from app.repositories.partner_repository import PartnerRepository
from app.schemas.partner_creator_content_public import (
    PartnerCreatorContentPublicItem,
    PartnerCreatorContentPublicListResponse,
)


class PublicPartnerCreatorContentService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._contents = PartnerCreatorContentRepository(session)
        self._partners = PartnerRepository(session)

    async def list_for_partner_slug(
        self,
        *,
        city: str,
        slug: str,
        limit: int,
        offset: int,
    ) -> PartnerCreatorContentPublicListResponse:
        profile = await self._partners.get_by_slug(city=city.strip(), slug=slug.strip().lower())
        if profile is None:
            raise AppError(404, "PARTNER_NOT_FOUND", "Partenaire introuvable.")
        try:
            status = PartnerStatus(profile.partner_status)
        except ValueError:
            raise AppError(404, "PARTNER_NOT_FOUND", "Partenaire introuvable.") from None
        if status not in PUBLIC_PARTNER_STATUSES:
            raise AppError(404, "PARTNER_NOT_FOUND", "Partenaire introuvable.")

        capped_limit = min(max(limit, 1), 50)
        safe_offset = max(offset, 0)
        rows, total = await self._contents.list_published_for_organization(
            organization_id=profile.organization_id,
            limit=capped_limit,
            offset=safe_offset,
        )
        return PartnerCreatorContentPublicListResponse(
            items=[self._to_public_item(row) for row in rows],
            total=total,
            limit=capped_limit,
            offset=safe_offset,
        )

    def _to_public_item(self, content: PartnerCreatorContent) -> PartnerCreatorContentPublicItem:
        published_at = content.moderated_at or content.updated_at
        return PartnerCreatorContentPublicItem(
            id=content.id,
            title=content.title,
            body=content.body,
            media_url=content.media_url,
            published_at=published_at,
        )
