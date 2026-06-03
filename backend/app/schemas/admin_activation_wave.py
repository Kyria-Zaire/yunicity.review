"""Admin activation waves API schemas (ADMIN-02C-B)."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.activation_wave_constants import (
    CHECKLIST_V1_KEYS,
    ActivationWaveItemStatus,
    ActivationWaveStatus,
)


class ActivationWaveChecklistV1(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contact_confirmed: bool
    assets_received: bool
    passport_offer_ready: bool
    qr_ready: bool
    go_public_ready: bool


class AdminActivationWaveListItem(BaseModel):
    id: UUID
    city: str
    code: str
    name: str
    status: ActivationWaveStatus
    items_total: int = Field(ge=0)
    items_ready: int = Field(ge=0)
    items_activated: int = Field(ge=0)


class AdminActivationWaveSummary(BaseModel):
    id: UUID
    city: str
    code: str
    name: str
    description: str | None = None
    status: ActivationWaveStatus
    sort_order: int


class AdminActivationWaveItemResponse(BaseModel):
    id: UUID
    organization_id: UUID | None = None
    partner_profile_id: UUID | None = None
    partner_name_snapshot: str
    partner_slug_snapshot: str | None = None
    status: ActivationWaveItemStatus
    checklist: ActivationWaveChecklistV1
    notes: str | None = None

    @field_validator("checklist", mode="before")
    @classmethod
    def _coerce_checklist(cls, value: object) -> ActivationWaveChecklistV1 | object:
        if isinstance(value, dict):
            return ActivationWaveChecklistV1.model_validate(value)
        return value


class AdminActivationWaveDetailResponse(BaseModel):
    wave: AdminActivationWaveSummary
    items: list[AdminActivationWaveItemResponse]


class AdminActivationWaveItemPatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: ActivationWaveItemStatus | None = None
    checklist: ActivationWaveChecklistV1 | None = None
    notes: str | None = Field(default=None, max_length=5000)


def checklist_v1_to_dict(checklist: ActivationWaveChecklistV1) -> dict[str, bool]:
    return {key: getattr(checklist, key) for key in CHECKLIST_V1_KEYS}
