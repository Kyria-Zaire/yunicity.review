"""Sync published partner creator content into feed posts (WEB-PARTNERS-06C)."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.feed_constants import PostAuthorType, PostType
from app.core.partner_creator_content_workflow import is_creator_content_published
from app.models.organization import Organization
from app.models.partner_creator_content import PartnerCreatorContent
from app.models.post import Post
from app.repositories.post_repository import PostRepository


class FeedCreatorContentSyncService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._posts = PostRepository(session)

    async def upsert_creator_content_post(
        self,
        content: PartnerCreatorContent,
        organization: Organization,
    ) -> Post:
        existing = await self._posts.get_by_partner_creator_content_id(content.id)
        body = (content.body or content.title).strip()
        is_active = is_creator_content_published(content.status) and content.is_active

        if existing is not None:
            existing.title = content.title
            existing.body = body
            existing.media_url = content.media_url
            existing.city = organization.city
            existing.is_active = is_active
            existing.author_id = organization.id
            existing.author_type = PostAuthorType.ORGANIZATION.value
            existing.type = PostType.PARTNER_CREATOR.value
            await self._session.flush()
            return existing

        post = Post(
            author_type=PostAuthorType.ORGANIZATION.value,
            author_id=organization.id,
            type=PostType.PARTNER_CREATOR.value,
            city=organization.city,
            title=content.title,
            body=body,
            media_url=content.media_url,
            is_active=is_active,
            partner_creator_content_id=content.id,
        )
        return await self._posts.add(post)

    async def deactivate_creator_content_post(self, content_id: uuid.UUID) -> None:
        post = await self._posts.get_by_partner_creator_content_id(content_id)
        if post is None:
            return
        post.is_active = False
        await self._session.flush()
