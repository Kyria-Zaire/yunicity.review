"""Partner offer readiness API schemas — RF-02A."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

PartnerOfferReadinessLevel = Literal["ready", "partial", "not_ready"]
PartnerOfferReadinessCheckSeverity = Literal["ok", "warning", "error"]


class PartnerOfferReadinessCheckItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str
    label: str
    passed: bool
    severity: PartnerOfferReadinessCheckSeverity


class PartnerOfferReadinessFields(BaseModel):
    model_config = ConfigDict(extra="forbid")

    readiness: PartnerOfferReadinessLevel
    is_passport_eligible: bool
    is_placeholder: bool
    value_category: str
    value_category_label: str
    human_description: str
    checks: list[PartnerOfferReadinessCheckItem] = Field(default_factory=list)
