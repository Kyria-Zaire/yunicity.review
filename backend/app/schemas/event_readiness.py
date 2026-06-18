"""Local event readiness API schemas — RF-03A."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

EventReadinessLevel = Literal["ready", "partial", "not_ready"]
EventReadinessCheckSeverity = Literal["ok", "warning", "error"]
EventContentClassificationLevel = Literal["real", "partial", "placeholder"]
TerritoryEventHealthLevel = Literal["healthy", "warning", "critical"]


class EventReadinessCheckItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str
    label: str
    passed: bool
    severity: EventReadinessCheckSeverity


class EventReadinessFields(BaseModel):
    model_config = ConfigDict(extra="forbid")

    readiness: EventReadinessLevel
    classification: EventContentClassificationLevel
    contributes_to_territory: bool
    territory_contribution_label: str
    checks: list[EventReadinessCheckItem] = Field(default_factory=list)


class TerritoryEventHealthFields(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: TerritoryEventHealthLevel
    upcoming_published_count: int = Field(ge=0)
    label: str
    signal_emoji: str
