"""Public creator hub — editorial listing (FEATURE-CREATORS-V1 C1-01)."""

from __future__ import annotations

from typing import Literal

from sqlalchemy.ext.asyncio import AsyncSession

CreatorPublicContentType = Literal["article", "photo"]
from app.models.partner_creator_content import PartnerCreatorContent
from app.repositories.partner_creator_content_repository import PartnerCreatorContentRepository
from app.schemas.creator_public import (
    CreatorPublicAuthor,
    CreatorPublicContentItem,
    CreatorPublicListResponse,
)


def resolve_public_content_type(
    *,
    body: str | None,
    media_url: str | None,
) -> CreatorPublicContentType:
    has_media = bool((media_url or "").strip())
    has_body = bool((body or "").strip())
    if has_media and not has_body:
        return "photo"
    return "article"


class PublicCreatorHubService:
    def __init__(self, session: AsyncSession) -> None:
        self._contents = PartnerCreatorContentRepository(session)

    async def list_for_city(
        self,
        *,
        city: str,
        limit: int,
        offset: int,
    ) -> CreatorPublicListResponse:
        capped_limit = min(max(limit, 1), 50)
        safe_offset = max(offset, 0)
        rows, total = await self._contents.list_published_for_city(
            city=city,
            limit=capped_limit,
            offset=safe_offset,
        )
        return CreatorPublicListResponse(
            items=[self._to_public_item(row) for row in rows],
            total=total,
            limit=capped_limit,
            offset=safe_offset,
        )

    def _to_public_item(self, content: PartnerCreatorContent) -> CreatorPublicContentItem:
        org = content.organization
        published_at = content.moderated_at or content.updated_at
        return CreatorPublicContentItem(
            id=content.id,
            title=content.title,
            cover=content.media_url,
            content_type=resolve_public_content_type(
                body=content.body,
                media_url=content.media_url,
            ),
            city=org.city,
            published_at=published_at,
            body=content.body,
            author=CreatorPublicAuthor(
                kind="partner",
                organization_id=org.id,
                display_name=org.name,
                slug=org.slug,
            ),
        )
