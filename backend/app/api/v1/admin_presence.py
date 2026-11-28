"""Staff-only presence administration routes (PASSPORT-PRESENCE-01, lot 01A).

Only mounted when ``PRESENCE_VALIDATION_ENABLED`` is true at startup; the router-level
flag dependency is a second, runtime barrier evaluated before authentication.
"""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.core.presence_constants import (
    PRESENCE_ADMIN_LIST_PAGE_SIZE_DEFAULT,
    PRESENCE_ADMIN_LIST_PAGE_SIZE_MAX,
    PRESENCE_STAFF_PERMISSIONS,
)
from app.core.presence_feature import require_presence_validation_enabled
from app.db.session import get_db
from app.models.user import User
from app.schemas.presence_admin import (
    PresenceAgentAssignmentResponse,
    PresenceAgentAssignmentSetRequest,
    PresenceCampaignCreateRequest,
    PresenceCampaignListResponse,
    PresenceCampaignResponse,
    PresenceCampaignStatusPatchRequest,
    PresenceCampaignStatusValue,
    PresenceRegistrationResponse,
    PresenceRegistrationSetRequest,
    PresenceUserTestFlagRequest,
    PresenceUserTestFlagResponse,
)
from app.services.presence_admin_service import PresenceAdminService

router = APIRouter(
    prefix="/admin/presence",
    tags=["admin-presence"],
    dependencies=[Depends(require_presence_validation_enabled)],
)

_staff_guard = require_any_permission(*PRESENCE_STAFF_PERMISSIONS)


@router.post("/campaigns", response_model=PresenceCampaignResponse, status_code=201)
async def create_presence_campaign(
    payload: PresenceCampaignCreateRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PresenceCampaignResponse:
    return await PresenceAdminService(session).create_campaign(current_user, payload)


@router.get("/campaigns", response_model=PresenceCampaignListResponse)
async def list_presence_campaigns(
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    status: Annotated[PresenceCampaignStatusValue | None, Query()] = None,
    organization_id: Annotated[uuid.UUID | None, Query()] = None,
    is_test: Annotated[bool | None, Query()] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=PRESENCE_ADMIN_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=PRESENCE_ADMIN_LIST_PAGE_SIZE_MAX,
    ),
) -> PresenceCampaignListResponse:
    _ = current_user
    return await PresenceAdminService(session).list_campaigns(
        status=status,
        organization_id=organization_id,
        is_test=is_test,
        page=page,
        page_size=page_size,
    )


@router.patch("/campaigns/{campaign_id}/status", response_model=PresenceCampaignResponse)
async def change_presence_campaign_status(
    campaign_id: uuid.UUID,
    payload: PresenceCampaignStatusPatchRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PresenceCampaignResponse:
    return await PresenceAdminService(session).change_campaign_status(
        campaign_id, current_user, payload
    )


@router.put(
    "/campaigns/{campaign_id}/registrations/{user_id}",
    response_model=PresenceRegistrationResponse,
)
async def set_presence_registration(
    campaign_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: PresenceRegistrationSetRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PresenceRegistrationResponse:
    return await PresenceAdminService(session).set_registration(
        campaign_id, user_id, current_user, payload
    )


@router.put(
    "/campaigns/{campaign_id}/agents/{user_id}",
    response_model=PresenceAgentAssignmentResponse,
)
async def set_presence_agent_assignment(
    campaign_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: PresenceAgentAssignmentSetRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PresenceAgentAssignmentResponse:
    return await PresenceAdminService(session).set_agent_assignment(
        campaign_id, user_id, current_user, payload
    )


@router.put("/users/{user_id}/test-flag", response_model=PresenceUserTestFlagResponse)
async def set_presence_user_test_flag(
    user_id: uuid.UUID,
    payload: PresenceUserTestFlagRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PresenceUserTestFlagResponse:
    return await PresenceAdminService(session).set_user_test_flag(user_id, current_user, payload)
