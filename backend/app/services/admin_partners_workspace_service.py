"""Admin partners workspace summary — territorial network snapshot."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.activation_wave_constants import ActivationWaveStatus
from app.integrations.cache import (
    PARTNERS_WORKSPACE_SUMMARY_TTL_SECONDS,
    get_cached_model,
    set_cached_model,
)
from app.repositories.admin_activation_wave_repository import AdminActivationWaveRepository
from app.repositories.admin_cockpit_repository import AdminCockpitRepository
from app.repositories.admin_partners_terrain_repository import AdminPartnersTerrainRepository
from app.schemas.admin_partners_terrain import (
    AdminPartnersCategoryBreakdownItem,
    AdminPartnersEvolutionPoint,
    AdminPartnersMapPin,
    AdminPartnersPendingRequestItem,
    AdminPartnersTopActiveItem,
)
from app.schemas.admin_partners_workspace import (
    DEFAULT_PARTNERS_WORKSPACE_CITY,
    AdminPartnersWorkspaceSummaryResponse,
)


class AdminPartnersWorkspaceService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._cockpit_repo = AdminCockpitRepository(session)
        self._activation_repo = AdminActivationWaveRepository(session)
        self._terrain_repo = AdminPartnersTerrainRepository(session)

    async def get_workspace_summary(
        self,
        *,
        city: str | None = None,
    ) -> AdminPartnersWorkspaceSummaryResponse:
        resolved_city = (
            city or DEFAULT_PARTNERS_WORKSPACE_CITY
        ).strip() or DEFAULT_PARTNERS_WORKSPACE_CITY
        cache_key = f"admin:partners:workspace-summary:v1:{resolved_city.lower()}"
        cached = await get_cached_model(cache_key, AdminPartnersWorkspaceSummaryResponse)
        if cached is not None:
            return cached
        counts = await self._cockpit_repo.fetch_counts(resolved_city)

        activation_waves_open = 0
        activation_items_total = 0
        activation_items_ready = 0
        activation_items_activated = 0

        for row in await self._activation_repo.list_waves():
            if row.wave.city != resolved_city:
                continue
            if row.wave.status == ActivationWaveStatus.ACTIVE.value:
                activation_waves_open += 1
            activation_items_total += row.counts.items_total
            activation_items_ready += row.counts.items_ready
            activation_items_activated += row.counts.items_activated

        partners_new_this_month = await self._terrain_repo.count_new_partners_this_month(
            city=resolved_city,
        )
        partners_inactive = await self._terrain_repo.count_inactive_partners(city=resolved_city)
        category_breakdown = [
            AdminPartnersCategoryBreakdownItem(key=key, count=count)
            for key, count in await self._terrain_repo.fetch_category_breakdown(city=resolved_city)
        ]
        top_active_rows = await self._terrain_repo.fetch_top_active_partners(
            city=resolved_city,
        )
        top_active_partners = [
            AdminPartnersTopActiveItem(
                organization_id=org_id,
                name=name,
                logo_url=logo_url,
                interactions_count=interactions,
            )
            for org_id, name, logo_url, interactions in top_active_rows
        ]
        pending_requests = [
            AdminPartnersPendingRequestItem(
                organization_id=org.id,
                name=org.name,
                organization_type=org.type,
                requested_at=org.updated_at,
            )
            for org in await self._terrain_repo.fetch_pending_requests(city=resolved_city)
        ]
        map_pins = [
            AdminPartnersMapPin(
                organization_id=org_id,
                name=name,
                latitude=lat,
                longitude=lng,
            )
            for org_id, name, lat, lng in await self._terrain_repo.fetch_map_pins(
                city=resolved_city
            )
        ]
        evolution_30d = [
            AdminPartnersEvolutionPoint(
                date=point_date,
                cumulative_total=cumulative,
                new_count=new_count,
            )
            for point_date, cumulative, new_count in await self._terrain_repo.fetch_evolution_30d(
                city=resolved_city,
            )
        ]

        response = AdminPartnersWorkspaceSummaryResponse(
            generated_at=datetime.now(UTC),
            city=resolved_city,
            leads_total=counts.partner_leads_total,
            leads_open=counts.partner_leads_open,
            organizations_pending_review=counts.organizations_pending_review,
            partners_total=counts.partners_total,
            partners_active=counts.partner_status_active,
            partners_signed=counts.partner_status_signed,
            partners_premium=counts.partner_status_premium,
            partners_founding=counts.partner_status_founding_partner,
            partners_verified=counts.org_verified_with_partner,
            partners_public=counts.org_public_with_partner,
            partners_private=counts.org_private_with_partner,
            activation_waves_open=activation_waves_open,
            activation_items_total=activation_items_total,
            activation_items_ready=activation_items_ready,
            activation_items_activated=activation_items_activated,
            partners_inactive=partners_inactive,
            partners_new_this_month=partners_new_this_month,
            category_breakdown=category_breakdown,
            top_active_partners=top_active_partners,
            pending_requests=pending_requests,
            map_pins=map_pins,
            evolution_30d=evolution_30d,
        )
        await set_cached_model(
            cache_key, response, PARTNERS_WORKSPACE_SUMMARY_TTL_SECONDS
        )
        return response
