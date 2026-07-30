"""Tribe API schemas (TICKET-A.2)."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.core.tribe_constants import (
    TRIBE_DESCRIPTION_MAX_LENGTH,
    TRIBE_LIST_PAGE_SIZE_DEFAULT,
    TRIBE_LIST_PAGE_SIZE_MAX,
    TRIBE_NAME_MAX_LENGTH,
    TRIBE_POST_PAGE_SIZE_MAX,
    TRIBE_SLUG_MAX_LENGTH,
)
from app.schemas.post import PostResponse


class TribeResponse(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    description: str
    city: str
    category: str
    visibility: str
    persistence_kind: str
    cover_image_url: str | None
    is_featured: bool
    member_limit: int
    active_member_count: int
    is_archived: bool
    viewer_is_member: bool = False
    viewer_role: str | None = None
    created_at: datetime
    updated_at: datetime


class TribeListResponse(BaseModel):
    items: list[TribeResponse]
    total: int
    page: int
    page_size: int


class TribeCreateRequest(BaseModel):
    slug: str = Field(min_length=2, max_length=TRIBE_SLUG_MAX_LENGTH)
    name: str = Field(min_length=2, max_length=TRIBE_NAME_MAX_LENGTH)
    description: str = Field(min_length=10, max_length=TRIBE_DESCRIPTION_MAX_LENGTH)
    city: str = Field(min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=32)
    visibility: str = Field(min_length=1, max_length=24)
    persistence_kind: str = Field(default="persistent", max_length=24)
    cover_image_url: str | None = Field(default=None, max_length=500)
    organization_id: uuid.UUID | None = None
    is_featured: bool = False
    member_limit: int = Field(default=150, ge=10, le=150)


class TribeUserCreateRequest(BaseModel):
    """Citizen tribe creation — isomorphe au TribeUserCreatePayload du wizard front.

    Volontairement SANS slug (dérivé serveur-side du nom) ni champ privilégié
    (organization_id / is_featured / member_limit / persistence_kind) : un citoyen ne peut
    pas les fixer (anti mass-assignment). Le créateur devient owner automatiquement.
    """

    name: str = Field(min_length=2, max_length=TRIBE_NAME_MAX_LENGTH)
    description: str = Field(min_length=10, max_length=TRIBE_DESCRIPTION_MAX_LENGTH)
    city: str = Field(min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=32)
    visibility: str = Field(min_length=1, max_length=24)
    cover_image_url: str | None = Field(default=None, max_length=500)
    charter_accepted: bool = False


class TribeUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=TRIBE_NAME_MAX_LENGTH)
    description: str | None = Field(
        default=None, min_length=10, max_length=TRIBE_DESCRIPTION_MAX_LENGTH
    )
    cover_image_url: str | None = Field(default=None, max_length=500)
    is_featured: bool | None = None
    member_limit: int | None = Field(default=None, ge=10, le=150)


class TribeMemberResponse(BaseModel):
    user_id: uuid.UUID
    role: str
    joined_at: datetime
    tribe_slug: str | None = None
    tribe_city: str | None = None
    tribe_name: str | None = None


class TribeInvitationCreateRequest(BaseModel):
    invitee_user_id: uuid.UUID | None = None


class TribeInvitationPendingItem(BaseModel):
    id: uuid.UUID
    tribe_slug: str
    tribe_name: str
    tribe_city: str
    expires_at: datetime


class TribeInvitationListResponse(BaseModel):
    items: list[TribeInvitationPendingItem]


class TribeMemberListResponse(BaseModel):
    items: list[TribeMemberResponse]
    total: int
    page: int
    page_size: int


class TribeMemberRoleUpdateRequest(BaseModel):
    role: str = Field(description="member or moderator")


class TribeJoinRequest(BaseModel):
    charter_accepted: bool = Field(description="Must be true to join")


class TribePostCreateRequest(BaseModel):
    body: str = Field(min_length=1, max_length=5000)
    media_url: str | None = Field(default=None, max_length=500)


class TribePostListResponse(BaseModel):
    items: list[PostResponse]
    next_cursor: str | None = None


class TribeInvitationCreateResponse(BaseModel):
    token: str
    expires_at: datetime


class TribeInvitationAcceptRequest(BaseModel):
    charter_accepted: bool = True


class TribeListParams(BaseModel):
    city: str
    featured_only: bool = False
    page: int = 1
    page_size: int = TRIBE_LIST_PAGE_SIZE_DEFAULT


def clamp_list_page_size(page_size: int) -> int:
    return min(max(page_size, 1), TRIBE_LIST_PAGE_SIZE_MAX)


def clamp_post_page_size(limit: int) -> int:
    return min(max(limit, 1), TRIBE_POST_PAGE_SIZE_MAX)
