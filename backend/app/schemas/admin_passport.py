"""Admin passport ops read schemas (ADMIN-03A)."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.passport_admin_constants import (
    ADMIN_PASSPORT_REASON_MAX_LENGTH,
    ADMIN_PASSPORT_REASON_MIN_LENGTH,
)
from app.core.passport_constants import OfferRedemptionStatus, PassportStampSource, PassportTierCode
from app.schemas.admin_cockpit import DEFAULT_COCKPIT_CITY

ADMIN_PASSPORT_LIST_PAGE_SIZE_DEFAULT = 20
ADMIN_PASSPORT_LIST_PAGE_SIZE_MAX = 100
ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_DEFAULT = 20
ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_MAX = 50

DEFAULT_ADMIN_PASSPORTS_CITY = DEFAULT_COCKPIT_CITY

AdminStaffPassportStatus = Literal["active", "suspended"]


class AdminPassportSearchMode(StrEnum):
    EMAIL = "email"
    PASSPORT_NUMBER = "passport_number"
    DISPLAY_NAME = "display_name"
    QR_FRAGMENT = "qr_fragment"


class AdminPassportListUser(BaseModel):
    id: UUID
    email: str
    display_name: str | None = None


class AdminPassportListItem(BaseModel):
    id: UUID
    passport_number: str
    city: str
    status: AdminStaffPassportStatus
    tier_code: PassportTierCode
    user: AdminPassportListUser
    stamps_count: int = Field(ge=0)
    redemptions_count: int = Field(ge=0)
    activated_at: datetime | None = None
    suspended_at: datetime | None = None
    created_at: datetime


class AdminPassportListResponse(BaseModel):
    items: list[AdminPassportListItem]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=ADMIN_PASSPORT_LIST_PAGE_SIZE_MAX)


class AdminPassportTierDetail(BaseModel):
    code: PassportTierCode
    label: str


class AdminPassportDetailUser(BaseModel):
    id: UUID
    email: str
    display_name: str | None = None
    is_active: bool


class AdminPassportDetailStats(BaseModel):
    stamps_total: int = Field(ge=0)
    redemptions_total: int = Field(ge=0)
    redemptions_completed: int = Field(ge=0)


class AdminPassportStatusPatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: AdminStaffPassportStatus
    reason: str = Field(
        min_length=ADMIN_PASSPORT_REASON_MIN_LENGTH,
        max_length=ADMIN_PASSPORT_REASON_MAX_LENGTH,
    )


class AdminPassportDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    passport_number: str
    city: str
    status: AdminStaffPassportStatus
    qr_token: str
    tier: AdminPassportTierDetail
    user: AdminPassportDetailUser
    stats: AdminPassportDetailStats
    activated_at: datetime | None = None
    suspended_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class AdminPassportStampListItem(BaseModel):
    id: UUID
    organization_id: UUID
    organization_name: str
    stamp_source: PassportStampSource
    stamped_at: datetime
    created_at: datetime


class AdminPassportStampListResponse(BaseModel):
    items: list[AdminPassportStampListItem]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_MAX)


class AdminPassportRedemptionListItem(BaseModel):
    id: UUID
    offer_id: UUID
    offer_title: str
    organization_id: UUID
    organization_name: str
    status: OfferRedemptionStatus
    redeemed_at: datetime | None = None
    created_at: datetime


class AdminPassportRedemptionListResponse(BaseModel):
    items: list[AdminPassportRedemptionListItem]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_MAX)


AdminPassportActionKind = Literal["suspend", "reactivate"]


class AdminPassportActionActorUser(BaseModel):
    id: UUID
    email: str
    display_name: str | None = None


class AdminPassportActionItem(BaseModel):
    id: UUID
    action: AdminPassportActionKind
    previous_status: str | None = None
    new_status: str | None = None
    reason: str
    actor_user: AdminPassportActionActorUser
    created_at: datetime


class AdminPassportActionListResponse(BaseModel):
    items: list[AdminPassportActionItem]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_MAX)
