"""Admin platform configuration snapshot — staff only (ADMIN-SETTINGS-01B)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_platform_config import AdminPlatformConfigResponse
from app.services.admin_platform_config_service import AdminPlatformConfigService

router = APIRouter(prefix="/admin/platform-config", tags=["admin-platform-config"])

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.get("", response_model=AdminPlatformConfigResponse)
async def get_admin_platform_config(
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminPlatformConfigResponse:
    return await AdminPlatformConfigService(session).get_snapshot(viewer=current_user)
