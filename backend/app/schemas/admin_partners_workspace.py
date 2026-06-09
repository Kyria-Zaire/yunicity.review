"""Admin partners workspace summary schemas (ADMIN-PARTNERS-UX-01)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.admin_partners_terrain import (
    AdminPartnersCategoryBreakdownItem,
    AdminPartnersEvolutionPoint,
    AdminPartnersMapPin,
    AdminPartnersPendingRequestItem,
    AdminPartnersTopActiveItem,
)

DEFAULT_PARTNERS_WORKSPACE_CITY = "Reims"


class AdminPartnersWorkspaceSummaryResponse(BaseModel):
    """Territorial partner network snapshot for the admin workspace header."""

    generated_at: datetime
    city: str
    leads_total: int = Field(ge=0)
    leads_open: int = Field(ge=0)
    organizations_pending_review: int = Field(ge=0)
    partners_total: int = Field(ge=0)
    partners_active: int = Field(ge=0)
    partners_signed: int = Field(ge=0)
    partners_premium: int = Field(ge=0)
    partners_founding: int = Field(ge=0)
    partners_verified: int = Field(ge=0)
    partners_public: int = Field(ge=0)
    partners_private: int = Field(ge=0)
    activation_waves_open: int = Field(ge=0)
    activation_items_total: int = Field(ge=0)
    activation_items_ready: int = Field(ge=0)
    activation_items_activated: int = Field(ge=0)
    partners_inactive: int = Field(ge=0)
    partners_new_this_month: int = Field(ge=0)
    category_breakdown: list[AdminPartnersCategoryBreakdownItem] = Field(default_factory=list)
    top_active_partners: list[AdminPartnersTopActiveItem] = Field(default_factory=list)
    pending_requests: list[AdminPartnersPendingRequestItem] = Field(default_factory=list)
    map_pins: list[AdminPartnersMapPin] = Field(default_factory=list)
    evolution_30d: list[AdminPartnersEvolutionPoint] = Field(default_factory=list)
