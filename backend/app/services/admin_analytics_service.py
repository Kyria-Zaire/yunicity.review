"""Admin analytics summary service (ADMIN-ANALYTICS-01)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.local_event_constants import LocalEventModerationStatus
from app.core.organization_constants import OrganizationVisibility
from app.core.partner_constants import PartnerStatus
from app.core.partner_creator_content_constants import PartnerCreatorContentStatus
from app.core.partner_lead_constants import PartnerLeadStatus
from app.core.passport_constants import PartnerOfferStatus, PassportStampSource
from app.integrations.cache import (
    ANALYTICS_SUMMARY_TTL_SECONDS,
    get_cached_model,
    set_cached_model,
)
from app.repositories.admin_analytics_repository import AdminAnalyticsRepository
from app.schemas.admin_analytics import (
    ANALYTICS_PERIOD_DAYS,
    AdminAnalyticsAttention,
    AdminAnalyticsCreators,
    AdminAnalyticsCrm,
    AdminAnalyticsEvents,
    AdminAnalyticsGrowth,
    AdminAnalyticsOffers,
    AdminAnalyticsPartners,
    AdminAnalyticsPassport,
    AdminAnalyticsPeriod,
    AdminAnalyticsScope,
    AdminAnalyticsSummaryResponse,
    resolve_analytics_city,
)


class AdminAnalyticsService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = AdminAnalyticsRepository(session)

    async def get_summary(
        self,
        *,
        city: str | None,
        period: AdminAnalyticsPeriod,
        compare_enabled: bool,
    ) -> AdminAnalyticsSummaryResponse:
        resolved_city = resolve_analytics_city(city)
        cache_key = (
            f"admin:analytics:summary:v2:{resolved_city.lower()}"
            f":{period}:{int(compare_enabled)}"
        )
        cached = await get_cached_model(cache_key, AdminAnalyticsSummaryResponse)
        if cached is not None:
            return cached
        now = datetime.now(UTC)
        period_days = ANALYTICS_PERIOD_DAYS[period]
        period_start, period_end = _period_bounds(now=now, days=period_days)

        new_users = await self._repo.count_new_users_in_period(
            city=resolved_city,
            period_start=period_start,
            period_end=period_end,
        )
        new_users_previous = 0
        growth_rate: float | None = None
        if compare_enabled:
            previous_start, previous_end = _previous_period_bounds(now=now, days=period_days)
            new_users_previous = await self._repo.count_new_users_in_period(
                city=resolved_city,
                period_start=previous_start,
                period_end=previous_end,
            )
            growth_rate = _growth_rate_percent(new_users, new_users_previous)

        response = AdminAnalyticsSummaryResponse(
            generated_at=now,
            scope=AdminAnalyticsScope(
                city=resolved_city,
                period=period,
                compare_enabled=compare_enabled,
            ),
            growth=AdminAnalyticsGrowth(
                active_users=await self._repo.count_active_users_in_city(city=resolved_city),
                new_users=new_users,
                new_users_previous_period=new_users_previous,
                growth_rate_percent=growth_rate,
            ),
            passport=AdminAnalyticsPassport(
                active_passports=await self._repo.count_active_passports(city=resolved_city),
                activated_in_period=await self._repo.count_passports_created_in_period(
                    city=resolved_city,
                    period_start=period_start,
                    period_end=period_end,
                ),
                stamps_total=await self._repo.count_stamps(city=resolved_city),
                stamps_in_period=await self._repo.count_stamps_in_period(
                    city=resolved_city,
                    period_start=period_start,
                    period_end=period_end,
                ),
                qr_claims_in_period=await self._repo.count_stamps_in_period(
                    city=resolved_city,
                    period_start=period_start,
                    period_end=period_end,
                    stamp_source=PassportStampSource.QR.value,
                ),
                partner_claims_in_period=await self._repo.count_stamps_in_period(
                    city=resolved_city,
                    period_start=period_start,
                    period_end=period_end,
                    stamp_source=PassportStampSource.ORGANIZATION.value,
                ),
                redemptions_in_period=await self._repo.count_redemptions_in_period(
                    city=resolved_city,
                    period_start=period_start,
                    period_end=period_end,
                ),
            ),
            partners=AdminAnalyticsPartners(
                total_partners=await self._repo.count_partner_profiles(city=resolved_city),
                signed=await self._repo.count_partner_profiles(
                    city=resolved_city,
                    partner_status=PartnerStatus.SIGNED.value,
                ),
                active=await self._repo.count_partner_profiles(
                    city=resolved_city,
                    partner_status=PartnerStatus.ACTIVE.value,
                ),
                premium=await self._repo.count_partner_profiles(
                    city=resolved_city,
                    partner_status=PartnerStatus.PREMIUM.value,
                ),
                founding=await self._repo.count_partner_profiles(
                    city=resolved_city,
                    partner_status=PartnerStatus.FOUNDING_PARTNER.value,
                ),
                public_visible=await self._repo.count_orgs_with_partner(
                    city=resolved_city,
                    visibility=OrganizationVisibility.PUBLIC.value,
                ),
                pending_verification=await self._repo.count_organizations_pending(
                    city=resolved_city
                ),
            ),
            offers=AdminAnalyticsOffers(
                total=await self._repo.count_offers(city=resolved_city),
                published=await self._repo.count_offers(
                    city=resolved_city,
                    status=PartnerOfferStatus.PUBLISHED.value,
                ),
                pending_review=await self._repo.count_offers(
                    city=resolved_city,
                    status=PartnerOfferStatus.PENDING_REVIEW.value,
                ),
                draft=await self._repo.count_offers(
                    city=resolved_city,
                    status=PartnerOfferStatus.DRAFT.value,
                ),
                archived=await self._repo.count_offers(
                    city=resolved_city,
                    status=PartnerOfferStatus.ARCHIVED.value,
                ),
            ),
            events=AdminAnalyticsEvents(
                total=await self._repo.count_events(city=resolved_city),
                published=await self._repo.count_events(
                    city=resolved_city,
                    moderation_status=LocalEventModerationStatus.APPROVED.value,
                    is_cancelled=False,
                ),
                upcoming=await self._repo.count_events_upcoming_published(
                    city=resolved_city,
                    now=now,
                ),
                past=await self._repo.count_events_past_published(
                    city=resolved_city,
                    now=now,
                ),
                pending_review=await self._repo.count_events(
                    city=resolved_city,
                    moderation_status=LocalEventModerationStatus.PENDING_REVIEW.value,
                    is_cancelled=False,
                ),
                cancelled=await self._repo.count_events(city=resolved_city, is_cancelled=True),
                archived=await self._repo.count_events(
                    city=resolved_city,
                    moderation_status=LocalEventModerationStatus.REJECTED.value,
                ),
            ),
            creators=AdminAnalyticsCreators(
                contents_total=await self._repo.count_creator_contents(city=resolved_city),
                published=await self._repo.count_creator_contents(
                    city=resolved_city,
                    status=PartnerCreatorContentStatus.PUBLISHED.value,
                ),
                pending_review=await self._repo.count_creator_contents(
                    city=resolved_city,
                    status=PartnerCreatorContentStatus.PENDING_REVIEW.value,
                ),
                rejected=await self._repo.count_creator_contents(
                    city=resolved_city,
                    status=PartnerCreatorContentStatus.REJECTED.value,
                ),
                active_creators=await self._repo.count_active_creators(city=resolved_city),
            ),
            crm=AdminAnalyticsCrm(
                total_leads=await self._repo.count_leads(city=resolved_city),
                new=await self._repo.count_leads(
                    city=resolved_city,
                    status=PartnerLeadStatus.NEW.value,
                ),
                contacted=await self._repo.count_leads(
                    city=resolved_city,
                    status=PartnerLeadStatus.CONTACTED.value,
                ),
                interested=await self._repo.count_leads(
                    city=resolved_city,
                    status=PartnerLeadStatus.INTERESTED.value,
                ),
                meeting_scheduled=await self._repo.count_leads(
                    city=resolved_city,
                    status=PartnerLeadStatus.MEETING_SCHEDULED.value,
                ),
                converted=await self._repo.count_leads(
                    city=resolved_city,
                    status=PartnerLeadStatus.CONVERTED.value,
                ),
                rejected=await self._repo.count_leads(
                    city=resolved_city,
                    status=PartnerLeadStatus.REJECTED.value,
                ),
                archived=await self._repo.count_leads(
                    city=resolved_city,
                    status=PartnerLeadStatus.ARCHIVED.value,
                ),
            ),
            attention=AdminAnalyticsAttention(
                pending_offers=await self._repo.count_offers(
                    city=resolved_city,
                    status=PartnerOfferStatus.PENDING_REVIEW.value,
                ),
                pending_events=await self._repo.count_events(
                    city=resolved_city,
                    moderation_status=LocalEventModerationStatus.PENDING_REVIEW.value,
                    is_cancelled=False,
                ),
                pending_creator_contents=await self._repo.count_creator_contents(
                    city=resolved_city,
                    status=PartnerCreatorContentStatus.PENDING_REVIEW.value,
                ),
                pending_partner_verifications=await self._repo.count_organizations_pending(
                    city=resolved_city
                ),
                open_leads=await self._repo.count_leads_open(city=resolved_city),
            ),
        )
        await set_cached_model(cache_key, response, ANALYTICS_SUMMARY_TTL_SECONDS)
        return response


def _period_bounds(*, now: datetime, days: int) -> tuple[datetime, datetime]:
    end = now
    start = now - timedelta(days=days)
    return start, end


def _previous_period_bounds(*, now: datetime, days: int) -> tuple[datetime, datetime]:
    end = now - timedelta(days=days)
    start = end - timedelta(days=days)
    return start, end


def _growth_rate_percent(current: int, previous: int) -> float | None:
    if previous <= 0:
        return None
    return round(((current - previous) / previous) * 100.0, 1)
