"""Public profile publications (citizen posts visible on /profile/{username})."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.profile_username import is_valid_username_format, normalize_username
from app.models.user import User
from app.repositories.like_repository import LikeRepository
from app.repositories.local_event_repository import LocalEventRepository
from app.repositories.post_repository import PostRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.feed import FeedListResponse
from app.services.feed_author_resolver import FeedAuthorResolver
from app.services.feed_post_mapper import to_feed_item
from app.services.profile_service import ProfileService

_PUBLIC_POSTS_LIMIT_DEFAULT = 12
_PUBLIC_POSTS_LIMIT_MAX = 24


class ProfilePublicFeedService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._profiles = ProfileRepository(session)
        self._posts = PostRepository(session)
        self._likes = LikeRepository(session)
        self._local_events = LocalEventRepository(session)
        self._authors = FeedAuthorResolver(session)
        self._profile_service = ProfileService(session)

    async def list_public_posts_by_username(
        self,
        username: str,
        *,
        viewer: User | None,
        limit: int = _PUBLIC_POSTS_LIMIT_DEFAULT,
    ) -> FeedListResponse:
        normalized = normalize_username(username)
        if not is_valid_username_format(normalized):
            raise AppError(
                status_code=404,
                code="PROFILE_NOT_FOUND",
                detail="Profil introuvable.",
            )
        profile = await self._profiles.get_by_username(normalized)
        if profile is None:
            raise AppError(
                status_code=404,
                code="PROFILE_NOT_FOUND",
                detail="Profil introuvable.",
            )
        if not self._profile_service.can_view_profile(profile, viewer=viewer):
            raise AppError(
                status_code=404,
                code="PROFILE_NOT_FOUND",
                detail="Profil introuvable.",
            )
        return await self._list_for_user(profile.user_id, viewer=viewer, limit=limit)

    async def list_public_posts_by_user_id(
        self,
        user_id: uuid.UUID,
        *,
        viewer: User | None,
        limit: int = _PUBLIC_POSTS_LIMIT_DEFAULT,
    ) -> FeedListResponse:
        profile = await self._profiles.get_by_user_id(user_id)
        if profile is None:
            raise AppError(
                status_code=404,
                code="PROFILE_NOT_FOUND",
                detail="Profil introuvable.",
            )
        if not self._profile_service.can_view_profile(profile, viewer=viewer):
            raise AppError(
                status_code=404,
                code="PROFILE_NOT_FOUND",
                detail="Profil introuvable.",
            )
        return await self._list_for_user(user_id, viewer=viewer, limit=limit)

    async def _list_for_user(
        self,
        user_id: uuid.UUID,
        *,
        viewer: User | None,
        limit: int,
    ) -> FeedListResponse:
        capped = max(1, min(limit, _PUBLIC_POSTS_LIMIT_MAX))
        rows = await self._posts.list_public_posts_by_user(user_id, limit=capped)
        if not rows:
            return FeedListResponse(items=[], next_cursor=None)

        viewer_id = viewer.id if viewer is not None else None
        liked_ids = (
            await self._likes.list_liked_post_ids(viewer_id, [post.id for post in rows])
            if viewer_id is not None
            else set()
        )
        event_ids = [post.local_event_id for post in rows if post.local_event_id is not None]
        interested_event_ids = (
            await self._local_events.interest_event_ids_for_user(viewer_id, event_ids)
            if viewer_id is not None and event_ids
            else set()
        )
        author_map = await self._authors.resolve_posts(rows)

        items = []
        for post in rows:
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

        return FeedListResponse(items=items, next_cursor=None)
