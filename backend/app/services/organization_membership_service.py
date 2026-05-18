"""Organization membership authorization — scoped checks only."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.organization_constants import OrganizationMemberRole
from app.models.organization import OrganizationMember
from app.repositories.organization_repository import OrganizationRepository

_ADMIN_ROLES = frozenset({OrganizationMemberRole.OWNER, OrganizationMemberRole.ADMIN})
_UPDATE_ROLES = _ADMIN_ROLES


class OrganizationMembershipService:
    def __init__(self, session: AsyncSession) -> None:
        self._orgs = OrganizationRepository(session)

    async def get_active_membership(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> OrganizationMember | None:
        return await self._orgs.get_active_membership(
            organization_id=organization_id,
            user_id=user_id,
        )

    async def require_active_member(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> OrganizationMember:
        member = await self.get_active_membership(
            organization_id=organization_id,
            user_id=user_id,
        )
        if member is None:
            raise AppError(
                status_code=403,
                code="FORBIDDEN",
                detail="Accès à cette organization refusé.",
            )
        return member

    async def require_roles(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        allowed_roles: frozenset[OrganizationMemberRole],
    ) -> OrganizationMember:
        member = await self.require_active_member(
            organization_id=organization_id,
            user_id=user_id,
        )
        if member.role not in allowed_roles:
            raise AppError(
                status_code=403,
                code="FORBIDDEN",
                detail="Rôle insuffisant pour cette action.",
            )
        return member

    async def require_admin_or_owner(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> OrganizationMember:
        return await self.require_roles(
            organization_id=organization_id,
            user_id=user_id,
            allowed_roles=_ADMIN_ROLES,
        )

    def is_admin_or_owner(self, member: OrganizationMember) -> bool:
        return member.role in _ADMIN_ROLES
