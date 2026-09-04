"""Post persistence (TICKET-402)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql.elements import ColumnElement

from app.core.feed_constants import PostAuthorType, PostType
from app.models.local_event import LocalEvent
from app.models.passport import PartnerOffer
from app.models.post import Post
from app.repositories.post_visibility import visible_posts_filter


class PostRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, post_id: uuid.UUID, *, active_only: bool = False) -> Post | None:
        stmt = (
            select(Post)
            .where(Post.id == post_id)
            .options(
                selectinload(Post.partner_offer).selectinload(PartnerOffer.neighborhood),
                selectinload(Post.partner_creator_content),
                selectinload(Post.local_event).selectinload(LocalEvent.neighborhood),
                selectinload(Post.neighborhood),
            )
        )
        if active_only:
            stmt = stmt.where(Post.is_active.is_(True))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_local_event_id(self, event_id: uuid.UUID) -> Post | None:
        result = await self._session.execute(select(Post).where(Post.local_event_id == event_id))
        return result.scalar_one_or_none()

    async def get_by_partner_offer_id(self, offer_id: uuid.UUID) -> Post | None:
        result = await self._session.execute(select(Post).where(Post.partner_offer_id == offer_id))
        return result.scalar_one_or_none()

    async def get_by_partner_creator_content_id(self, content_id: uuid.UUID) -> Post | None:
        result = await self._session.execute(
            select(Post).where(Post.partner_creator_content_id == content_id)
        )
        return result.scalar_one_or_none()

    async def add(self, post: Post) -> Post:
        self._session.add(post)
        await self._session.flush()
        return post

    def _city_priority_expr(self, user_city: str | None) -> ColumnElement[int]:
        if not user_city:
            return case((Post.city.is_(None), 0), else_=0)
        normalized = user_city.strip().lower()
        return case(
            (func.lower(Post.city) == normalized, 1),
            else_=0,
        )

    async def list_feed(
        self,
        *,
        user_city: str | None,
        viewer_id: uuid.UUID | None,
        limit: int,
        cursor_priority: int | None,
        cursor_created_at: datetime | None,
        cursor_id: uuid.UUID | None,
    ) -> list[Post]:
        city_priority = self._city_priority_expr(user_city)
        # Global city feed: tribe-scoped posts are never listed (TICKET-A.2 invariant).
        stmt = (
            select(Post)
            .where(
                Post.is_active.is_(True),
                Post.tribe_id.is_(None),
                Post.is_story.is_(False),
                visible_posts_filter(viewer_id),
            )
            .options(
                selectinload(Post.partner_offer).selectinload(PartnerOffer.neighborhood),
                selectinload(Post.partner_creator_content),
                selectinload(Post.local_event).selectinload(LocalEvent.neighborhood),
                selectinload(Post.neighborhood),
            )
            .order_by(city_priority.desc(), Post.created_at.desc(), Post.id.desc())
            .limit(limit + 1)
        )
        if cursor_created_at is not None and cursor_id is not None and cursor_priority is not None:
            stmt = stmt.where(
                or_(
                    city_priority < cursor_priority,
                    and_(
                        city_priority == cursor_priority,
                        Post.created_at < cursor_created_at,
                    ),
                    and_(
                        city_priority == cursor_priority,
                        Post.created_at == cursor_created_at,
                        Post.id < cursor_id,
                    ),
                )
            )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_public_posts_by_user(
        self,
        user_id: uuid.UUID,
        *,
        limit: int,
    ) -> list[Post]:
        """Public citizen posts for a profile page (non-story, city feed posts)."""
        stmt = (
            select(Post)
            .where(
                Post.author_id == user_id,
                Post.type == PostType.POST.value,
                Post.is_active.is_(True),
                Post.is_story.is_(False),
                Post.tribe_id.is_(None),
                visible_posts_filter(None),
            )
            .options(
                selectinload(Post.local_event).selectinload(LocalEvent.neighborhood),
                selectinload(Post.neighborhood),
            )
            .order_by(Post.created_at.desc(), Post.id.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def increment_like_count(self, post_id: uuid.UUID, delta: int) -> None:
        post = await self.get_by_id(post_id)
        if post is None:
            return
        post.like_count = max(0, post.like_count + delta)

    async def increment_comment_count(self, post_id: uuid.UUID, delta: int) -> None:
        post = await self.get_by_id(post_id)
        if post is None:
            return
        post.comment_count = max(0, post.comment_count + delta)

    async def list_tribe_posts(
        self,
        tribe_id: uuid.UUID,
        *,
        limit: int,
        cursor_created_at: datetime | None,
        cursor_id: uuid.UUID | None,
    ) -> list[Post]:
        stmt = (
            select(Post)
            .where(
                Post.is_active.is_(True),
                Post.tribe_id == tribe_id,
            )
            .order_by(Post.created_at.desc(), Post.id.desc())
            .limit(limit + 1)
        )
        if cursor_created_at is not None and cursor_id is not None:
            stmt = stmt.where(
                or_(
                    Post.created_at < cursor_created_at,
                    and_(Post.created_at == cursor_created_at, Post.id < cursor_id),
                )
            )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_tribe_posts_since(
        self,
        tribe_id: uuid.UUID,
        *,
        after_created_at: datetime,
        after_id: uuid.UUID,
        limit: int,
    ) -> list[Post]:
        # Direction AVANT (polling) : posts strictement plus récents que le curseur, en ordre
        # chronologique ASC + capé -> gap-free si plus de `limit` posts arrivent entre deux polls.
        stmt = (
            select(Post)
            .where(
                Post.is_active.is_(True),
                Post.tribe_id == tribe_id,
                or_(
                    Post.created_at > after_created_at,
                    and_(Post.created_at == after_created_at, Post.id > after_id),
                ),
            )
            .order_by(Post.created_at.asc(), Post.id.asc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_last_tribe_post_at(
        self, tribe_id: uuid.UUID, author_id: uuid.UUID
    ) -> datetime | None:
        result = await self._session.execute(
            select(Post.created_at)
            .where(
                Post.tribe_id == tribe_id,
                Post.author_id == author_id,
                Post.author_type == PostAuthorType.CITIZEN.value,
            )
            .order_by(Post.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_discussions(
        self,
        *,
        user_city: str | None,
        viewer_id: uuid.UUID | None,
        limit: int,
        require_comments: bool,
        cursor_comment_count: int | None,
        cursor_created_at: datetime | None,
        cursor_id: uuid.UUID | None,
    ) -> list[Post]:
        city_priority = self._city_priority_expr(user_city)
        stmt = (
            select(Post)
            .where(
                Post.is_active.is_(True),
                Post.tribe_id.is_(None),
                Post.type == PostType.POST.value,
                Post.author_type == PostAuthorType.CITIZEN.value,
                visible_posts_filter(viewer_id),
            )
            .options(
                selectinload(Post.neighborhood),
            )
            .order_by(
                Post.comment_count.desc(),
                city_priority.desc(),
                Post.created_at.desc(),
                Post.id.desc(),
            )
            .limit(limit + 1)
        )
        if require_comments:
            stmt = stmt.where(Post.comment_count > 0)
        if (
            cursor_comment_count is not None
            and cursor_created_at is not None
            and cursor_id is not None
        ):
            stmt = stmt.where(
                or_(
                    Post.comment_count < cursor_comment_count,
                    and_(
                        Post.comment_count == cursor_comment_count,
                        Post.created_at < cursor_created_at,
                    ),
                    and_(
                        Post.comment_count == cursor_comment_count,
                        Post.created_at == cursor_created_at,
                        Post.id < cursor_id,
                    ),
                )
            )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_discussion_candidates_for_insights(
        self,
        *,
        user_city: str | None,
        viewer_id: uuid.UUID | None,
        limit: int = 120,
    ) -> list[Post]:
        city_priority = self._city_priority_expr(user_city)
        stmt = (
            select(Post)
            .where(
                Post.is_active.is_(True),
                Post.tribe_id.is_(None),
                Post.type == PostType.POST.value,
                Post.author_type == PostAuthorType.CITIZEN.value,
                Post.comment_count > 0,
                visible_posts_filter(viewer_id),
            )
            .order_by(city_priority.desc(), Post.comment_count.desc(), Post.created_at.desc())
            .limit(limit)
        )
        if user_city:
            normalized = user_city.strip().lower()
            stmt = stmt.where(
                or_(
                    func.lower(Post.city) == normalized,
                    Post.city.is_(None),
                )
            )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def count_citizen_posts_for_user(self, user_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Post)
            .where(
                Post.author_type == PostAuthorType.CITIZEN.value,
                Post.author_id == user_id,
                Post.type == PostType.POST.value,
                Post.is_active.is_(True),
            )
        )
        return int(result.scalar_one())

    async def increment_view_count(self, post_id: uuid.UUID) -> None:
        post = await self.get_by_id(post_id)
        if post is None:
            return
        post.view_count = max(0, post.view_count + 1)

    async def list_active_stories(
        self,
        *,
        user_city: str | None,
        limit: int,
        author_ids: set[uuid.UUID] | None,
        cursor_created_at: datetime | None,
        cursor_id: uuid.UUID | None,
        order_by_engagement: bool,
    ) -> list[Post]:
        now = datetime.now(UTC)
        city_priority = self._city_priority_expr(user_city)
        order_cols: list[ColumnElement[Any]] = []
        if order_by_engagement:
            order_cols.extend([Post.like_count.desc(), Post.view_count.desc()])
        order_cols.extend([city_priority.desc(), Post.created_at.desc(), Post.id.desc()])
        stmt = (
            select(Post)
            .where(
                Post.is_active.is_(True),
                Post.is_story.is_(True),
                Post.tribe_id.is_(None),
                Post.media_url.is_not(None),
                Post.author_type == PostAuthorType.CITIZEN.value,
                or_(Post.story_expires_at.is_(None), Post.story_expires_at > now),
            )
            .order_by(*order_cols)
            .limit(limit + 1)
        )
        if author_ids is not None:
            if not author_ids:
                return []
            stmt = stmt.where(Post.author_id.in_(author_ids))
        if cursor_created_at is not None and cursor_id is not None:
            stmt = stmt.where(
                or_(
                    Post.created_at < cursor_created_at,
                    and_(Post.created_at == cursor_created_at, Post.id < cursor_id),
                )
            )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_story_rings(
        self,
        *,
        user_city: str | None,
        limit: int,
    ) -> list[Post]:
        now = datetime.now(UTC)
        city_priority = self._city_priority_expr(user_city)
        stmt = (
            select(Post)
            .where(
                Post.is_active.is_(True),
                Post.is_story.is_(True),
                Post.tribe_id.is_(None),
                Post.media_url.is_not(None),
                Post.author_type == PostAuthorType.CITIZEN.value,
                or_(Post.story_expires_at.is_(None), Post.story_expires_at > now),
            )
            .order_by(city_priority.desc(), Post.created_at.desc(), Post.id.desc())
            .limit(limit * 4)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_story_contributors(
        self,
        *,
        user_city: str | None,
        limit: int = 5,
    ) -> list[tuple[uuid.UUID, int]]:
        now = datetime.now(UTC)
        stmt = (
            select(Post.author_id, func.count(Post.id).label("story_count"))
            .where(
                Post.is_active.is_(True),
                Post.is_story.is_(True),
                Post.tribe_id.is_(None),
                Post.author_type == PostAuthorType.CITIZEN.value,
                or_(Post.story_expires_at.is_(None), Post.story_expires_at > now),
            )
            .group_by(Post.author_id)
            .order_by(func.count(Post.id).desc())
            .limit(limit)
        )
        if user_city:
            normalized = user_city.strip().lower()
            stmt = stmt.where(
                or_(
                    func.lower(Post.city) == normalized,
                    Post.city.is_(None),
                )
            )
        result = await self._session.execute(stmt)
        return [(row[0], int(row[1])) for row in result.all()]

    async def get_top_story_for_city(
        self,
        *,
        user_city: str | None,
    ) -> Post | None:
        now = datetime.now(UTC)
        city_priority = self._city_priority_expr(user_city)
        stmt = (
            select(Post)
            .where(
                Post.is_active.is_(True),
                Post.is_story.is_(True),
                Post.tribe_id.is_(None),
                Post.media_url.is_not(None),
                Post.author_type == PostAuthorType.CITIZEN.value,
                or_(Post.story_expires_at.is_(None), Post.story_expires_at > now),
            )
            .order_by(
                city_priority.desc(),
                Post.view_count.desc(),
                Post.like_count.desc(),
                Post.created_at.desc(),
            )
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()
