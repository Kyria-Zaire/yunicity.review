"""Local stories portal (WEB-STORIES-01)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.feed_constants import PostAuthorType, PostType
from app.core.story_category import infer_story_categories, post_matches_story_category
from app.core.story_constants import (
    STORY_CATEGORY_LABELS,
    STORY_PAGE_SIZE_MAX,
    STORY_RECENT_MINUTES,
    STORY_RING_MAX,
    STORY_TTL_HOURS,
    StoryAudience,
    StoryCategory,
    StoryTab,
)
from app.core.story_cursor import decode_story_cursor, encode_story_cursor
from app.models.post import Post
from app.models.tribe import TribeMember
from app.models.user import User
from app.repositories.like_repository import LikeRepository
from app.repositories.post_repository import PostRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.story import (
    StoryContributorItem,
    StoryCreateRequest,
    StoryFeaturedItem,
    StoryInsightsResponse,
    StoryItem,
    StoryListResponse,
    StoryLiveItem,
    StoryRingItem,
    StoryRingsResponse,
)
from app.services.feed_author_resolver import FeedAuthorResolver


def _caption(post: Post) -> str:
    return (post.body or "").strip()


def _is_recent(post: Post, now: datetime) -> bool:
    created = post.created_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=UTC)
    return (now - created) <= timedelta(minutes=STORY_RECENT_MINUTES)


class StoryService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._posts = PostRepository(session)
        self._likes = LikeRepository(session)
        self._profiles = ProfileRepository(session)
        self._authors = FeedAuthorResolver(session)

    async def _user_city(self, viewer: User) -> str | None:
        profile = await self._profiles.get_by_user_id(viewer.id)
        return profile.city if profile and profile.city else viewer.city

    async def _co_member_author_ids(self, viewer_id: uuid.UUID) -> set[uuid.UUID]:
        tribe_ids_stmt = select(TribeMember.tribe_id).where(
            TribeMember.user_id == viewer_id,
            TribeMember.left_at.is_(None),
        )
        tribe_ids = {row[0] for row in (await self._session.execute(tribe_ids_stmt)).all()}
        if not tribe_ids:
            return set()
        members_stmt = select(TribeMember.user_id).where(
            TribeMember.tribe_id.in_(tribe_ids),
            TribeMember.left_at.is_(None),
        )
        return {row[0] for row in (await self._session.execute(members_stmt)).all()}

    def _can_view_story(self, post: Post, viewer_id: uuid.UUID, co_members: set[uuid.UUID]) -> bool:
        audience = post.story_audience or StoryAudience.PUBLIC.value
        if audience == StoryAudience.PUBLIC.value:
            return True
        if post.author_id == viewer_id:
            return True
        return post.author_id in co_members

    def _to_item(self, post: Post, *, author, liked_by_me: bool, now: datetime) -> StoryItem:
        categories = infer_story_categories(post)
        return StoryItem(
            id=post.id,
            author=author,
            caption=_caption(post),
            media_url=post.media_url or "",
            location_label=post.story_location_label,
            category_ids=[c.value for c in categories],
            category_labels=[STORY_CATEGORY_LABELS[c] for c in categories[:2]],
            view_count=post.view_count,
            like_count=post.like_count,
            liked_by_me=liked_by_me,
            created_at=post.created_at,
            expires_at=post.story_expires_at,
            is_recent=_is_recent(post, now),
            city=post.city,
        )

    async def list_stories(
        self,
        viewer: User,
        *,
        tab: StoryTab,
        category: StoryCategory,
        cursor: str | None,
        limit: int,
    ) -> StoryListResponse:
        limit = min(limit, STORY_PAGE_SIZE_MAX)
        user_city = await self._user_city(viewer)
        now = datetime.now(UTC)

        cursor_created_at = None
        cursor_id = None
        if cursor:
            cursor_created_at, cursor_id = decode_story_cursor(cursor)

        author_ids: set[uuid.UUID] | None = None
        order_by_engagement = tab == StoryTab.FOR_YOU
        if tab == StoryTab.SUBSCRIPTIONS:
            author_ids = await self._co_member_author_ids(viewer.id)
            author_ids.discard(viewer.id)

        fetch_limit = limit + 1
        if category != StoryCategory.ALL:
            fetch_limit = min((limit + 1) * 4, STORY_PAGE_SIZE_MAX * 4)

        rows = await self._posts.list_active_stories(
            user_city=user_city,
            limit=fetch_limit,
            author_ids=author_ids,
            cursor_created_at=cursor_created_at,
            cursor_id=cursor_id,
            order_by_engagement=order_by_engagement and tab != StoryTab.RECENT,
        )
        if category != StoryCategory.ALL:
            rows = [post for post in rows if post_matches_story_category(post, category)]
        co_members = await self._co_member_author_ids(viewer.id)
        rows = [post for post in rows if self._can_view_story(post, viewer.id, co_members)]
        has_more = len(rows) > limit
        page = rows[:limit]

        liked_ids = await self._likes.list_liked_post_ids(viewer.id, [post.id for post in page])
        author_map = await self._authors.resolve_posts(page)
        items: list[StoryItem] = []
        for post in page:
            author = author_map.get(post.author_id) or await self._authors.resolve_user(post.author_id)
            items.append(self._to_item(post, author=author, liked_by_me=post.id in liked_ids, now=now))

        next_cursor = None
        if has_more and page:
            last = page[-1]
            next_cursor = encode_story_cursor(last.created_at, last.id)

        return StoryListResponse(items=items, next_cursor=next_cursor, city=user_city)

    async def list_rings(self, viewer: User) -> StoryRingsResponse:
        user_city = await self._user_city(viewer)
        now = datetime.now(UTC)
        rows = await self._posts.list_story_rings(user_city=user_city, limit=STORY_RING_MAX)
        co_members = await self._co_member_author_ids(viewer.id)
        seen: set[uuid.UUID] = set()
        rings: list[StoryRingItem] = []
        author_map = await self._authors.resolve_posts(rows)
        for post in rows:
            if not self._can_view_story(post, viewer.id, co_members):
                continue
            if post.author_id in seen:
                continue
            seen.add(post.author_id)
            author = author_map.get(post.author_id) or await self._authors.resolve_user(post.author_id)
            subtitle = post.story_location_label or _caption(post)[:40] or "Story locale"
            rings.append(
                StoryRingItem(
                    author_id=post.author_id,
                    author_name=author.display_name,
                    author_avatar_url=author.logo_url,
                    subtitle=subtitle,
                    latest_story_id=post.id,
                    latest_media_url=post.media_url,
                    has_recent=_is_recent(post, now),
                )
            )
            if len(rings) >= STORY_RING_MAX:
                break
        return StoryRingsResponse(items=rings)

    async def get_insights(self, viewer: User) -> StoryInsightsResponse:
        user_city = await self._user_city(viewer)
        now = datetime.now(UTC)
        rows = await self._posts.list_active_stories(
            user_city=user_city,
            limit=8,
            author_ids=None,
            cursor_created_at=None,
            cursor_id=None,
            order_by_engagement=True,
        )
        co_members = await self._co_member_author_ids(viewer.id)
        rows = [post for post in rows if self._can_view_story(post, viewer.id, co_members)]
        author_map = await self._authors.resolve_posts(rows)
        live_items: list[StoryLiveItem] = []
        for post in rows[:5]:
            author = author_map.get(post.author_id) or await self._authors.resolve_user(post.author_id)
            live_items.append(
                StoryLiveItem(
                    story_id=post.id,
                    author_name=author.display_name,
                    author_avatar_url=author.logo_url,
                    location_label=post.story_location_label,
                    subtitle=_caption(post)[:80] or post.story_location_label or author.display_name,
                    view_count=post.view_count,
                    is_recent=_is_recent(post, now),
                )
            )

        contributors_raw = await self._posts.list_story_contributors(user_city=user_city, limit=5)
        contributors: list[StoryContributorItem] = []
        for author_id, count in contributors_raw:
            author = await self._authors.resolve_user(author_id)
            contributors.append(
                StoryContributorItem(
                    author_id=author_id,
                    author_name=author.display_name,
                    author_avatar_url=author.logo_url,
                    story_count=count,
                )
            )

        featured_post = await self._posts.get_top_story_for_city(user_city=user_city)
        featured: StoryFeaturedItem | None = None
        if featured_post and featured_post.media_url:
            featured = StoryFeaturedItem(
                story_id=featured_post.id,
                title=_caption(featured_post)[:60] or "Story à la une",
                description="Découvrez les plus belles stories de votre communauté.",
                media_url=featured_post.media_url,
                href=f"/stories#story-{featured_post.id}",
            )

        return StoryInsightsResponse(
            live_stories=live_items,
            top_contributors=contributors,
            featured=featured,
        )

    async def create_story(self, user: User, payload: StoryCreateRequest) -> StoryItem:
        profile = await self._profiles.get_by_user_id(user.id)
        city = (profile.city if profile and profile.city else user.city) or None
        now = datetime.now(UTC)
        expires_at = now + timedelta(hours=STORY_TTL_HOURS)
        stored_category = None if payload.category == StoryCategory.ALL else payload.category.value
        post = Post(
            author_type=PostAuthorType.CITIZEN.value,
            author_id=user.id,
            type=PostType.POST.value,
            city=city,
            body=payload.caption,
            media_url=payload.media_url,
            is_story=True,
            story_category=stored_category,
            story_location_label=payload.location_label,
            story_expires_at=expires_at,
            story_audience=payload.audience.value,
            story_tags=payload.tags,
            story_media_type=payload.media_type,
        )
        if payload.location:
            post.set_location(payload.location.latitude, payload.location.longitude)
        await self._posts.add(post)
        await self._session.commit()
        await self._session.refresh(post)
        author = await self._authors.resolve_user(user.id)
        return self._to_item(post, author=author, liked_by_me=False, now=now)

    async def record_view(self, viewer: User, story_id: uuid.UUID) -> None:
        post = await self._posts.get_by_id(story_id, active_only=True)
        if post is None or not post.is_story:
            raise AppError(
                status_code=404,
                code="STORY_NOT_FOUND",
                detail="Story introuvable.",
            )
        await self._posts.increment_view_count(story_id)
        await self._session.commit()
