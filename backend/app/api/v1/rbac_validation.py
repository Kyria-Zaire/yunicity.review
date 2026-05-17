"""
Endpoints techniques de validation RBAC (Sprint 1 / TICKET-104).

Ces routes prouvent allow/deny des guards avant les features métier.
Elles pourront être retirées ou déplacées (ex. namespace interne / recette only) plus tard.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user, require_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.rbac import (
    EffectivePermissionsResponse,
    InactiveAccessProbeResponse,
    PermissionCheckResponse,
)
from app.services.rbac_service import RbacService

router = APIRouter(prefix="/rbac", tags=["rbac-validation"])


@router.get("/me/permissions", response_model=EffectivePermissionsResponse)
async def get_my_permissions(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> EffectivePermissionsResponse:
    context = await RbacService(session).get_user_rbac_context(current_user.id)
    return EffectivePermissionsResponse(
        roles=list(context.roles),
        permissions=sorted(context.permissions),
    )


@router.get("/moderation/check", response_model=PermissionCheckResponse)
async def moderation_permission_check(
    _: Annotated[User, Depends(require_permission("moderation.read"))],
) -> PermissionCheckResponse:
    return PermissionCheckResponse(permission="moderation.read")


@router.get("/users/check", response_model=PermissionCheckResponse)
async def users_read_all_permission_check(
    _: Annotated[User, Depends(require_permission("users.read.all"))],
) -> PermissionCheckResponse:
    return PermissionCheckResponse(permission="users.read.all")


@router.get("/admin/check", response_model=PermissionCheckResponse)
async def system_admin_permission_check(
    _: Annotated[User, Depends(require_permission("system.admin"))],
) -> PermissionCheckResponse:
    return PermissionCheckResponse(permission="system.admin")


@router.post("/test/inactive-access", response_model=InactiveAccessProbeResponse)
async def inactive_access_probe(
    _: Annotated[User, Depends(require_authenticated_user)],
) -> InactiveAccessProbeResponse:
    """Compte inactif bloqué en amont par get_current_user (403 ACCOUNT_SUSPENDED)."""
    return InactiveAccessProbeResponse()
