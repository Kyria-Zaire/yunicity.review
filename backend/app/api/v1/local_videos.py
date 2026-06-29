"""Local Video API (FEATURE-CREATORS-V2 / C2-S1)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.dependencies import require_authenticated_user
from app.core.local_video_constants import (
    LOCAL_VIDEO_COMMENT_PAGE_DEFAULT,
    LOCAL_VIDEO_COMMENT_PAGE_MAX,
    LOCAL_VIDEO_DEFAULT_CITY,
)
from app.core.rate_limit import enforce_rate_limit
from app.db.session import get_db
from app.models.user import User
from app.schemas.local_video import (
    LocalVideoCommentCreateRequest,
    LocalVideoCommentListResponse,
    LocalVideoCommentResponse,
    LocalVideoFeedResponse,
    LocalVideoItem,
    LocalVideoLikeResponse,
    LocalVideoPublishAcceptedResponse,
    LocalVideoPublishRequest,
    LocalVideoReportCreateRequest,
    LocalVideoUploadInitRequest,
    LocalVideoUploadInitResponse,
)
from app.services.local_video_comment_service import LocalVideoCommentService
from app.services.local_video_feed_service import LocalVideoFeedQuery, LocalVideoFeedService
from app.services.local_video_like_service import LocalVideoLikeService
from app.services.local_video_report_service import LocalVideoReportService
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


@router.post(
    "",
    response_model=LocalVideoPublishAcceptedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def publish_local_video(
    payload: LocalVideoPublishRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> LocalVideoPublishAcceptedResponse:
    await enforce_rate_limit(
        publish_rate_limit_key(current_user.id),
        limit=PUBLISH_RATE_LIMIT,
        window_seconds=PUBLISH_RATE_WINDOW,
    )
    return await LocalVideoService(session, settings).publish(current_user.id, payload)


@router.get("/feed", response_model=LocalVideoFeedResponse)
async def list_local_video_feed(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default=LOCAL_VIDEO_DEFAULT_CITY, min_length=1, max_length=64),
    limit: int = Query(default=10, ge=1, le=20),
    cursor: str | None = Query(default=None),
    latitude: float | None = Query(default=None, ge=-90, le=90),
    longitude: float | None = Query(default=None, ge=-180, le=180),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
) -> LocalVideoFeedResponse:
    resolved_latitude = latitude if latitude is not None else lat
    resolved_longitude = longitude if longitude is not None else lng
    return await LocalVideoFeedService(session).list_feed(
        LocalVideoFeedQuery(
            city=city,
            limit=limit,
            cursor=cursor,
            latitude=resolved_latitude,
            longitude=resolved_longitude,
            viewer_user_id=current_user.id,
        )
    )


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_local_video_comment(
    comment_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await LocalVideoCommentService(session).soft_delete_comment(current_user, comment_id)


@router.post("/{video_id}/like", response_model=LocalVideoLikeResponse)
async def like_local_video(
    video_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> LocalVideoLikeResponse:
    return await LocalVideoLikeService(session).like_video(current_user.id, video_id)


@router.delete("/{video_id}/like", response_model=LocalVideoLikeResponse)
async def unlike_local_video(
    video_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> LocalVideoLikeResponse:
    return await LocalVideoLikeService(session).unlike_video(current_user.id, video_id)


@router.get("/{video_id}/comments", response_model=LocalVideoCommentListResponse)
async def list_local_video_comments(
    video_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    cursor: str | None = Query(default=None),
    limit: int = Query(
        default=LOCAL_VIDEO_COMMENT_PAGE_DEFAULT,
        ge=1,
        le=LOCAL_VIDEO_COMMENT_PAGE_MAX,
    ),
) -> LocalVideoCommentListResponse:
    del current_user
    return await LocalVideoCommentService(session).list_comments(
        video_id,
        cursor=cursor,
        limit=limit,
    )


@router.post(
    "/{video_id}/comments",
    response_model=LocalVideoCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_local_video_comment(
    video_id: uuid.UUID,
    payload: LocalVideoCommentCreateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> LocalVideoCommentResponse:
    return await LocalVideoCommentService(session).create_comment(
        current_user,
        video_id,
        payload,
    )


@router.post("/{video_id}/report", status_code=status.HTTP_204_NO_CONTENT)
async def report_local_video(
    video_id: uuid.UUID,
    payload: LocalVideoReportCreateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await LocalVideoReportService(session).report_video(current_user, video_id, payload)


@router.get("/{video_id}", response_model=LocalVideoItem)
async def get_local_video(
    video_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> LocalVideoItem:
    return await LocalVideoService(session, settings).get_video(current_user.id, video_id)
