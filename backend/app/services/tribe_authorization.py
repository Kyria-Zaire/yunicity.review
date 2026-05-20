"""Tribe access control (TICKET-A.2)."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.tribe_constants import TribeMemberRole
from app.models.post import Post
from app.models.tribe import Tribe, TribeMember
from app.models.user import User
from app.repositories.tribe_member_repository import TribeMemberRepository
from app.repositories.tribe_repository import TribeRepository
from app.services.rbac_service import RbacService


class TribeAuthorizationService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._tribes = TribeRepository(session)
        self._members = TribeMemberRepository(session)
        self._rbac = RbacService(session)

    async def require_active_tribe(self, city: str, slug: str) -> Tribe:
        tribe = await self._tribes.get_by_slug(city, slug)
        if tribe is None or tribe.archived_at is not None:
            raise AppError(
                status_code=404,
                code="TRIBE_NOT_FOUND",
                detail="Cette tribu n'est pas disponible.",
            )
        return tribe

    async def require_active_member(self, tribe: Tribe, user: User) -> TribeMember:
        member = await self._members.get_active_membership(tribe.id, user.id)
        if member is None:
            raise AppError(
                status_code=403,
                code="TRIBE_MEMBERS_ONLY",
                detail="Ce contenu est réservé aux membres de la tribu.",
            )
        return member

    async def require_role_at_least(
        self,
        tribe: Tribe,
        user: User,
        *,
        min_role: TribeMemberRole,
    ) -> TribeMember:
        member = await self.require_active_member(tribe, user)
        order = {
            TribeMemberRole.MEMBER.value: 0,
            TribeMemberRole.MODERATOR.value: 1,
            TribeMemberRole.OWNER.value: 2,
        }
        if order.get(member.role, -1) < order[min_role.value]:
            raise AppError(
                status_code=403,
                code="TRIBE_FORBIDDEN",
                detail="Permission insuffisante dans cette tribu.",
            )
        return member

    async def is_staff(self, user_id: uuid.UUID) -> bool:
        for key in ("moderation.manage", "system.admin"):
            if await self._rbac.user_has_permission(user_id, key):
                return True
        return False

    async def require_staff(self, user: User) -> None:
        if not await self.is_staff(user.id):
            raise AppError(
                status_code=403,
                code="FORBIDDEN",
                detail="Permission insuffisante.",
            )

    def assert_post_not_in_global_feed(self, post: Post) -> None:
        if post.tribe_id is not None:
            raise AppError(
                status_code=404,
                code="POST_NOT_FOUND",
                detail="Publication introuvable.",
            )

    async def require_can_interact_with_post(self, post: Post, user: User) -> None:
        await self.require_can_interact_with_post_for_user(post, user.id)

    async def require_can_interact_with_post_for_user(self, post: Post, user_id: uuid.UUID) -> None:
        if post.tribe_id is None:
            return
        tribe = await self._tribes.get_by_id(post.tribe_id)
        if tribe is None or tribe.archived_at is not None:
            raise AppError(
                status_code=404,
                code="POST_NOT_FOUND",
                detail="Publication introuvable.",
            )
        member = await self._members.get_active_membership(tribe.id, user_id)
        if member is None and not await self.is_staff(user_id):
            raise AppError(
                status_code=403,
                code="TRIBE_MEMBERS_ONLY",
                detail="Ce contenu est réservé aux membres de la tribu.",
            )

    async def can_view_tribe_wall(self, tribe: Tribe, user: User | None) -> bool:
        if user is None:
            return False
        member = await self._members.get_active_membership(tribe.id, user.id)
        return member is not None or await self.is_staff(user.id)
