"""Local discussions portal (WEB-DISCUSSIONS-01)."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.discussion_category import infer_discussion_categories, post_matches_category
from app.core.discussion_constants import (
    DISCUSSION_CATEGORY_LABELS,
    DISCUSSION_PAGE_SIZE_MAX,
    DiscussionCategory,
)
from app.core.discussion_cursor import decode_discussion_cursor, encode_discussion_cursor
from app.core.errors import AppError
from app.core.feed_constants import PostAuthorType, PostType
from app.models.post import Post
from app.models.user import User
from app.repositories.comment_repository import CommentRepository
from app.repositories.like_repository import LikeRepository
from app.repositories.post_repository import PostRepository
from app.repositories.profile_repository import ProfileRepository
from app.repositories.tribe_member_repository import TribeMemberRepository
from app.repositories.tribe_repository import TribeRepository
from app.schemas.discussion import (
    DiscussionActiveItem,
    DiscussionCreateRequest,
    DiscussionInsightsResponse,
    DiscussionListResponse,
    DiscussionParticipant,
    DiscussionThreadItem,
    DiscussionTrendingTopic,
)
from app.services.feed_author_resolver import FeedAuthorResolver
from app.services.feed_post_mapper import to_feed_item


def _discussion_title(post_body: str | None, post_title: str | None) -> str:
    if post_title and post_title.strip():
        return post_title.strip()[:120]
    body = (post_body or "").strip()
    if not body:
        return "Discussion"
    first_line = body.split("\n", 1)[0].strip()
    return first_line[:120] if first_line else "Discussion"


def _discussion_excerpt(post_body: str | None, *, max_len: int = 160) -> str:
    body = (post_body or "").strip().replace("\n", " ")
    if len(body) <= max_len:
        return body
    return f"{body[: max_len - 1].rstrip()}…"


class DiscussionService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._posts = PostRepository(session)
        self._comments = CommentRepository(session)
        self._likes = LikeRepository(session)
        self._profiles = ProfileRepository(session)
        self._authors = FeedAuthorResolver(session)
        self._tribes = TribeRepository(session)
        self._tribe_members = TribeMemberRepository(session)

    async def create_discussion(
        self,
        user: User,
        payload: DiscussionCreateRequest,
    ) -> DiscussionThreadItem:
        profile = await self._profiles.get_by_user_id(user.id)
        city = (profile.city if profile and profile.city else user.city) or None

        linked_tribe_name: str | None = None
        if payload.linked_tribe_id is not None:
            tribe = await self._tribes.get_by_id(payload.linked_tribe_id)
            if tribe is None or tribe.archived_at is not None:
                raise AppError(
                    status_code=404,
                    code="TRIBE_NOT_FOUND",
                    detail="Tribu introuvable.",
                )
            membership = await self._tribe_members.get_membership(tribe.id, user.id)
            if membership is None or membership.left_at is not None:
                raise AppError(
                    status_code=403,
                    code="FORBIDDEN",
                    detail="Vous devez être membre de cette tribu.",
                )
            linked_tribe_name = tribe.name

        stored_category = (
            None if payload.category == DiscussionCategory.ALL else payload.category.value
        )
        post = Post(
            author_type=PostAuthorType.CITIZEN.value,
            author_id=user.id,
            type=PostType.POST.value,
            city=city,
            title=payload.title.strip(),
            body=payload.body.strip(),
            media_url=payload.media_url,
            discussion_category=stored_category,
            discussion_tags=payload.tags,
            linked_tribe_id=payload.linked_tribe_id,
        )
        await self._posts.add(post)
        await self._session.commit()
        await self._session.refresh(post)

        author = await self._authors.resolve_user(user.id)
        return self._to_thread_item(
            post,
            author=author,
            liked_by_me=False,
            participants=[],
            participants_overflow=0,
            last_activity_at=post.created_at,
            linked_tribe_name=linked_tribe_name,
        )

    def _to_thread_item(
        self,
        post: Post,
        *,
        author,
        liked_by_me: bool,
        participants: list[tuple[str | None, str]],
        participants_overflow: int,
        last_activity_at,
        linked_tribe_name: str | None = None,
    ) -> DiscussionThreadItem:
        feed_item = to_feed_item(post, author=author, liked_by_me=liked_by_me)
        categories = infer_discussion_categories(post)
        tags = post.discussion_tags if isinstance(post.discussion_tags, list) else []
        return DiscussionThreadItem(
            **feed_item.model_dump(),
            discussion_title=_discussion_title(post.body, post.title),
            excerpt=_discussion_excerpt(post.body),
            category_ids=[c.value for c in categories],
            category_labels=[DISCUSSION_CATEGORY_LABELS[c] for c in categories[:3]],
            discussion_tags=[str(tag) for tag in tags],
            linked_tribe_id=post.linked_tribe_id,
            linked_tribe_name=linked_tribe_name,
            participants=[
                DiscussionParticipant(display_name=name, avatar_url=url)
                for url, name in participants
            ],
            participants_overflow=participants_overflow,
            last_activity_at=last_activity_at,
        )

    async def list_discussions(
        self,
        viewer: User,
        *,
        category: DiscussionCategory,
        cursor: str | None,
        limit: int,
        require_comments: bool,
    ) -> DiscussionListResponse:
        limit = min(limit, DISCUSSION_PAGE_SIZE_MAX)
        profile = await self._profiles.get_by_user_id(viewer.id)
        user_city = profile.city if profile and profile.city else viewer.city

        cursor_comment_count = None
        cursor_created_at = None
        cursor_id = None
        if cursor:
            cursor_comment_count, cursor_created_at, cursor_id = decode_discussion_cursor(cursor)

        fetch_limit = limit + 1
        if category != DiscussionCategory.ALL:
            fetch_limit = min((limit + 1) * 4, DISCUSSION_PAGE_SIZE_MAX * 4)

        rows = await self._posts.list_discussions(
            user_city=user_city,
            limit=fetch_limit,
            require_comments=require_comments,
            cursor_comment_count=cursor_comment_count,
            cursor_created_at=cursor_created_at,
            cursor_id=cursor_id,
        )

        if category != DiscussionCategory.ALL:
            rows = [post for post in rows if post_matches_category(post, category)]

        has_more = len(rows) > limit
        page = rows[:limit]

        post_ids = [post.id for post in page]
        liked_ids = await self._likes.list_liked_post_ids(viewer.id, post_ids)
        author_map = await self._authors.resolve_posts(page)
        activity_map = await self._comments.latest_activity_by_post(post_ids)
        participants_map = await self._comments.recent_participants_by_post(post_ids)

        linked_tribe_ids = {post.linked_tribe_id for post in page if post.linked_tribe_id}
        tribe_names: dict = {}
        for tribe_id in linked_tribe_ids:
            tribe = await self._tribes.get_by_id(tribe_id)
            if tribe is not None:
                tribe_names[tribe_id] = tribe.name

        items: list[DiscussionThreadItem] = []
        for post in page:
            author = author_map.get(post.author_id)
            if author is None:
                author = await self._authors.resolve_user(post.author_id)
            participants_raw = participants_map.get(post.id, [])
            overflow = max(0, post.comment_count - len(participants_raw))
            items.append(
                self._to_thread_item(
                    post,
                    author=author,
                    liked_by_me=post.id in liked_ids,
                    participants=participants_raw,
                    participants_overflow=overflow,
                    last_activity_at=activity_map.get(post.id) or post.updated_at,
                    linked_tribe_name=(
                        tribe_names.get(post.linked_tribe_id) if post.linked_tribe_id else None
                    ),
                )
            )

        next_cursor = None
        if has_more and page:
            last = page[-1]
            next_cursor = encode_discussion_cursor(
                last.comment_count, last.created_at, last.id
            )

        return DiscussionListResponse(
            items=items,
            next_cursor=next_cursor,
            city=user_city,
        )

    async def get_insights(self, viewer: User) -> DiscussionInsightsResponse:
        profile = await self._profiles.get_by_user_id(viewer.id)
        user_city = profile.city if profile and profile.city else viewer.city

        candidates = await self._posts.list_discussion_candidates_for_insights(
            user_city=user_city,
        )
        post_ids = [post.id for post in candidates]
        activity_map = await self._comments.latest_activity_by_post(post_ids)

        topic_counts: dict[DiscussionCategory, int] = {}
        for post in candidates:
            for category in infer_discussion_categories(post):
                topic_counts[category] = topic_counts.get(category, 0) + post.comment_count

        trending = [
            DiscussionTrendingTopic(
                id=category.value,
                label=DISCUSSION_CATEGORY_LABELS[category],
                message_count=count,
            )
            for category, count in sorted(
                topic_counts.items(), key=lambda item: item[1], reverse=True
            )
            if count > 0
        ][:5]

        active_posts = sorted(
            candidates,
            key=lambda post: (
                activity_map.get(post.id) or post.updated_at,
                post.comment_count,
            ),
            reverse=True,
        )[:5]

        author_map = await self._authors.resolve_posts(active_posts)
        active_items: list[DiscussionActiveItem] = []
        for post in active_posts:
            author = author_map.get(post.author_id)
            if author is None:
                author = await self._authors.resolve_user(post.author_id)
            last_at = activity_map.get(post.id) or post.updated_at
            active_items.append(
                DiscussionActiveItem(
                    post_id=post.id,
                    title=_discussion_title(post.body, post.title),
                    reply_count=post.comment_count,
                    last_activity_at=last_at,
                    has_recent_activity=post.comment_count > 0,
                    author_display_name=author.display_name,
                    author_avatar_url=author.logo_url,
                )
            )

        return DiscussionInsightsResponse(
            trending_topics=trending,
            active_discussions=active_items,
        )
