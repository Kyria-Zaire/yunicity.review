"""Admin staff management service (ADMIN-08B)."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.bootstrap_constants import SYSTEM_ACCOUNT_PROTECTED_MSG
from app.core.errors import AppError
from app.core.staff_admin_constants import (
    ASSIGNABLE_STAFF_ROLE_KEYS,
    STAFF_ADMIN_ACTION_LIST_PAGE_SIZE_MAX,
    STAFF_ADMIN_LIST_PAGE_SIZE_MAX,
    STAFF_ADMIN_REASON_MAX_LENGTH,
    STAFF_PLATFORM_ROLE_KEYS,
    SYSTEM_ADMIN_PERMISSION,
    StaffAdminActionType,
)
from app.models.user import User
from app.repositories.admin_staff_repository import AdminStaffActionListRow, AdminStaffRepository
from app.schemas.admin_staff import (
    AdminStaffActionActorSummary,
    AdminStaffActionListItem,
    AdminStaffActionListResponse,
    AdminStaffDetailResponse,
    AdminStaffListItem,
    AdminStaffListResponse,
)
from app.services.rbac_service import RbacService


class AdminStaffService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = AdminStaffRepository(session)
        self._rbac = RbacService(session)

    async def list_staff(
        self,
        *,
        role: str | None,
        is_active: bool | None,
        page: int,
        page_size: int,
    ) -> AdminStaffListResponse:
        normalized_role = self._normalize_role_filter(role)
        resolved_page_size = min(max(page_size, 1), STAFF_ADMIN_LIST_PAGE_SIZE_MAX)
        resolved_page = max(page, 1)
        users, total = await self._repo.list_staff_users(
            role=normalized_role,
            is_active=is_active,
            page=resolved_page,
            page_size=resolved_page_size,
        )
        items: list[AdminStaffListItem] = []
        for user in users:
            items.append(await self._to_list_item(user))
        return AdminStaffListResponse(
            items=items,
            total=total,
            page=resolved_page,
            page_size=resolved_page_size,
        )

    async def get_staff_detail(self, user_id: uuid.UUID) -> AdminStaffDetailResponse:
        user = await self._get_staff_user(user_id)
        return await self._to_detail(user)

    async def assign_role(
        self,
        actor: User,
        user_id: uuid.UUID,
        *,
        role_key: str,
        reason: str | None,
    ) -> AdminStaffDetailResponse:
        self._forbid_self_modify(actor.id, user_id)
        normalized_role = self._normalize_assignable_role(role_key)
        normalized_reason = self._normalize_reason(reason)
        target = await self._get_existing_user(user_id)

        previous_roles = await self._rbac.get_user_rbac_context(user_id)
        if normalized_role in previous_roles.roles:
            raise AppError(
                status_code=409,
                code="STAFF_ROLE_ALREADY_ASSIGNED",
                detail="Ce rôle est déjà assigné à l'utilisateur.",
            )

        await self._rbac.assign_role_to_user(
            user_id,
            normalized_role,
            assigned_by=actor.id,
        )
        new_roles = await self._rbac.get_user_rbac_context(user_id)

        await self._repo.append_admin_action(
            target_user_id=user_id,
            actor_user_id=actor.id,
            action=StaffAdminActionType.ASSIGN_ROLE.value,
            previous_roles=list(previous_roles.roles),
            new_roles=list(new_roles.roles),
            reason=normalized_reason,
            metadata={"role": normalized_role},
        )
        await self._session.commit()
        await self._session.refresh(target)
        return await self._to_detail(target)

    async def revoke_role(
        self,
        actor: User,
        user_id: uuid.UUID,
        *,
        role_key: str,
        reason: str | None = None,
    ) -> AdminStaffDetailResponse:
        self._forbid_self_modify(actor.id, user_id)
        await self._forbid_system_account_modification(user_id)
        normalized_role = self._normalize_assignable_role(role_key)
        normalized_reason = self._normalize_reason(reason)
        target = await self._get_existing_user(user_id)

        previous_roles = await self._rbac.get_user_rbac_context(user_id)
        if normalized_role not in previous_roles.roles:
            raise AppError(
                status_code=404,
                code="STAFF_ROLE_NOT_ASSIGNED",
                detail="L'utilisateur ne possède pas ce rôle.",
            )

        await self._ensure_not_last_system_admin(
            target_user_id=user_id,
            roles_after_revoke=[role for role in previous_roles.roles if role != normalized_role],
            is_active_after=target.is_active,
        )

        removed = await self._rbac.remove_role_from_user(user_id, normalized_role)
        if not removed:
            raise AppError(
                status_code=404,
                code="STAFF_ROLE_NOT_ASSIGNED",
                detail="L'utilisateur ne possède pas ce rôle.",
            )

        new_roles = await self._rbac.get_user_rbac_context(user_id)
        await self._repo.append_admin_action(
            target_user_id=user_id,
            actor_user_id=actor.id,
            action=StaffAdminActionType.REVOKE_ROLE.value,
            previous_roles=list(previous_roles.roles),
            new_roles=list(new_roles.roles),
            reason=normalized_reason,
            metadata={"role": normalized_role},
        )
        await self._session.commit()
        await self._session.refresh(target)
        return await self._to_detail(target)

    async def suspend_user(
        self,
        actor: User,
        user_id: uuid.UUID,
        *,
        reason: str | None,
    ) -> AdminStaffDetailResponse:
        self._forbid_self_modify(actor.id, user_id)
        await self._forbid_system_account_modification(user_id)
        normalized_reason = self._normalize_reason(reason)
        target = await self._get_existing_user(user_id)

        if not target.is_active:
            raise AppError(
                status_code=409,
                code="STAFF_ALREADY_SUSPENDED",
                detail="Ce compte est déjà suspendu.",
            )

        previous_roles = await self._rbac.get_user_rbac_context(user_id)
        await self._ensure_not_last_system_admin(
            target_user_id=user_id,
            roles_after_revoke=list(previous_roles.roles),
            is_active_after=False,
        )

        target.is_active = False
        await self._repo.append_admin_action(
            target_user_id=user_id,
            actor_user_id=actor.id,
            action=StaffAdminActionType.SUSPEND.value,
            previous_roles=list(previous_roles.roles),
            new_roles=list(previous_roles.roles),
            reason=normalized_reason,
        )
        await self._session.commit()
        await self._session.refresh(target)
        return await self._to_detail(target)

    async def reactivate_user(
        self,
        actor: User,
        user_id: uuid.UUID,
        *,
        reason: str | None,
    ) -> AdminStaffDetailResponse:
        self._forbid_self_modify(actor.id, user_id)
        normalized_reason = self._normalize_reason(reason)
        target = await self._get_existing_user(user_id)

        if target.is_active:
            raise AppError(
                status_code=409,
                code="STAFF_ALREADY_ACTIVE",
                detail="Ce compte est déjà actif.",
            )

        previous_roles = await self._rbac.get_user_rbac_context(user_id)
        target.is_active = True
        await self._repo.append_admin_action(
            target_user_id=user_id,
            actor_user_id=actor.id,
            action=StaffAdminActionType.REACTIVATE.value,
            previous_roles=list(previous_roles.roles),
            new_roles=list(previous_roles.roles),
            reason=normalized_reason,
        )
        await self._session.commit()
        await self._session.refresh(target)
        return await self._to_detail(target)

    async def list_staff_actions(
        self,
        user_id: uuid.UUID,
        *,
        page: int,
        page_size: int,
    ) -> AdminStaffActionListResponse:
        if not await self._repo.user_has_platform_staff_role(user_id):
            user = await self._repo.get_user_by_id(user_id)
            if user is None:
                raise AppError(
                    status_code=404,
                    code="STAFF_USER_NOT_FOUND",
                    detail="Utilisateur staff introuvable.",
                )
            raise AppError(
                status_code=404,
                code="STAFF_USER_NOT_FOUND",
                detail="Utilisateur staff introuvable.",
            )

        resolved_page_size = min(max(page_size, 1), STAFF_ADMIN_ACTION_LIST_PAGE_SIZE_MAX)
        resolved_page = max(page, 1)
        rows, total = await self._repo.list_admin_actions(
            user_id,
            page=resolved_page,
            page_size=resolved_page_size,
        )
        return AdminStaffActionListResponse(
            items=[self._to_action_item(row) for row in rows],
            total=total,
            page=resolved_page,
            page_size=resolved_page_size,
        )

    async def _get_staff_user(self, user_id: uuid.UUID) -> User:
        user = await self._get_existing_user(user_id)
        if not await self._repo.user_has_platform_staff_role(user_id):
            raise AppError(
                status_code=404,
                code="STAFF_USER_NOT_FOUND",
                detail="Utilisateur staff introuvable.",
            )
        return user

    async def _get_existing_user(self, user_id: uuid.UUID) -> User:
        user = await self._repo.get_user_by_id(user_id)
        if user is None:
            raise AppError(
                status_code=404,
                code="STAFF_USER_NOT_FOUND",
                detail="Utilisateur introuvable.",
            )
        return user

    async def _to_list_item(self, user: User) -> AdminStaffListItem:
        context = await self._rbac.get_user_rbac_context(user.id)
        return AdminStaffListItem(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            roles=list(context.roles),
            permissions=sorted(context.permissions),
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    async def _to_detail(self, user: User) -> AdminStaffDetailResponse:
        context = await self._rbac.get_user_rbac_context(user.id)
        return AdminStaffDetailResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            city=user.city,
            is_active=user.is_active,
            is_verified=user.is_verified,
            roles=list(context.roles),
            permissions=sorted(context.permissions),
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    @classmethod
    def _to_action_item(cls, row: AdminStaffActionListRow) -> AdminStaffActionListItem:
        actor_summary: AdminStaffActionActorSummary | None = None
        if row.actor is not None:
            actor_summary = AdminStaffActionActorSummary(
                id=row.actor.id,
                email=row.actor.email,
                display_name=cls._user_display_name(row.actor, row.actor_profile),
            )
        return AdminStaffActionListItem(
            action=row.action.action,
            previous_roles=row.action.previous_roles,
            new_roles=row.action.new_roles,
            reason=row.action.reason,
            actor_user=actor_summary,
            created_at=row.action.created_at,
        )

    async def _forbid_system_account_modification(self, user_id: uuid.UUID) -> None:
        user = await self._repo.get_user_by_id(user_id)
        if user is not None and user.is_system_account:
            raise AppError(
                status_code=409,
                code="STAFF_SYSTEM_ACCOUNT_PROTECTED",
                detail=SYSTEM_ACCOUNT_PROTECTED_MSG,
            )

    async def _ensure_not_last_system_admin(
        self,
        *,
        target_user_id: uuid.UUID,
        roles_after_revoke: list[str],
        is_active_after: bool,
    ) -> None:
        target_has_system_admin = await self._repo.user_has_permission(
            target_user_id,
            SYSTEM_ADMIN_PERMISSION,
        )
        if not target_has_system_admin:
            return

        will_retain_system_admin = (
            is_active_after and "SUPER_ADMIN" in roles_after_revoke
        )
        if will_retain_system_admin:
            return

        active_system_admins = await self._repo.count_active_users_with_permission(
            SYSTEM_ADMIN_PERMISSION,
        )
        if active_system_admins <= 1:
            raise AppError(
                status_code=409,
                code="STAFF_LAST_SYSTEM_ADMIN",
                detail="Impossible de retirer le dernier super administrateur actif.",
            )

    @staticmethod
    def _forbid_self_modify(actor_id: uuid.UUID, target_id: uuid.UUID) -> None:
        if actor_id == target_id:
            raise AppError(
                status_code=403,
                code="STAFF_SELF_MODIFY_FORBIDDEN",
                detail="Vous ne pouvez pas modifier votre propre accès staff.",
            )

    @staticmethod
    def _normalize_role_filter(role: str | None) -> str | None:
        if role is None or not role.strip():
            return None
        normalized = role.strip().upper()
        if normalized not in STAFF_PLATFORM_ROLE_KEYS:
            raise AppError(
                status_code=422,
                code="STAFF_ROLE_INVALID",
                detail="Rôle staff invalide.",
            )
        return normalized

    @staticmethod
    def _normalize_assignable_role(role_key: str) -> str:
        normalized = role_key.strip().upper()
        if normalized not in ASSIGNABLE_STAFF_ROLE_KEYS:
            raise AppError(
                status_code=422,
                code="STAFF_ROLE_INVALID",
                detail="Rôle invalide.",
            )
        return normalized

    @staticmethod
    def _normalize_reason(reason: str | None) -> str | None:
        if reason is None:
            return None
        trimmed = reason.strip()
        if not trimmed:
            return None
        if len(trimmed) > STAFF_ADMIN_REASON_MAX_LENGTH:
            raise AppError(
                status_code=422,
                code="STAFF_REASON_TOO_LONG",
                detail="La note ne peut pas dépasser 1000 caractères.",
            )
        return trimmed

    @staticmethod
    def _user_display_name(user: User, profile: object | None) -> str | None:
        display_name = getattr(profile, "display_name", None) if profile is not None else None
        if isinstance(display_name, str) and display_name.strip():
            return display_name.strip()
        if user.full_name.strip():
            return user.full_name.strip()
        return None
