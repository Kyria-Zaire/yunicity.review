"""Profile API schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.profile_constants import BIO_MAX_LENGTH, INTERESTS_MAX_COUNT
from app.core.profile_username import normalize_username
from app.models.user_profile import ProfileVisibility


class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str | None = Field(default=None, max_length=128)
    bio: str | None = Field(default=None, max_length=BIO_MAX_LENGTH)
    avatar_url: str | None = Field(default=None, max_length=2048)
    banner_url: str | None = Field(default=None, max_length=2048)
    city: str | None = Field(default=None, max_length=128)
    interests: list[str] | None = None
    visibility: ProfileVisibility | None = None
    preferred_language: str | None = Field(default=None, max_length=8)
    notification_preferences: dict[str, Any] | None = None
    onboarding_step: str | None = Field(default=None, max_length=64)

    @field_validator("display_name", "city", mode="before")
    @classmethod
    def strip_optional_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("preferred_language", mode="before")
    @classmethod
    def normalize_language(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip().lower() or None


class ProfileMeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    username: str
    display_name: str | None
    bio: str | None
    avatar_url: str | None
    banner_url: str | None
    city: str | None
    interests: list[str]
    visibility: ProfileVisibility
    onboarding_completed: bool
    onboarding_step: str | None
    preferred_language: str | None
    notification_preferences: dict[str, Any]
    has_active_passport: bool = False
    created_at: datetime
    updated_at: datetime


class ProfilePublicResponse(BaseModel):
    """Public profile view — never includes auth or private settings."""

    username: str
    display_name: str | None
    bio: str | None
    avatar_url: str | None
    banner_url: str | None
    city: str | None
    interests: list[str]


class ProfileCompleteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    city: str | None = Field(default=None, max_length=128)
    interests: list[str] | None = None

    @field_validator("city", mode="before")
    @classmethod
    def strip_city(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


def validate_interests(values: list[str]) -> list[str]:
    if len(values) > INTERESTS_MAX_COUNT:
        raise ValueError(f"Maximum {INTERESTS_MAX_COUNT} intérêts autorisés.")
    normalized: list[str] = []
    seen: set[str] = set()
    for raw in values:
        tag = raw.strip().lower()
        if not tag:
            continue
        if tag in seen:
            continue
        normalized.append(tag)
        seen.add(tag)
    return normalized


def reject_username_in_payload(payload: dict[str, Any]) -> None:
    if "username" in payload:
        raise ValueError("Le username est immuable et ne peut pas être modifié.")


def sanitize_public_username(username: str) -> str:
    return normalize_username(username)
