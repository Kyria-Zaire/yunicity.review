"""Admin activation waves — staff only (ADMIN-02C-B)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_activation_wave import (
    AdminActivationWaveDetailResponse,
    AdminActivationWaveListItem,
)
from app.services.admin_activation_wave_service import AdminActivationWaveService

router = APIRouter(prefix="/admin/activation-waves", tags=["admin-activation-waves"])

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.get("", response_model=list[AdminActivationWaveListItem])
async def list_admin_activation_waves(
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[AdminActivationWaveListItem]:
    _ = current_user
    return await AdminActivationWaveService(session).list_waves()


@router.get("/{wave_id}", response_model=AdminActivationWaveDetailResponse)
async def get_admin_activation_wave_detail(
    wave_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminActivationWaveDetailResponse:
    _ = current_user
    return await AdminActivationWaveService(session).get_wave_detail(wave_id)
