"""Admin cockpit summary schemas (ADMIN-01A)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

DEFAULT_COCKPIT_CITY = "Reims"


class AdminCockpitExecutiveMetrics(BaseModel):
    users_total: int = Field(ge=0)
    users_active: int = Field(ge=0)
    passports_total: int = Field(ge=0)
    partners_total: int = Field(ge=0)
    offers_total: int = Field(ge=0)
    events_total: int = Field(ge=0)
    creator_contents_total: int = Field(ge=0)
    partner_leads_total: int = Field(ge=0)


class AdminCockpitAttentionMetrics(BaseModel):
    offers_pending: int = Field(ge=0)
    creator_contents_pending: int = Field(ge=0)
    events_pending: int = Field(ge=0)
    reports_pending: int = Field(ge=0)
    partner_leads_open: int = Field(ge=0)
    organizations_pending_review: int = Field(ge=0)


class AdminCockpitPartnersMetrics(BaseModel):
    active: int = Field(ge=0)
    signed: int = Field(ge=0)
    premium: int = Field(ge=0)
    founding_partner: int = Field(ge=0)
    paused: int = Field(ge=0)
    public: int = Field(ge=0)
    private: int = Field(ge=0)
    verified: int = Field(ge=0)
    pending_review: int = Field(ge=0)


class AdminCockpitPassportMetrics(BaseModel):
    passports_total: int = Field(ge=0)
    stamps_total: int = Field(ge=0)
    qr_stamps: int = Field(ge=0)
    partner_stamps: int = Field(ge=0)
    redemptions_total: int = Field(ge=0)
    redemptions_completed: int = Field(ge=0)


class AdminCockpitTopStampPartner(BaseModel):
    organization_id: str | None = None
    name: str | None = None
    stamps_count: int = Field(ge=0)


class AdminCockpitSignalsMetrics(BaseModel):
    """Derived cockpit signals — real aggregates for dashboard hints (ADMIN-01B+)."""

    offers_published: int = Field(ge=0)
    stamps_today: int = Field(ge=0)
    redemptions_today: int = Field(ge=0)
    passports_last_7_days: int = Field(ge=0)
    events_upcoming: int = Field(ge=0)
    top_stamp_partner: AdminCockpitTopStampPartner


class AdminCockpitSummaryResponse(BaseModel):
    generated_at: datetime
    city: str
    executive: AdminCockpitExecutiveMetrics
    attention: AdminCockpitAttentionMetrics
    partners: AdminCockpitPartnersMetrics
    passport: AdminCockpitPassportMetrics
    signals: AdminCockpitSignalsMetrics
