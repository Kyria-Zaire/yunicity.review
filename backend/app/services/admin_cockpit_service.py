"""Admin cockpit summary service (ADMIN-01A)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.territory_event_health import territory_event_health
from app.integrations.cache import (
    COCKPIT_SUMMARY_TTL_SECONDS,
    get_cached_model,
    set_cached_model,
)
from app.repositories.admin_cockpit_repository import AdminCockpitRepository
from app.schemas.admin_cockpit import (
    DEFAULT_COCKPIT_CITY,
    AdminCockpitAttentionMetrics,
    AdminCockpitExecutiveMetrics,
    AdminCockpitPartnersMetrics,
    AdminCockpitPassportMetrics,
    AdminCockpitSignalsMetrics,
    AdminCockpitSummaryResponse,
    AdminCockpitTopStampPartner,
)
from app.schemas.event_readiness import TerritoryEventHealthFields


class AdminCockpitService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = AdminCockpitRepository(session)

    async def get_summary(self, *, city: str | None = None) -> AdminCockpitSummaryResponse:
        resolved_city = (city or DEFAULT_COCKPIT_CITY).strip() or DEFAULT_COCKPIT_CITY
        cache_key = f"admin:cockpit:summary:v2:{resolved_city.lower()}"
        cached = await get_cached_model(cache_key, AdminCockpitSummaryResponse)
        if cached is not None:
            return cached
        counts = await self._repo.fetch_counts(resolved_city)
        event_health = territory_event_health(counts.events_upcoming)
        response = AdminCockpitSummaryResponse(
            generated_at=datetime.now(UTC),
            city=resolved_city,
            executive=AdminCockpitExecutiveMetrics(
                users_total=counts.users_total,
                users_active=counts.users_active,
                passports_total=counts.passports_total_scoped,
                partners_total=counts.partners_total,
                offers_total=counts.offers_total,
                events_total=counts.events_total,
                creator_contents_total=counts.creator_contents_total,
                partner_leads_total=counts.partner_leads_total,
            ),
            attention=AdminCockpitAttentionMetrics(
                offers_pending=counts.offers_pending,
                creator_contents_pending=counts.creator_contents_pending,
                events_pending=counts.events_pending,
                reports_pending=counts.reports_pending,
                partner_leads_open=counts.partner_leads_open,
                organizations_pending_review=counts.organizations_pending_review,
            ),
            partners=AdminCockpitPartnersMetrics(
                active=counts.partner_status_active,
                signed=counts.partner_status_signed,
                premium=counts.partner_status_premium,
                founding_partner=counts.partner_status_founding_partner,
                paused=counts.partner_status_paused,
                public=counts.org_public_with_partner,
                private=counts.org_private_with_partner,
                verified=counts.org_verified_with_partner,
                pending_review=counts.org_pending_review_with_partner,
            ),
            passport=AdminCockpitPassportMetrics(
                passports_total=counts.passports_total,
                stamps_total=counts.stamps_total,
                qr_stamps=counts.qr_stamps,
                partner_stamps=counts.partner_stamps,
                redemptions_total=counts.redemptions_total,
                redemptions_completed=counts.redemptions_completed,
            ),
            signals=AdminCockpitSignalsMetrics(
                offers_published=counts.offers_published,
                stamps_today=counts.stamps_today,
                redemptions_today=counts.redemptions_today,
                passports_last_7_days=counts.passports_last_7_days,
                events_upcoming=counts.events_upcoming,
                territory_event_health=TerritoryEventHealthFields(
                    status=event_health.status.value,
                    upcoming_published_count=event_health.upcoming_published_count,
                    label=event_health.label,
                    signal_emoji=event_health.signal_emoji,
                ),
                top_stamp_partner=AdminCockpitTopStampPartner(
                    organization_id=counts.top_stamp_partner_org_id,
                    name=counts.top_stamp_partner_name,
                    stamps_count=counts.top_stamp_partner_stamps,
                ),
            ),
        )
        await set_cached_model(cache_key, response, COCKPIT_SUMMARY_TTL_SECONDS)
        return response
