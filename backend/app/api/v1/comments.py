"""Comment routes (TICKET-402)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.db.session import get_db
from app.models.user import User
from app.services.comment_service import CommentService

router = APIRouter(prefix="/comments", tags=["comments"])


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await CommentService(session).soft_delete_comment(current_user, comment_id)
