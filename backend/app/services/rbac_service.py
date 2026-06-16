"""RBAC read model — effective roles/permissions with optional request-scope cache."""

from __future__ import annotations

import uuid
from contextvars import ContextVar
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.rbac_repository import RbacRepository

_permission_cache_var: ContextVar[dict[uuid.UUID, frozenset[str]] | None] = ContextVar(
    "rbac_permission_cache",
    default=None,
)
_role_cache_var: ContextVar[dict[uuid.UUID, tuple[str, ...]] | None] = ContextVar(
    "rbac_role_cache",
    default=None,
)


@dataclass(frozen=True)
class UserRbacContext:
    user_id: uuid.UUID
    roles: tuple[str, ...]
    permissions: frozenset[str]


class RbacService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = RbacRepository(session)

    async def get_user_rbac_context(self, user_id: uuid.UUID) -> UserRbacContext:
        roles = tuple(await self._get_role_keys_cached(user_id))
        permissions = await self._get_permission_keys_cached(user_id)
        return UserRbacContext(user_id=user_id, roles=roles, permissions=permissions)

    async def get_user_rbac_contexts(
        self,
        user_ids: list[uuid.UUID],
    ) -> dict[uuid.UUID, UserRbacContext]:
        """Batch RBAC contexts for many users with 2 queries instead of 2×N.

        Seeds the request-scoped caches so any later single-user lookup in the
        same request stays consistent and cheap (ADMIN-PERF-02A).
        """
        unique_ids = list(dict.fromkeys(user_ids))
        if not unique_ids:
            return {}
        roles_map = await self._repo.get_role_keys_for_users(unique_ids)
        perms_map = await self._repo.get_permission_keys_for_users(unique_ids)

        role_cache = dict(_role_cache_var.get() or {})
        perm_cache = dict(_permission_cache_var.get() or {})
        contexts: dict[uuid.UUID, UserRbacContext] = {}
        for user_id in unique_ids:
            roles = tuple(roles_map.get(user_id, []))
            permissions = frozenset(perms_map.get(user_id, []))
            contexts[user_id] = UserRbacContext(
                user_id=user_id, roles=roles, permissions=permissions
            )
            role_cache[user_id] = roles
            perm_cache[user_id] = permissions
        _role_cache_var.set(role_cache)
        _permission_cache_var.set(perm_cache)
        return contexts

    async def user_has_permission(self, user_id: uuid.UUID, permission_key: str) -> bool:
        permissions = await self._get_permission_keys_cached(user_id)
        return permission_key in permissions

    async def assign_role_to_user(
        self,
        user_id: uuid.UUID,
        role_key: str,
        *,
        assigned_by: uuid.UUID | None = None,
    ) -> None:
        await self._repo.assign_role_to_user(user_id, role_key, assigned_by=assigned_by)
        self._invalidate_user_cache(user_id)

    async def remove_role_from_user(
        self,
        user_id: uuid.UUID,
        role_key: str,
    ) -> bool:
        removed = await self._repo.remove_role_from_user(user_id, role_key)
        if removed:
            self._invalidate_user_cache(user_id)
        return removed

    async def _get_role_keys_cached(self, user_id: uuid.UUID) -> list[str]:
        cache = _role_cache_var.get() or {}
        if user_id in cache:
            return list(cache[user_id])
        roles = await self._repo.get_role_keys_for_user(user_id)
        cache = dict(cache)
        cache[user_id] = tuple(roles)
        _role_cache_var.set(cache)
        return roles

    async def _get_permission_keys_cached(self, user_id: uuid.UUID) -> frozenset[str]:
        cache = _permission_cache_var.get() or {}
        if user_id in cache:
            return cache[user_id]
        permissions = frozenset(await self._repo.get_permission_keys_for_user(user_id))
        cache = dict(cache)
        cache[user_id] = permissions
        _permission_cache_var.set(cache)
        return permissions

    @staticmethod
    def _invalidate_user_cache(user_id: uuid.UUID) -> None:
        perm_cache = dict(_permission_cache_var.get() or {})
        perm_cache.pop(user_id, None)
        _permission_cache_var.set(perm_cache)
        role_cache = dict(_role_cache_var.get() or {})
        role_cache.pop(user_id, None)
        _role_cache_var.set(role_cache)
