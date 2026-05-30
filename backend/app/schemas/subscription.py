"""Membership subscription API schemas."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field

from app.core.subscription_constants import (
    MembershipBillingInterval,
    MembershipPlanCode,
    MembershipStatus,
)


class SubscriptionPlanFeatureResponse(BaseModel):
    key: str
    label: str
    included: bool


class SubscriptionPlanPriceResponse(BaseModel):
    monthly_cents: int
    annual_cents: int
    annual_monthly_equivalent_cents: int
    currency: str = "EUR"


class SubscriptionPlanResponse(BaseModel):
    code: MembershipPlanCode
    name: str
    tagline: str
    display_order: int
    is_highlighted: bool
    price: SubscriptionPlanPriceResponse
    features: list[SubscriptionPlanFeatureResponse]


class SubscriptionPlansResponse(BaseModel):
    plans: list[SubscriptionPlanResponse]
    annual_discount_percent: int
    checkout_enabled: bool


class SubscriptionMeResponse(BaseModel):
    plan_code: MembershipPlanCode
    billing_interval: MembershipBillingInterval | None = None
    status: MembershipStatus
    is_paid: bool
    current_period_end: datetime | None = None
    can_upgrade: bool


class SubscriptionSupporterAvatarResponse(BaseModel):
    display_name: str
    avatar_url: str | None = None


class SubscriptionCommunityStatsResponse(BaseModel):
    supporter_count: int
    avatars: list[SubscriptionSupporterAvatarResponse]


class SubscriptionCheckoutRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    plan_code: MembershipPlanCode = Field(..., description="plus or premium")
    billing_interval: MembershipBillingInterval = MembershipBillingInterval.MONTHLY


class SubscriptionCheckoutStatus(StrEnum):
    REDIRECT = "redirect"
    UNAVAILABLE = "unavailable"


class SubscriptionCheckoutResponse(BaseModel):
    status: SubscriptionCheckoutStatus
    checkout_url: str | None = None
    message: str | None = None
