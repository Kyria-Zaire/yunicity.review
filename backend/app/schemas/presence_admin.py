"""Staff-only presence administration contracts (PASSPORT-PRESENCE-01, lot 01A)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, field_validator, model_validator

PresenceCampaignStatusValue = Literal["draft", "open", "closed", "archived"]
PresenceRegistrationStatusValue = Literal["confirmed", "cancelled"]
PresenceAssignmentStatusValue = Literal["active", "revoked"]


class PresenceCampaignCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    organization_id: uuid.UUID
    local_event_id: uuid.UUID | None = None
    city: str = Field(min_length=1, max_length=128)
    title: str = Field(min_length=1, max_length=160)
    #: Explicit window, timezone required, stored in UTC; no implicit tolerance (B8).
    presence_opens_at: AwareDatetime
    presence_closes_at: AwareDatetime
    is_test: bool = False

    @field_validator("city", "title")
    @classmethod
    def _strip_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("must not be blank")
        return stripped

    @field_validator("presence_opens_at", "presence_closes_at")
    @classmethod
    def _to_utc(cls, value: datetime) -> datetime:
        return value.astimezone(UTC)

    @model_validator(mode="after")
    def _window_is_ordered(self) -> PresenceCampaignCreateRequest:
        if self.presence_closes_at <= self.presence_opens_at:
            raise ValueError("presence_closes_at must be after presence_opens_at")
        return self


class PresenceCampaignStatusPatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: PresenceCampaignStatusValue


class PresenceRegistrationSetRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: PresenceRegistrationStatusValue


class PresenceAgentAssignmentSetRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: PresenceAssignmentStatusValue


class PresenceUserTestFlagRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    is_test: bool


class PresenceCampaignResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    local_event_id: uuid.UUID | None
    city: str
    title: str
    status: PresenceCampaignStatusValue
    presence_opens_at: datetime
    presence_closes_at: datetime
    is_test: bool
    created_at: datetime
    updated_at: datetime


class PresenceCampaignListResponse(BaseModel):
    items: list[PresenceCampaignResponse]
    total: int
    page: int
    page_size: int


class PresenceRegistrationResponse(BaseModel):
    campaign_id: uuid.UUID
    user_id: uuid.UUID
    status: PresenceRegistrationStatusValue
    status_changed_at: datetime
    #: False when the requested status was already in place (idempotent PUT, no audit row).
    changed: bool


class PresenceAgentAssignmentResponse(BaseModel):
    campaign_id: uuid.UUID
    agent_user_id: uuid.UUID
    status: PresenceAssignmentStatusValue
    status_changed_at: datetime
    changed: bool


class PresenceUserTestFlagResponse(BaseModel):
    user_id: uuid.UUID
    is_test: bool
    changed: bool
