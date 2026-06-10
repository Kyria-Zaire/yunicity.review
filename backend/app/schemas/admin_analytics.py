"""Admin analytics summary schemas (ADMIN-ANALYTICS-01)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.admin_cockpit import DEFAULT_COCKPIT_CITY

AdminAnalyticsPeriod = Literal["7d", "30d", "90d"]

ANALYTICS_PERIOD_DAYS: dict[AdminAnalyticsPeriod, int] = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
}


class AdminAnalyticsScope(BaseModel):
    city: str
    period: AdminAnalyticsPeriod
    compare_enabled: bool


class AdminAnalyticsGrowth(BaseModel):
    active_users: int = Field(ge=0)
    new_users: int = Field(ge=0)
    new_users_previous_period: int = Field(ge=0)
    growth_rate_percent: float | None = None


class AdminAnalyticsPassport(BaseModel):
    active_passports: int = Field(ge=0)
    activated_in_period: int = Field(ge=0)
    stamps_total: int = Field(ge=0)
    stamps_in_period: int = Field(ge=0)
    qr_claims_in_period: int = Field(ge=0)
    partner_claims_in_period: int = Field(ge=0)
    redemptions_in_period: int = Field(ge=0)


class AdminAnalyticsPartners(BaseModel):
    total_partners: int = Field(ge=0)
    signed: int = Field(ge=0)
    active: int = Field(ge=0)
    premium: int = Field(ge=0)
    founding: int = Field(ge=0)
    public_visible: int = Field(ge=0)
    pending_verification: int = Field(ge=0)


class AdminAnalyticsOffers(BaseModel):
    total: int = Field(ge=0)
    published: int = Field(ge=0)
    pending_review: int = Field(ge=0)
    draft: int = Field(ge=0)
    archived: int = Field(ge=0)


class AdminAnalyticsEvents(BaseModel):
    total: int = Field(ge=0)
    approved: int = Field(ge=0)
    pending_review: int = Field(ge=0)
    cancelled: int = Field(ge=0)
    archived: int = Field(ge=0)


class AdminAnalyticsCreators(BaseModel):
    contents_total: int = Field(ge=0)
    published: int = Field(ge=0)
    pending_review: int = Field(ge=0)
    rejected: int = Field(ge=0)
    active_creators: int = Field(ge=0)


class AdminAnalyticsCrm(BaseModel):
    total_leads: int = Field(ge=0)
    new: int = Field(ge=0)
    contacted: int = Field(ge=0)
    interested: int = Field(ge=0)
    meeting_scheduled: int = Field(ge=0)
    converted: int = Field(ge=0)
    rejected: int = Field(ge=0)
    archived: int = Field(ge=0)


class AdminAnalyticsAttention(BaseModel):
    pending_offers: int = Field(ge=0)
    pending_events: int = Field(ge=0)
    pending_creator_contents: int = Field(ge=0)
    pending_partner_verifications: int = Field(ge=0)
    open_leads: int = Field(ge=0)


class AdminAnalyticsSummaryResponse(BaseModel):
    generated_at: datetime
    scope: AdminAnalyticsScope
    growth: AdminAnalyticsGrowth
    passport: AdminAnalyticsPassport
    partners: AdminAnalyticsPartners
    offers: AdminAnalyticsOffers
    events: AdminAnalyticsEvents
    creators: AdminAnalyticsCreators
    crm: AdminAnalyticsCrm
    attention: AdminAnalyticsAttention


def resolve_analytics_city(city: str | None) -> str:
    resolved = (city or DEFAULT_COCKPIT_CITY).strip()
    return resolved or DEFAULT_COCKPIT_CITY
