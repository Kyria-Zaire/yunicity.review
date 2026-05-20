"""Sync approved local events into feed posts (TICKET-505)."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.feed_constants import PostAuthorType, PostType
from app.core.local_event_constants import LocalEventModerationStatus
from app.models.local_event import LocalEvent
from app.models.organization import Organization
from app.models.post import Post
from app.repositories.post_repository import PostRepository


class FeedEventSyncService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._posts = PostRepository(session)

    async def upsert_event_post(self, event: LocalEvent, organization: Organization | None) -> Post:
        existing = await self._posts.get_by_local_event_id(event.id)
        body = (event.description or event.title).strip()
        author_id = organization.id if organization else event.created_by_user_id
        author_type = (
            PostAuthorType.ORGANIZATION.value if organization else PostAuthorType.CITIZEN.value
        )
        media = event.cover_image_url
        lat = float(event.latitude) if event.latitude is not None else None
        lng = float(event.longitude) if event.longitude is not None else None
        is_active = (
            event.moderation_status == LocalEventModerationStatus.APPROVED.value
            and not event.is_cancelled
        )

        if existing is not None:
            existing.title = event.title
            existing.body = body
            existing.city = event.city
            existing.media_url = media
            existing.is_active = is_active
            existing.author_id = author_id
            existing.author_type = author_type
            if lat is not None and lng is not None:
                existing.set_location(lat, lng)
            await self._session.flush()
            return existing

        post = Post(
            author_type=author_type,
            author_id=author_id,
            type=PostType.EVENT.value,
            city=event.city,
            title=event.title,
            body=body,
            media_url=media,
            is_active=is_active,
            local_event_id=event.id,
        )
        if lat is not None and lng is not None:
            post.set_location(lat, lng)
        return await self._posts.add(post)

    async def deactivate_event_post(self, event_id: uuid.UUID) -> None:
        post = await self._posts.get_by_local_event_id(event_id)
        if post is None:
            return
        post.is_active = False
        await self._session.flush()
