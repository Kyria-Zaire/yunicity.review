"""Citizen feed listing (TICKET-402)."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.feed_constants import FEED_PAGE_SIZE_MAX
from app.core.feed_cursor import decode_feed_cursor, encode_feed_cursor
from app.models.user import User
from app.repositories.like_repository import LikeRepository
from app.repositories.local_event_repository import LocalEventRepository
from app.repositories.post_repository import PostRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.feed import FeedListResponse
from app.services.feed_author_resolver import FeedAuthorResolver
from app.services.feed_post_mapper import city_priority_for_post, to_feed_item


class FeedService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._posts = PostRepository(session)
        self._likes = LikeRepository(session)
        self._local_events = LocalEventRepository(session)
        self._profiles = ProfileRepository(session)
        self._authors = FeedAuthorResolver(session)

    async def list_feed(
        self,
        viewer: User,
        *,
        cursor: str | None,
        limit: int,
    ) -> FeedListResponse:
        limit = min(limit, FEED_PAGE_SIZE_MAX)
        profile = await self._profiles.get_by_user_id(viewer.id)
        user_city = profile.city if profile and profile.city else viewer.city

        cursor_priority = None
        cursor_created_at = None
        cursor_id = None
        if cursor:
            cursor_priority, cursor_created_at, cursor_id = decode_feed_cursor(cursor)

        rows = await self._posts.list_feed(
            user_city=user_city,
            limit=limit,
            cursor_priority=cursor_priority,
            cursor_created_at=cursor_created_at,
            cursor_id=cursor_id,
        )
        has_more = len(rows) > limit
        page = rows[:limit]

        liked_ids = await self._likes.list_liked_post_ids(
            viewer.id,
            [post.id for post in page],
        )
        event_ids = [post.local_event_id for post in page if post.local_event_id is not None]
        interested_event_ids = (
            await self._local_events.interest_event_ids_for_user(viewer.id, event_ids)
            if event_ids
            else set()
        )
        author_map = await self._authors.resolve_posts(page)

        items = []
        for post in page:
            author = author_map.get(post.author_id)
            if author is None:
                author = await self._authors.resolve_user(post.author_id)
            items.append(
                to_feed_item(
                    post,
                    author=author,
                    liked_by_me=post.id in liked_ids,
                    interested_event_ids=interested_event_ids,
                )
            )

        next_cursor = None
        if has_more and page:
            last = page[-1]
            priority = city_priority_for_post(last, user_city)
            next_cursor = encode_feed_cursor(priority, last.created_at, last.id)

        return FeedListResponse(items=items, next_cursor=next_cursor)
