"""Post, like, comment, report routes (TICKET-402)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.dependencies import require_authenticated_user
from app.core.feed_constants import FEED_PAGE_SIZE_DEFAULT, FEED_PAGE_SIZE_MAX
from app.db.session import get_db
from app.models.user import User
from app.schemas.post import (
    CommentCreateRequest,
    CommentListResponse,
    CommentResponse,
    PostCreateRequest,
    PostMediaTypeLiteral,
    PostMediaUploadResponse,
    PostResponse,
    PostUpdateRequest,
    ReportCreateRequest,
)
from app.services.comment_service import CommentService
from app.services.like_service import LikeService
from app.services.post_service import PostService
from app.services.report_service import ReportService
from app.services.story_media_service import StoryMediaService

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("/media", response_model=PostMediaUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_post_media(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    file: Annotated[UploadFile, File()],
) -> PostMediaUploadResponse:
    settings = get_settings()
    url, media_type = await StoryMediaService(settings).upload(current_user, file)
    normalized_type: PostMediaTypeLiteral = "video" if media_type == "video" else "image"
    return PostMediaUploadResponse(url=url, media_type=normalized_type)


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    payload: PostCreateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PostResponse:
    return await PostService(session).create_post(current_user, payload)


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PostResponse:
    return await PostService(session).get_post(current_user, post_id)


@router.patch("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: uuid.UUID,
    payload: PostUpdateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PostResponse:
    return await PostService(session).update_post(current_user, post_id, payload)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await PostService(session).soft_delete_post(current_user, post_id)


@router.post("/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def like_post(
    post_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await LikeService(session).like_post(current_user.id, post_id)


@router.delete("/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_post(
    post_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await LikeService(session).unlike_post(current_user.id, post_id)


@router.get("/{post_id}/comments", response_model=CommentListResponse)
async def list_comments(
    post_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    cursor: str | None = None,
    limit: int = Query(default=FEED_PAGE_SIZE_DEFAULT, ge=1, le=FEED_PAGE_SIZE_MAX),
) -> CommentListResponse:
    return await CommentService(session).list_comments(
        current_user, post_id, cursor=cursor, limit=limit
    )


@router.post(
    "/{post_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_comment(
    post_id: uuid.UUID,
    payload: CommentCreateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> CommentResponse:
    return await CommentService(session).create_comment(current_user, post_id, payload)


@router.post("/{post_id}/report", status_code=status.HTTP_204_NO_CONTENT)
async def report_post(
    post_id: uuid.UUID,
    payload: ReportCreateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await ReportService(session).report_post(current_user, post_id, payload)
