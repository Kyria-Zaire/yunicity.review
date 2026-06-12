"""Local Video API (FEATURE-CREATORS-V2 / C2-S1)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.dependencies import require_authenticated_user
from app.core.rate_limit import enforce_rate_limit
from app.db.session import get_db
from app.models.user import User
from app.schemas.local_video import (
    LocalVideoItem,
    LocalVideoPublishRequest,
    LocalVideoUploadInitRequest,
    LocalVideoUploadInitResponse,
)
from app.services.local_video_service import (
    PUBLISH_RATE_LIMIT,
    PUBLISH_RATE_WINDOW,
    UPLOAD_INIT_RATE_LIMIT,
    UPLOAD_INIT_RATE_WINDOW,
    LocalVideoService,
    publish_rate_limit_key,
    upload_rate_limit_key,
)

router = APIRouter(prefix="/local-videos", tags=["local-videos"])


@router.post(
    "/upload-init",
    response_model=LocalVideoUploadInitResponse,
    status_code=status.HTTP_201_CREATED,
)
async def init_local_video_upload(
    payload: LocalVideoUploadInitRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> LocalVideoUploadInitResponse:
    await enforce_rate_limit(
        upload_rate_limit_key(current_user.id),
        limit=UPLOAD_INIT_RATE_LIMIT,
        window_seconds=UPLOAD_INIT_RATE_WINDOW,
    )
    return await LocalVideoService(session, settings).init_upload(current_user.id, payload)


@router.put("/uploads/{upload_id}/binary", status_code=status.HTTP_204_NO_CONTENT)
async def upload_local_video_binary(
    upload_id: uuid.UUID,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> None:
    """Dev/CI filesystem fallback — direct PUT replacing R2 presigned upload."""
    from app.core.errors import AppError

    if settings.local_video_storage_backend != "filesystem":
        raise AppError(
            status_code=404,
            code="LOCAL_VIDEO_BINARY_ENDPOINT_UNAVAILABLE",
            detail="Endpoint d'upload binaire indisponible.",
        )
    body = await request.body()
    await LocalVideoService(session, settings).store_binary_upload(upload_id, body)


@router.post("", response_model=LocalVideoItem, status_code=status.HTTP_201_CREATED)
async def publish_local_video(
    payload: LocalVideoPublishRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> LocalVideoItem:
    await enforce_rate_limit(
        publish_rate_limit_key(current_user.id),
        limit=PUBLISH_RATE_LIMIT,
        window_seconds=PUBLISH_RATE_WINDOW,
    )
    return await LocalVideoService(session, settings).publish(current_user.id, payload)


@router.get("/{video_id}", response_model=LocalVideoItem)
async def get_local_video(
    video_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> LocalVideoItem:
    return await LocalVideoService(session, settings).get_video(current_user.id, video_id)
