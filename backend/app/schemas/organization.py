"""Organization API schemas."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.organization_constants import (
    ORGANIZATION_DESCRIPTION_MAX_LENGTH,
    ORGANIZATION_VERIFICATION_REASON_MAX_LENGTH,
    OrganizationMemberRole,
    OrganizationMemberStatus,
    OrganizationType,
    OrganizationVisibility,
    VerificationMethod,
    VerificationStatus,
)


class OrganizationCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    type: OrganizationType
    city: str = Field(min_length=2, max_length=128)
    category: str | None = Field(default=None, max_length=128)
    address: str | None = Field(default=None, max_length=255)
    postal_code: str | None = Field(default=None, max_length=16)
    description: str | None = Field(default=None, max_length=ORGANIZATION_DESCRIPTION_MAX_LENGTH)
    website: str | None = Field(default=None, max_length=2048)
    phone: str | None = Field(default=None, max_length=32)

    @field_validator("name", "city", "category", "address", "postal_code", mode="before")
    @classmethod
    def strip_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class OrganizationMeItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name: str
    type: OrganizationType
    city: str
    verification_status: VerificationStatus
    visibility: OrganizationVisibility
    onboarding_completed: bool
    member_role: OrganizationMemberRole
    member_status: OrganizationMemberStatus


class OrganizationMeListResponse(BaseModel):
    items: list[OrganizationMeItem]


class OrganizationPublicResponse(BaseModel):
    slug: str
    name: str
    description: str | None
    type: OrganizationType
    category: str | None
    city: str
    address: str | None
    postal_code: str | None
    website: str | None
    phone: str | None
    social_links: dict[str, Any]
    logo_url: str | None
    banner_url: str | None


class OrganizationMemberViewResponse(BaseModel):
    """Member/admin view — no internal reviewer or rejection fields."""

    id: UUID
    slug: str
    name: str
    description: str | None
    type: OrganizationType
    category: str | None
    city: str
    address: str | None
    postal_code: str | None
    website: str | None
    phone: str | None
    social_links: dict[str, Any]
    verification_status: VerificationStatus
    visibility: OrganizationVisibility
    onboarding_step: str | None
    onboarding_completed: bool


class OrganizationMemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    role: OrganizationMemberRole
    status: OrganizationMemberStatus
    email: str | None = None


class OrganizationMembersListResponse(BaseModel):
    items: list[OrganizationMemberResponse]


class OrganizationUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str | None = Field(default=None, max_length=ORGANIZATION_DESCRIPTION_MAX_LENGTH)
    website: str | None = Field(default=None, max_length=2048)
    phone: str | None = Field(default=None, max_length=32)
    address: str | None = Field(default=None, max_length=255)
    postal_code: str | None = Field(default=None, max_length=16)
    city: str | None = Field(default=None, max_length=128)
    category: str | None = Field(default=None, max_length=128)
    social_links: dict[str, Any] | None = None
    onboarding_step: str | None = Field(default=None, max_length=64)
    onboarding_completed: bool | None = None

    @field_validator("city", "category", "address", "postal_code", mode="before")
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class OrganizationReviewRequest(BaseModel):
    decision: VerificationStatus
    method: VerificationMethod | None = VerificationMethod.MANUAL
    reason: str | None = Field(default=None, max_length=ORGANIZATION_VERIFICATION_REASON_MAX_LENGTH)

    @field_validator("decision")
    @classmethod
    def allowed_decisions(cls, value: VerificationStatus) -> VerificationStatus:
        allowed = {
            VerificationStatus.UNDER_REVIEW,
            VerificationStatus.VERIFIED,
            VerificationStatus.REJECTED,
            VerificationStatus.SUSPENDED,
        }
        if value not in allowed:
            raise ValueError("Décision de review invalide.")
        return value


class OrganizationCreateResponse(BaseModel):
    id: UUID
    slug: str
    name: str
    verification_status: VerificationStatus
    visibility: OrganizationVisibility
