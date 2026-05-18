"""Partner lead API schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.organization_constants import OrganizationType
from app.core.partner_lead_constants import (
    PARTNER_LEAD_IMPORT_MAX_ROWS,
    PARTNER_LEAD_NAME_MAX_LENGTH,
    PARTNER_LEAD_NOTES_MAX_LENGTH,
    PARTNER_LEAD_TAG_MAX_LENGTH,
    PARTNER_LEAD_TAGS_MAX_COUNT,
    PartnerLeadSource,
    PartnerLeadStatus,
)


def _strip_optional(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _validate_tags(tags: list[str]) -> list[str]:
    if len(tags) > PARTNER_LEAD_TAGS_MAX_COUNT:
        raise ValueError(f"Maximum {PARTNER_LEAD_TAGS_MAX_COUNT} tags autorisés.")
    normalized: list[str] = []
    for tag in tags:
        cleaned = tag.strip().lower()
        if not cleaned:
            continue
        if len(cleaned) > PARTNER_LEAD_TAG_MAX_LENGTH:
            raise ValueError(f"Tag trop long (max {PARTNER_LEAD_TAG_MAX_LENGTH}).")
        normalized.append(cleaned)
    return normalized


class PartnerLeadCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=PARTNER_LEAD_NAME_MAX_LENGTH)
    organization_type: OrganizationType | None = None
    contact_name: str | None = Field(default=None, max_length=160)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=32)
    website: str | None = Field(default=None, max_length=2048)
    instagram: str | None = Field(default=None, max_length=128)
    city: str | None = Field(default=None, max_length=128)
    address: str | None = Field(default=None, max_length=255)
    source: PartnerLeadSource = PartnerLeadSource.PHYSICAL_PROSPECTING
    status: PartnerLeadStatus = PartnerLeadStatus.NEW
    interested_passport: bool = False
    interested_events: bool = False
    interested_creator_program: bool = False
    interested_offers: bool = False
    interested_business_passport: bool = False
    tags: list[str] = Field(default_factory=list)
    notes: str | None = Field(default=None, max_length=PARTNER_LEAD_NOTES_MAX_LENGTH)
    internal_rating: int | None = Field(default=None, ge=1, le=5)
    last_contacted_at: datetime | None = None
    next_followup_at: datetime | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator(
        "name",
        "contact_name",
        "phone",
        "website",
        "instagram",
        "city",
        "address",
        mode="before",
    )
    @classmethod
    def strip_strings(cls, value: str | None) -> str | None:
        return _strip_optional(value)

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, value: list[str] | None) -> list[str]:
        if value is None:
            return []
        return _validate_tags(value)


class PartnerLeadUpdateRequest(BaseModel):
    status: PartnerLeadStatus | None = None
    notes: str | None = Field(default=None, max_length=PARTNER_LEAD_NOTES_MAX_LENGTH)
    tags: list[str] | None = None
    last_contacted_at: datetime | None = None
    next_followup_at: datetime | None = None
    internal_rating: int | None = Field(default=None, ge=1, le=5)
    interested_passport: bool | None = None
    interested_events: bool | None = None
    interested_creator_program: bool | None = None
    interested_offers: bool | None = None
    interested_business_passport: bool | None = None

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return _validate_tags(value)


class PartnerLeadConvertRequest(BaseModel):
    organization_id: UUID | None = None
    owner_user_id: UUID


class PartnerLeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    organization_type: OrganizationType | None
    contact_name: str | None
    email: str | None
    phone: str | None
    website: str | None
    instagram: str | None
    city: str | None
    address: str | None
    source: PartnerLeadSource
    status: PartnerLeadStatus
    interested_passport: bool
    interested_events: bool
    interested_creator_program: bool
    interested_offers: bool
    interested_business_passport: bool
    tags: list[str]
    notes: str | None
    internal_rating: int | None
    last_contacted_at: datetime | None
    next_followup_at: datetime | None
    converted_organization_id: UUID | None
    converted_at: datetime | None
    created_at: datetime
    updated_at: datetime


class PartnerLeadListResponse(BaseModel):
    items: list[PartnerLeadResponse]
    total: int
    page: int
    page_size: int


class PartnerLeadImportRow(BaseModel):
    name: str | None = None
    organization_type: str | None = None
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    instagram: str | None = None
    city: str | None = None
    address: str | None = None
    source: str | None = None
    status: str | None = None
    tags: list[str] | None = None
    notes: str | None = None


class PartnerLeadImportPreviewRequest(BaseModel):
    rows: list[PartnerLeadImportRow] = Field(min_length=1)

    @field_validator("rows")
    @classmethod
    def cap_rows(cls, value: list[PartnerLeadImportRow]) -> list[PartnerLeadImportRow]:
        if len(value) > PARTNER_LEAD_IMPORT_MAX_ROWS:
            raise ValueError(f"Maximum {PARTNER_LEAD_IMPORT_MAX_ROWS} lignes par import preview.")
        return value


class PartnerLeadImportNormalizedRow(BaseModel):
    row_index: int
    name: str
    city: str | None
    phone: str | None
    source: PartnerLeadSource
    status: PartnerLeadStatus
    email: str | None
    organization_type: OrganizationType | None
    contact_name: str | None
    website: str | None
    instagram: str | None
    address: str | None
    tags: list[str]


class PartnerLeadImportInvalidRow(BaseModel):
    row_index: int
    errors: list[str]
    raw: dict[str, Any]


class PartnerLeadImportDuplicateRow(BaseModel):
    row_index: int
    duplicate_key: str
    reason: str


class PartnerLeadImportPreviewResponse(BaseModel):
    normalized: list[PartnerLeadImportNormalizedRow]
    invalid: list[PartnerLeadImportInvalidRow]
    duplicates: list[PartnerLeadImportDuplicateRow]
    total_rows: int
