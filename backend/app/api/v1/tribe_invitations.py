"""Tribe invitation accept route (TICKET-A.2)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.tribe import TribeInvitationAcceptRequest, TribeMemberResponse
from app.services.tribe_service import TribeService

router = APIRouter(prefix="/tribe-invitations", tags=["tribe-invitations"])


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
