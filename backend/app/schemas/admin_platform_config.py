"""Admin platform configuration snapshot schemas (ADMIN-SETTINGS-01B)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.admin_cockpit import DEFAULT_COCKPIT_CITY


class AdminPlatformConfigPilotGoals(BaseModel):
    active_passports: int = Field(ge=0)
    published_offers: int = Field(ge=0)
    upcoming_events: int = Field(ge=0)
    approved_creator_contents: int = Field(ge=0)
    qualified_leads: int = Field(ge=0)


class AdminPlatformConfigGeneral(BaseModel):
    app_name: str
    pilot_city: str = DEFAULT_COCKPIT_CITY
    pilot_status: str
    pilot_goals: AdminPlatformConfigPilotGoals


class AdminPlatformConfigPassportTier(BaseModel):
    code: str
    name: str
    display_order: int = Field(ge=0)
    is_active: bool
    is_publicly_visible: bool


class AdminPlatformConfigBadgeThresholds(BaseModel):
    silver_reputation: int = Field(ge=0)
    gold_reputation: int = Field(ge=0)


class AdminPlatformConfigPassport(BaseModel):
    tiers: list[AdminPlatformConfigPassportTier]
    badge_thresholds: AdminPlatformConfigBadgeThresholds
    stamp_qr_expires_minutes: int = Field(ge=0)
    default_max_redemptions_per_passport: int = Field(ge=1)
    passport_stamp_feed_events_enabled: bool


class AdminPlatformConfigPartners(BaseModel):
    supported_statuses: list[str]
    public_visible_statuses: list[str]
    organization_manual_verification: bool = True


class AdminPlatformConfigModeration(BaseModel):
    events_auto_approve_when_org_verified: bool
    creator_content_requires_review: bool
    offers_require_review: bool
    attention_threshold: int = Field(ge=0)


class AdminPlatformConfigNotifications(BaseModel):
    expo_push_enabled: bool
    email_system_available: bool


class AdminPlatformConfigReadiness(BaseModel):
    status: str
    database: str
    redis: str


class AdminPlatformConfigPlatformRole(BaseModel):
    key: str
    name: str


class AdminPlatformConfigSystem(BaseModel):
    environment: str
    service_name: str
    readiness: AdminPlatformConfigReadiness
    platform_roles: list[AdminPlatformConfigPlatformRole]
    rate_limits_mode: str


class AdminPlatformConfigMembershipPlan(BaseModel):
    code: str
    name: str
    monthly_price_cents: int = Field(ge=0)


class AdminPlatformConfigBusiness(BaseModel):
    membership_plans: list[AdminPlatformConfigMembershipPlan]
    stripe_configured: bool


class AdminPlatformConfigViewer(BaseModel):
    roles: list[str]
    permissions: list[str]


class AdminPlatformConfigResponse(BaseModel):
    generated_at: datetime
    read_only: bool = True
    general: AdminPlatformConfigGeneral
    passport: AdminPlatformConfigPassport
    partners: AdminPlatformConfigPartners
    moderation: AdminPlatformConfigModeration
    notifications: AdminPlatformConfigNotifications
    system: AdminPlatformConfigSystem
    business: AdminPlatformConfigBusiness
    enabled_modules: list[str]
    coming_soon: list[str]
    viewer: AdminPlatformConfigViewer
