"""Admin staff persistence (ADMIN-08B)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.core.staff_admin_constants import STAFF_PLATFORM_ROLE_KEYS
from app.models.rbac import Permission, Role, RolePermission, UserRole
from app.models.staff_admin_action import StaffAdminAction
from app.models.user import User
from app.models.user_profile import UserProfile
from app.services.admin_staff_queries import resolve_dominant_staff_role


@dataclass(frozen=True)
class AdminStaffActionListRow:
    action: StaffAdminAction
    actor: User | None
    actor_profile: UserProfile | None


@dataclass(frozen=True)
class AdminStaffAdminSummaryCounts:
    total: int
    active: int
    suspended: int
    super_admins: int
    city_admins: int
    moderators: int
    dominant_role: str | None


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

    def _staff_user_ids_subquery(self) -> Select[tuple[uuid.UUID]]:
        return (
            select(UserRole.user_id)
            .join(Role, UserRole.role_id == Role.id)
            .where(
                Role.key.in_(STAFF_PLATFORM_ROLE_KEYS),
                UserRole.scope_type.is_(None),
                UserRole.scope_id.is_(None),
            )
            .distinct()
        )

    def _build_staff_user_filters(
        self,
        *,
        role: str | None,
        is_active: bool | None,
    ) -> list[Any]:
        staff_user_ids = self._staff_user_ids_subquery()
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
        return filters

    async def count_staff_users(
        self,
        *,
        role: str | None = None,
        is_active: bool | None = None,
    ) -> int:
        filters = self._build_staff_user_filters(role=role, is_active=is_active)
        count_stmt = select(func.count()).select_from(User).where(*filters)
        return int((await self._session.execute(count_stmt)).scalar_one())

    async def fetch_role_assignment_counts(self) -> dict[str, int]:
        stmt = (
            select(Role.key, func.count(func.distinct(UserRole.user_id)))
            .select_from(UserRole)
            .join(Role, UserRole.role_id == Role.id)
            .where(
                Role.key.in_(STAFF_PLATFORM_ROLE_KEYS),
                UserRole.scope_type.is_(None),
                UserRole.scope_id.is_(None),
            )
            .group_by(Role.key)
        )
        rows = (await self._session.execute(stmt)).all()
        return {str(row[0]): int(row[1]) for row in rows if int(row[1]) > 0}

    async def fetch_admin_summary(self) -> AdminStaffAdminSummaryCounts:
        role_counts = await self.fetch_role_assignment_counts()
        dominant_role = resolve_dominant_staff_role(role_counts)
        return AdminStaffAdminSummaryCounts(
            total=await self.count_staff_users(),
            active=await self.count_staff_users(is_active=True),
            suspended=await self.count_staff_users(is_active=False),
            super_admins=await self.count_staff_users(role="SUPER_ADMIN"),
            city_admins=await self.count_staff_users(role="CITY_ADMIN"),
            moderators=await self.count_staff_users(role="MODERATOR"),
            dominant_role=dominant_role,
        )

    async def list_staff_users(
        self,
        *,
        role: str | None,
        is_active: bool | None,
        page: int,
        page_size: int,
    ) -> tuple[list[User], int]:
        filters = self._build_staff_user_filters(role=role, is_active=is_active)
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
