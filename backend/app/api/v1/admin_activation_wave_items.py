"""Admin activation wave item updates — staff only (ADMIN-02C-B)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_activation_wave import (
    AdminActivationWaveItemPatchRequest,
    AdminActivationWaveItemResponse,
)
from app.services.admin_activation_wave_service import AdminActivationWaveService

router = APIRouter(prefix="/admin/activation-wave-items", tags=["admin-activation-wave-items"])

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.patch("/{item_id}", response_model=AdminActivationWaveItemResponse)
async def patch_admin_activation_wave_item(
    item_id: uuid.UUID,
    payload: AdminActivationWaveItemPatchRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminActivationWaveItemResponse:
    _ = current_user
    return await AdminActivationWaveService(session).patch_item(item_id, payload)
