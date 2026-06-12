"""Public creator hub — editorial listing & detail (FEATURE-CREATORS-V1 C1-01/C1-02)."""

from __future__ import annotations

import uuid
from typing import Literal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.creator_public_constants import CREATOR_HUB_RELATED_LIMIT
from app.core.errors import AppError
from app.models.partner_creator_content import PartnerCreatorContent
from app.repositories.partner_creator_content_repository import PartnerCreatorContentRepository
from app.schemas.creator_public import (
    CreatorPublicAuthor,
    CreatorPublicContentItem,
    CreatorPublicDetailResponse,
    CreatorPublicListResponse,
)

CreatorPublicContentType = Literal["article", "photo"]


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

    async def get_public_detail(self, content_id: uuid.UUID) -> CreatorPublicDetailResponse:
        content = await self._contents.get_published_public_by_id(content_id)
        if content is None:
            raise AppError(
                404,
                "CREATOR_CONTENT_NOT_FOUND",
                "Contenu créateur introuvable.",
            )
        org = content.organization
        related_rows = await self._contents.list_related_published_for_city(
            city=org.city,
            exclude_id=content.id,
            limit=CREATOR_HUB_RELATED_LIMIT,
        )
        item = self._to_public_item(content)
        return CreatorPublicDetailResponse(
            **item.model_dump(),
            related=[self._to_public_item(row) for row in related_rows],
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
