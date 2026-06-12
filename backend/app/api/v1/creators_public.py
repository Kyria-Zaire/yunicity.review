"""Public creator profile routes (FEATURE-CREATORS-V1 C1-03)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.creator_public_constants import (
    CREATOR_PROFILE_CONTENTS_LIMIT_DEFAULT,
    CREATOR_PROFILE_CONTENTS_LIMIT_MAX,
)
from app.db.session import get_db
from app.schemas.creator_public import CreatorPublicProfileResponse
from app.services.public_creator_profile_service import PublicCreatorProfileService

router = APIRouter(prefix="/public/creators", tags=["creators-public"])


@router.get("/{creator_id}", response_model=CreatorPublicProfileResponse)
async def get_public_creator_profile(
    creator_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(
        default=CREATOR_PROFILE_CONTENTS_LIMIT_DEFAULT,
        ge=1,
        le=CREATOR_PROFILE_CONTENTS_LIMIT_MAX,
    ),
    offset: int = Query(default=0, ge=0),
) -> CreatorPublicProfileResponse:
    return await PublicCreatorProfileService(session).get_public_profile(
        creator_id,
        limit=limit,
        offset=offset,
    )
