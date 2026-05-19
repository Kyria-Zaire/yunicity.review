"""Sync partner offers into feed posts (TICKET-402)."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.feed_constants import PostAuthorType, PostType
from app.core.passport_constants import PartnerOfferStatus
from app.models.organization import Organization
from app.models.passport import PartnerOffer
from app.models.post import Post
from app.repositories.post_repository import PostRepository


class FeedOfferSyncService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._posts = PostRepository(session)

    async def upsert_offer_post(self, offer: PartnerOffer, organization: Organization) -> Post:
        existing = await self._posts.get_by_partner_offer_id(offer.id)
        body = (offer.description or offer.title).strip()
        if existing is not None:
            existing.title = offer.title
            existing.body = body
            existing.city = organization.city
            existing.is_active = (
                offer.status == PartnerOfferStatus.PUBLISHED.value and offer.is_active
            )
            existing.author_id = organization.id
            existing.author_type = PostAuthorType.ORGANIZATION.value
            await self._session.flush()
            return existing

        post = Post(
            author_type=PostAuthorType.ORGANIZATION.value,
            author_id=organization.id,
            type=PostType.OFFER.value,
            city=organization.city,
            title=offer.title,
            body=body,
            is_active=True,
            partner_offer_id=offer.id,
        )
        return await self._posts.add(post)

    async def deactivate_offer_post(self, offer_id: uuid.UUID) -> None:
        post = await self._posts.get_by_partner_offer_id(offer_id)
        if post is None:
            return
        post.is_active = False
        await self._session.flush()
