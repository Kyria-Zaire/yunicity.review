"""Partner offer management schemas — self-service + moderation (TICKET-305A)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.flash_offer import validate_flash_fields
from app.core.passport_constants import (
    DEFAULT_MAX_REDEMPTIONS_PER_PASSPORT,
    PARTNER_OFFER_REJECTION_REASON_MAX_LENGTH,
    PARTNER_OFFER_TYPES,
    PartnerOfferStatus,
    PartnerOfferType,
)
from app.schemas.partner_offer_readiness import PartnerOfferReadinessFields

PARTNER_OFFER_LIST_PAGE_SIZE_DEFAULT = 50
PARTNER_OFFER_LIST_PAGE_SIZE_MAX = 100


class PartnerOfferCreateRequest(BaseModel):
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
    is_flash: bool = False
    flash_ends_at: datetime | None = None

    @field_validator("offer_type", mode="before")
    @classmethod
    def validate_offer_type(cls, value: object) -> object:
        if isinstance(value, str) and value not in PARTNER_OFFER_TYPES:
            raise ValueError("Type d'offre invalide.")
        return value

    @model_validator(mode="after")
    def validate_dates(self) -> PartnerOfferCreateRequest:
        if self.valid_from and self.valid_until and self.valid_until <= self.valid_from:
            raise ValueError("La date de fin doit être postérieure à la date de début.")
        if self.is_flash:
            try:
                validate_flash_fields(
                    is_flash=True,
                    flash_ends_at=self.flash_ends_at,
                    valid_until=self.valid_until,
                    status=PartnerOfferStatus.DRAFT,
                )
            except Exception as exc:
                detail = getattr(exc, "detail", str(exc))
                raise ValueError(str(detail)) from exc
        elif self.flash_ends_at is not None:
            raise ValueError("flash_ends_at interdit sans offre flash.")
        return self


class PartnerOfferUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    offer_type: PartnerOfferType | None = None
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    redemption_limit: int | None = Field(default=None, ge=1)
    max_redemptions_total: int | None = Field(default=None, ge=1)
    tier_code_required: str | None = Field(default=None, max_length=32)
    is_flash: bool | None = None
    flash_ends_at: datetime | None = None

    @model_validator(mode="after")
    def validate_dates(self) -> PartnerOfferUpdateRequest:
        if self.valid_from and self.valid_until and self.valid_until <= self.valid_from:
            raise ValueError("La date de fin doit être postérieure à la date de début.")
        if self.is_flash is False and self.flash_ends_at is not None:
            raise ValueError("flash_ends_at interdit sans offre flash.")
        return self


class PartnerOfferRejectRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str = Field(min_length=1, max_length=PARTNER_OFFER_REJECTION_REASON_MAX_LENGTH)


class PartnerOfferManagementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    title: str
    description: str | None
    value_label: str | None = None
    conditions: str | None = None
    offer_type: PartnerOfferType
    offer_status: PartnerOfferStatus
    is_active: bool
    tier_code_required: str | None
    max_redemptions_total: int | None
    redemption_limit: int
    valid_from: datetime | None
    valid_until: datetime | None
    redemptions_count: int = 0
    created_by_user_id: UUID | None
    moderated_by_user_id: UUID | None
    moderated_at: datetime | None
    rejection_reason: str | None
    is_flash: bool
    flash_ends_at: datetime | None
    flash_active: bool = False
    remaining_hours: int | None = None
    remaining_minutes: int | None = None
    notification_sent_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    readiness: PartnerOfferReadinessFields


class PartnerOfferManagementListResponse(BaseModel):
    items: list[PartnerOfferManagementResponse]
    total: int
    page: int
    page_size: int
