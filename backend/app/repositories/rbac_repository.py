import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rbac import Permission, Role, RolePermission, UserRole


class RbacRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_role_by_key(self, key: str) -> Role | None:
        result = await self._session.execute(select(Role).where(Role.key == key))
        return result.scalar_one_or_none()

    async def assign_role_to_user(
        self,
        user_id: uuid.UUID,
        role_key: str,
        *,
        assigned_by: uuid.UUID | None = None,
    ) -> UserRole:
        role = await self.get_role_by_key(role_key)
        if role is None:
            raise ValueError(f"Role not found: {role_key}")

        existing = await self._session.execute(
            select(UserRole).where(
                UserRole.user_id == user_id,
                UserRole.role_id == role.id,
                UserRole.scope_type.is_(None),
                UserRole.scope_id.is_(None),
            )
        )
        user_role = existing.scalar_one_or_none()
        if user_role is not None:
            return user_role

        user_role = UserRole(
            user_id=user_id,
            role_id=role.id,
            assigned_by=assigned_by,
        )
        self._session.add(user_role)
        await self._session.flush()
        return user_role

    async def get_role_keys_for_user(self, user_id: uuid.UUID) -> list[str]:
        result = await self._session.execute(
            select(Role.key)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user_id)
            .order_by(Role.key)
        )
        return list(result.scalars().all())

    async def get_permission_keys_for_user(self, user_id: uuid.UUID) -> list[str]:
        result = await self._session.execute(
            select(Permission.key)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(Role, Role.id == RolePermission.role_id)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user_id)
            .distinct()
            .order_by(Permission.key)
        )
        return list(result.scalars().all())

    async def user_has_permission(self, user_id: uuid.UUID, permission_key: str) -> bool:
        result = await self._session.execute(
            select(Permission.id)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(Role, Role.id == RolePermission.role_id)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user_id, Permission.key == permission_key)
            .limit(1)
        )
        return result.scalar_one_or_none() is not None
