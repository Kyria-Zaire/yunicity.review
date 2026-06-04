"""Admin staff persistence (ADMIN-08B)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.core.staff_admin_constants import STAFF_PLATFORM_ROLE_KEYS
from app.models.rbac import Permission, Role, RolePermission, UserRole
from app.models.staff_admin_action import StaffAdminAction
from app.models.user import User
from app.models.user_profile import UserProfile


@dataclass(frozen=True)
class AdminStaffActionListRow:
    action: StaffAdminAction
    actor: User | None
    actor_profile: UserProfile | None


class AdminStaffRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self._session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def user_has_platform_staff_role(self, user_id: uuid.UUID) -> bool:
        stmt = (
            select(func.count())
            .select_from(UserRole)
            .join(Role, UserRole.role_id == Role.id)
            .where(
                UserRole.user_id == user_id,
                Role.key.in_(STAFF_PLATFORM_ROLE_KEYS),
                UserRole.scope_type.is_(None),
                UserRole.scope_id.is_(None),
            )
        )
        count = int((await self._session.execute(stmt)).scalar_one())
        return count > 0

    async def list_staff_users(
        self,
        *,
        role: str | None,
        is_active: bool | None,
        page: int,
        page_size: int,
    ) -> tuple[list[User], int]:
        staff_user_ids = (
            select(UserRole.user_id)
            .join(Role, UserRole.role_id == Role.id)
            .where(
                Role.key.in_(STAFF_PLATFORM_ROLE_KEYS),
                UserRole.scope_type.is_(None),
                UserRole.scope_id.is_(None),
            )
            .distinct()
        )

        filters: list[Any] = [User.id.in_(staff_user_ids)]
        if role is not None:
            role_user_ids = (
                select(UserRole.user_id)
                .join(Role, UserRole.role_id == Role.id)
                .where(
                    Role.key == role,
                    UserRole.scope_type.is_(None),
                    UserRole.scope_id.is_(None),
                )
                .distinct()
            )
            filters.append(User.id.in_(role_user_ids))
        if is_active is not None:
            filters.append(User.is_active.is_(is_active))

        count_stmt = select(func.count()).select_from(User).where(*filters)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        stmt = (
            select(User)
            .where(*filters)
            .order_by(User.created_at.desc(), User.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all()), total

    async def count_active_users_with_permission(self, permission_key: str) -> int:
        stmt = (
            select(func.count(func.distinct(User.id)))
            .select_from(User)
            .join(UserRole, UserRole.user_id == User.id)
            .join(Role, UserRole.role_id == Role.id)
            .join(RolePermission, RolePermission.role_id == Role.id)
            .join(Permission, Permission.id == RolePermission.permission_id)
            .where(
                User.is_active.is_(True),
                Permission.key == permission_key,
                UserRole.scope_type.is_(None),
                UserRole.scope_id.is_(None),
            )
        )
        return int((await self._session.execute(stmt)).scalar_one())

    async def user_has_permission(self, user_id: uuid.UUID, permission_key: str) -> bool:
        stmt = (
            select(Permission.id)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(Role, Role.id == RolePermission.role_id)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(
                UserRole.user_id == user_id,
                Permission.key == permission_key,
                UserRole.scope_type.is_(None),
                UserRole.scope_id.is_(None),
            )
            .limit(1)
        )
        return (await self._session.execute(stmt)).scalar_one_or_none() is not None

    async def append_admin_action(
        self,
        *,
        target_user_id: uuid.UUID,
        actor_user_id: uuid.UUID,
        action: str,
        previous_roles: list[str] | None,
        new_roles: list[str] | None,
        reason: str | None,
        metadata: dict[str, Any] | None = None,
    ) -> StaffAdminAction:
        entry = StaffAdminAction(
            target_user_id=target_user_id,
            actor_user_id=actor_user_id,
            action=action,
            previous_roles=previous_roles,
            new_roles=new_roles,
            reason=reason,
            metadata_=metadata,
        )
        self._session.add(entry)
        await self._session.flush()
        return entry

    async def list_admin_actions(
        self,
        target_user_id: uuid.UUID,
        *,
        page: int,
        page_size: int,
    ) -> tuple[list[AdminStaffActionListRow], int]:
        filters = [StaffAdminAction.target_user_id == target_user_id]
        count_stmt = select(func.count()).select_from(StaffAdminAction).where(*filters)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        actor_user = aliased(User)
        stmt = (
            select(StaffAdminAction, actor_user, UserProfile)
            .outerjoin(actor_user, StaffAdminAction.actor_user_id == actor_user.id)
            .outerjoin(UserProfile, UserProfile.user_id == actor_user.id)
            .where(*filters)
            .order_by(StaffAdminAction.created_at.desc(), StaffAdminAction.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = await self._session.execute(stmt)
        return (
            [
                AdminStaffActionListRow(
                    action=action,
                    actor=actor,
                    actor_profile=actor_profile,
                )
                for action, actor, actor_profile in rows.all()
            ],
            total,
        )
