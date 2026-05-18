"""Admin partner offer schemas — moderation queue (TICKET-305 / 305A)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.passport_constants import (
    DEFAULT_MAX_REDEMPTIONS_PER_PASSPORT,
    PARTNER_OFFER_TYPES,
    PartnerOfferStatus,
    PartnerOfferType,
)
from app.schemas.partner_offer_management import (
    PARTNER_OFFER_LIST_PAGE_SIZE_DEFAULT,
    PARTNER_OFFER_LIST_PAGE_SIZE_MAX,
)

__all__ = [
    "PARTNER_OFFER_LIST_PAGE_SIZE_DEFAULT",
    "PARTNER_OFFER_LIST_PAGE_SIZE_MAX",
    "PartnerOfferAdminCreateRequest",
    "PartnerOfferAdminUpdateRequest",
    "PartnerOfferAdminResponse",
    "PartnerOfferAdminListResponse",
    "VerifiedOrganizationOption",
    "VerifiedOrganizationListResponse",
    "PartnerOfferRejectRequest",
]


class PartnerOfferRejectRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str = Field(min_length=1, max_length=1000)


class PartnerOfferAdminCreateRequest(BaseModel):
    """Staff bootstrap — creates draft offers for verified organizations."""

    model_config = ConfigDict(extra="forbid")

    organization_id: UUID
    title: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    offer_type: PartnerOfferType
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    redemption_limit: int = Field(default=DEFAULT_MAX_REDEMPTIONS_PER_PASSPORT, ge=1)
    max_redemptions_total: int | None = Field(default=None, ge=1)
    tier_code_required: str | None = Field(default=None, max_length=32)

    @field_validator("offer_type", mode="before")
    @classmethod
    def validate_offer_type(cls, value: object) -> object:
        if isinstance(value, str) and value not in PARTNER_OFFER_TYPES:
            raise ValueError("Type d'offre invalide.")
        return value

    @model_validator(mode="after")
    def validate_dates(self) -> PartnerOfferAdminCreateRequest:
        if self.valid_from and self.valid_until and self.valid_until <= self.valid_from:
            raise ValueError("La date de fin doit être postérieure à la date de début.")
        return self


class PartnerOfferAdminUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    offer_type: PartnerOfferType | None = None
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    redemption_limit: int | None = Field(default=None, ge=1)
    max_redemptions_total: int | None = Field(default=None, ge=1)
    tier_code_required: str | None = Field(default=None, max_length=32)

    @model_validator(mode="after")
    def validate_dates(self) -> PartnerOfferAdminUpdateRequest:
        if self.valid_from and self.valid_until and self.valid_until <= self.valid_from:
            raise ValueError("La date de fin doit être postérieure à la date de début.")
        return self


class PartnerOfferOrganizationAdmin(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name: str
    city: str
    verification_status: str
    visibility: str


class PartnerOfferAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    title: str
    description: str | None
    offer_type: PartnerOfferType
    offer_status: PartnerOfferStatus
    is_active: bool
    tier_code_required: str | None
    max_redemptions_total: int | None
    redemption_limit: int
    valid_from: datetime | None
    valid_until: datetime | None
    redemptions_count: int
    created_by_user_id: UUID | None
    moderated_by_user_id: UUID | None
    moderated_at: datetime | None
    rejection_reason: str | None
    created_at: datetime
    updated_at: datetime
    organization: PartnerOfferOrganizationAdmin


class PartnerOfferAdminListResponse(BaseModel):
    items: list[PartnerOfferAdminResponse]
    total: int
    page: int
    page_size: int


class VerifiedOrganizationOption(BaseModel):
    id: UUID
    slug: str
    name: str
    city: str
    visibility: str


class VerifiedOrganizationListResponse(BaseModel):
    items: list[VerifiedOrganizationOption]
