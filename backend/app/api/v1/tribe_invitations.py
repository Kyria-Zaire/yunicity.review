"""Tribe invitation routes (TICKET-A.2 / A.5)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.tribe import (
    TribeInvitationAcceptRequest,
    TribeInvitationListResponse,
    TribeMemberResponse,
)
from app.services.tribe_service import TribeService

router = APIRouter(prefix="/tribe-invitations", tags=["tribe-invitations"])


@router.get("/me", response_model=TribeInvitationListResponse)
async def list_my_tribe_invitations(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> TribeInvitationListResponse:
    return await TribeService(session).list_my_pending_invitations(current_user)


@router.post("/{token}/accept", response_model=TribeMemberResponse)
async def accept_tribe_invitation(
    token: str,
    payload: TribeInvitationAcceptRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> TribeMemberResponse:
    return await TribeService(session).accept_invitation(
        current_user, token=token, charter_accepted=payload.charter_accepted
    )


@router.post("/me/{invitation_id}/accept", response_model=TribeMemberResponse)
async def accept_tribe_invitation_by_id(
    invitation_id: uuid.UUID,
    payload: TribeInvitationAcceptRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> TribeMemberResponse:
    return await TribeService(session).accept_invitation_by_id(
        current_user, invitation_id=invitation_id, charter_accepted=payload.charter_accepted
    )


@router.post("/me/{invitation_id}/decline", status_code=status.HTTP_204_NO_CONTENT)
async def decline_tribe_invitation(
    invitation_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await TribeService(session).decline_invitation(current_user, invitation_id=invitation_id)
