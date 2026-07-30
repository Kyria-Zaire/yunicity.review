"""Tribe wall posts — isolated from city feed (TICKET-A.2)."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.feed_constants import PostAuthorType, PostType
from app.core.feed_cursor import decode_comment_cursor, encode_comment_cursor
from app.core.tribe_constants import (
    TRIBE_POST_COOLDOWN_SECONDS,
    TRIBE_POST_PAGE_SIZE_DEFAULT,
    TribeMemberRole,
    TribeModerationAction,
)
from app.models.post import Post
from app.models.tribe import Tribe, TribeMember
from app.models.user import User
from app.repositories.like_repository import LikeRepository
from app.repositories.post_repository import PostRepository
from app.repositories.tribe_member_repository import TribeMemberRepository
from app.schemas.post import PostResponse
from app.schemas.tribe import (
    TribePostCreateRequest,
    TribePostListResponse,
    clamp_post_page_size,
)
from app.services.feed_author_resolver import FeedAuthorResolver
from app.services.feed_post_mapper import to_post_response
from app.services.social_notification_service import SocialNotificationService
from app.services.tribe_authorization import TribeAuthorizationService
from app.services.tribe_moderation_log_service import TribeModerationLogService

logger = logging.getLogger(__name__)

# Cap du delta de polling (GET /posts/new) : ordre chronologique, gap-free entre deux polls.
_SINCE_LIMIT = 50


class TribePostService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._posts = PostRepository(session)
        self._likes = LikeRepository(session)
        self._members = TribeMemberRepository(session)
        self._authors = FeedAuthorResolver(session)
        self._authz = TribeAuthorizationService(session)
        self._audit = TribeModerationLogService(session)

    async def list_posts(
        self,
        viewer: User,
        *,
        city: str,
        slug: str,
        cursor: str | None,
        limit: int = TRIBE_POST_PAGE_SIZE_DEFAULT,
    ) -> TribePostListResponse:
        tribe = await self._authz.require_active_tribe(city, slug)
        await self._authz.require_active_member(tribe, viewer)
        limit = clamp_post_page_size(limit)
        cursor_created_at = None
        cursor_id = None
        if cursor:
            cursor_created_at, cursor_id = decode_comment_cursor(cursor)
        rows = await self._posts.list_tribe_posts(
            tribe.id,
            limit=limit,
            cursor_created_at=cursor_created_at,
            cursor_id=cursor_id,
        )
        has_more = len(rows) > limit
        page = rows[:limit]
        liked_ids = await self._likes.list_liked_post_ids(viewer.id, [post.id for post in page])
        items = []
        for post in page:
            author = await self._authors.resolve_user(post.author_id)
            items.append(to_post_response(post, author=author, liked_by_me=post.id in liked_ids))
        next_cursor = None
        if has_more and page:
            last = page[-1]
            next_cursor = encode_comment_cursor(last.created_at, last.id)
        # Curseur du post le PLUS RÉCENT (page en ordre DESC) — point de départ du polling.
        latest_cursor = (
            encode_comment_cursor(page[0].created_at, page[0].id) if page else None
        )
        return TribePostListResponse(
            items=items, next_cursor=next_cursor, latest_cursor=latest_cursor
        )

    async def list_posts_since(
        self,
        viewer: User,
        *,
        city: str,
        slug: str,
        after: str,
    ) -> TribePostListResponse:
        tribe = await self._authz.require_active_tribe(city, slug)
        await self._authz.require_active_member(tribe, viewer)
        after_created_at, after_id = decode_comment_cursor(after)
        rows = await self._posts.list_tribe_posts_since(
            tribe.id,
            after_created_at=after_created_at,
            after_id=after_id,
            limit=_SINCE_LIMIT,
        )
        liked_ids = await self._likes.list_liked_post_ids(viewer.id, [post.id for post in rows])
        items = []
        for post in rows:
            author = await self._authors.resolve_user(post.author_id)
            items.append(to_post_response(post, author=author, liked_by_me=post.id in liked_ids))
        # rows en ordre ASC : le plus récent est le dernier. Sans nouveau post, on renvoie
        # le curseur inchangé pour que le client reparte du même point au prochain poll.
        latest_cursor = encode_comment_cursor(rows[-1].created_at, rows[-1].id) if rows else after
        return TribePostListResponse(items=items, next_cursor=None, latest_cursor=latest_cursor)

    async def create_post(
        self,
        user: User,
        *,
        city: str,
        slug: str,
        payload: TribePostCreateRequest,
    ) -> PostResponse:
        tribe = await self._authz.require_active_tribe(city, slug)
        await self._authz.require_active_member(tribe, user)
        await self._enforce_post_cooldown(tribe.id, user.id)
        post = Post(
            author_type=PostAuthorType.CITIZEN.value,
            author_id=user.id,
            type=PostType.POST.value,
            city=None,
            tribe_id=tribe.id,
            body=payload.body.strip(),
            media_url=payload.media_url,
        )
        await self._posts.add(post)
        await self._session.commit()
        await self._session.refresh(post)
        # Notification aux membres — best-effort, n'échoue JAMAIS la création du post.
        try:
            recipient_ids = await self._members.list_notifiable_member_user_ids(
                tribe.id, exclude_user_id=user.id
            )
            if recipient_ids:
                await SocialNotificationService(self._session).notify_tribe_post(
                    post=post, tribe=tribe, actor_id=user.id, recipient_user_ids=recipient_ids
                )
        except Exception:
            logger.warning(
                "tribe_post_notify_failed",
                extra={"tribe_id": str(tribe.id), "post_id": str(post.id)},
                exc_info=True,
            )
        author = await self._authors.resolve_user(user.id)
        return to_post_response(post, author=author, liked_by_me=False)

    async def soft_delete_post(
        self,
        actor: User,
        *,
        city: str,
        slug: str,
        post_id: uuid.UUID,
    ) -> None:
        tribe = await self._authz.require_active_tribe(city, slug)
        member = await self._membership_for_moderation(tribe, actor, post_id)
        post = await self._require_tribe_post(tribe.id, post_id)
        if post.author_id == actor.id and member.role == TribeMemberRole.MEMBER.value:
            post.is_active = False
        else:
            await self._authz.require_role_at_least(
                tribe, actor, min_role=TribeMemberRole.MODERATOR
            )
            post.is_active = False
        await self._audit.log(
            tribe_id=tribe.id,
            actor_user_id=actor.id,
            action=TribeModerationAction.REMOVE_POST.value,
            target_post_id=post_id,
        )
        await self._session.commit()

    async def _membership_for_moderation(
        self, tribe: Tribe, actor: User, post_id: uuid.UUID
    ) -> TribeMember:
        member = await self._authz.require_active_member(tribe, actor)
        post = await self._require_tribe_post(tribe.id, post_id)
        if post.author_id == actor.id:
            return member
        await self._authz.require_role_at_least(tribe, actor, min_role=TribeMemberRole.MODERATOR)
        return member

    async def _require_tribe_post(self, tribe_id: uuid.UUID, post_id: uuid.UUID) -> Post:
        post = await self._posts.get_by_id(post_id, active_only=True)
        if post is None or post.tribe_id != tribe_id:
            raise AppError(
                status_code=404,
                code="POST_NOT_FOUND",
                detail="Publication introuvable.",
            )
        return post

    async def _enforce_post_cooldown(self, tribe_id: uuid.UUID, user_id: uuid.UUID) -> None:
        last_at = await self._posts.get_last_tribe_post_at(tribe_id, user_id)
        if last_at is None:
            return
        if last_at.tzinfo is None:
            last_at = last_at.replace(tzinfo=UTC)
        elapsed = datetime.now(UTC) - last_at
        if elapsed.total_seconds() < TRIBE_POST_COOLDOWN_SECONDS:
            raise AppError(
                status_code=429,
                code="TRIBE_POST_RATE_LIMIT",
                detail="Prenez un instant avant de publier à nouveau.",
            )
