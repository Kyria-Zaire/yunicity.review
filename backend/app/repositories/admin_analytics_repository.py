"""Admin analytics aggregate queries (ADMIN-ANALYTICS-01)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

from app.core.local_event_constants import LocalEventModerationStatus
from app.core.partner_creator_content_constants import PartnerCreatorContentStatus
from app.core.passport_constants import (
    OfferRedemptionStatus,
    PassportStatus,
)
from app.models.local_event import LocalEvent
from app.models.organization import Organization
from app.models.partner_creator_content import PartnerCreatorContent
from app.models.partner_lead import PartnerLead
from app.models.partner_profile import PartnerProfile
from app.models.passport import (
    PartnerOffer,
    Passport,
    PassportOfferRedemption,
    PassportStamp,
)
from app.models.user import User
from app.repositories.admin_cockpit_repository import (
    OPEN_PARTNER_LEAD_STATUSES,
    ORGANIZATION_PENDING_VERIFICATION_STATUSES,
)


class AdminAnalyticsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def count_active_users_in_city(self, *, city: str) -> int:
        stmt = (
            select(func.count(func.distinct(Passport.user_id)))
            .select_from(Passport)
            .join(User, Passport.user_id == User.id)
            .where(
                Passport.city == city,
                Passport.status == PassportStatus.ACTIVE.value,
                User.is_active.is_(True),
            )
        )
        return await self._scalar_count(stmt)

    async def count_new_users_in_period(
        self,
        *,
        city: str,
        period_start: datetime,
        period_end: datetime,
    ) -> int:
        stmt = (
            select(func.count(func.distinct(Passport.user_id)))
            .select_from(Passport)
            .where(
                Passport.city == city,
                Passport.created_at >= period_start,
                Passport.created_at < period_end,
            )
        )
        return await self._scalar_count(stmt)

    async def count_active_passports(self, *, city: str) -> int:
        return await self._scalar_count(
            select(func.count())
            .select_from(Passport)
            .where(
                Passport.city == city,
                Passport.status == PassportStatus.ACTIVE.value,
            )
        )

    async def count_passports_created_in_period(
        self,
        *,
        city: str,
        period_start: datetime,
        period_end: datetime,
    ) -> int:
        return await self._scalar_count(
            select(func.count())
            .select_from(Passport)
            .where(
                Passport.city == city,
                Passport.created_at >= period_start,
                Passport.created_at < period_end,
            )
        )

    async def count_stamps(self, *, city: str) -> int:
        return await self._count_stamps(city=city)

    async def count_stamps_in_period(
        self,
        *,
        city: str,
        period_start: datetime,
        period_end: datetime,
        stamp_source: str | None = None,
    ) -> int:
        return await self._count_stamps(
            city=city,
            period_start=period_start,
            period_end=period_end,
            stamp_source=stamp_source,
        )

    async def count_redemptions_in_period(
        self,
        *,
        city: str,
        period_start: datetime,
        period_end: datetime,
    ) -> int:
        stmt = (
            select(func.count())
            .select_from(PassportOfferRedemption)
            .join(Passport, PassportOfferRedemption.passport_id == Passport.id)
            .where(
                Passport.city == city,
                PassportOfferRedemption.status == OfferRedemptionStatus.COMPLETED.value,
                PassportOfferRedemption.redeemed_at.is_not(None),
                PassportOfferRedemption.redeemed_at >= period_start,
                PassportOfferRedemption.redeemed_at < period_end,
            )
        )
        return await self._scalar_count(stmt)

    async def count_partner_profiles(
        self,
        *,
        city: str,
        partner_status: str | None = None,
    ) -> int:
        stmt = (
            select(func.count())
            .select_from(PartnerProfile)
            .join(Organization, PartnerProfile.organization_id == Organization.id)
            .where(Organization.city == city)
        )
        if partner_status is not None:
            stmt = stmt.where(PartnerProfile.partner_status == partner_status)
        return await self._scalar_count(stmt)

    async def count_orgs_with_partner(
        self,
        *,
        city: str,
        visibility: str | None = None,
        verification_statuses: frozenset[str] | None = None,
    ) -> int:
        stmt = (
            select(func.count())
            .select_from(Organization)
            .join(PartnerProfile, PartnerProfile.organization_id == Organization.id)
            .where(Organization.city == city)
        )
        if visibility is not None:
            stmt = stmt.where(Organization.visibility == visibility)
        if verification_statuses is not None:
            stmt = stmt.where(Organization.verification_status.in_(verification_statuses))
        return await self._scalar_count(stmt)

    async def count_offers(self, *, city: str, status: str | None = None) -> int:
        stmt = (
            select(func.count())
            .select_from(PartnerOffer)
            .join(Organization, PartnerOffer.organization_id == Organization.id)
            .where(Organization.city == city)
        )
        if status is not None:
            stmt = stmt.where(PartnerOffer.status == status)
        return await self._scalar_count(stmt)

    async def count_events(
        self,
        *,
        city: str,
        moderation_status: str | None = None,
        is_cancelled: bool | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(LocalEvent).where(LocalEvent.city == city)
        if moderation_status is not None:
            stmt = stmt.where(LocalEvent.moderation_status == moderation_status)
        if is_cancelled is not None:
            stmt = stmt.where(LocalEvent.is_cancelled.is_(is_cancelled))
        return await self._scalar_count(stmt)

    async def count_events_upcoming_published(self, *, city: str, now: datetime) -> int:
        stmt = (
            select(func.count())
            .select_from(LocalEvent)
            .where(
                LocalEvent.city == city,
                LocalEvent.is_cancelled.is_(False),
                LocalEvent.moderation_status == LocalEventModerationStatus.APPROVED.value,
                LocalEvent.starts_at >= now,
            )
        )
        return await self._scalar_count(stmt)

    async def count_events_past_published(self, *, city: str, now: datetime) -> int:
        stmt = (
            select(func.count())
            .select_from(LocalEvent)
            .where(
                LocalEvent.city == city,
                LocalEvent.is_cancelled.is_(False),
                LocalEvent.moderation_status == LocalEventModerationStatus.APPROVED.value,
                LocalEvent.starts_at < now,
            )
        )
        return await self._scalar_count(stmt)

    async def count_creator_contents(self, *, city: str, status: str | None = None) -> int:
        stmt = (
            select(func.count())
            .select_from(PartnerCreatorContent)
            .join(Organization, PartnerCreatorContent.organization_id == Organization.id)
            .where(Organization.city == city)
        )
        if status is not None:
            stmt = stmt.where(PartnerCreatorContent.status == status)
        return await self._scalar_count(stmt)

    async def count_active_creators(self, *, city: str) -> int:
        stmt = (
            select(func.count(func.distinct(PartnerCreatorContent.organization_id)))
            .select_from(PartnerCreatorContent)
            .join(Organization, PartnerCreatorContent.organization_id == Organization.id)
            .where(
                Organization.city == city,
                PartnerCreatorContent.status == PartnerCreatorContentStatus.PUBLISHED.value,
            )
        )
        return await self._scalar_count(stmt)

    async def count_leads(self, *, city: str, status: str | None = None) -> int:
        stmt = select(func.count()).select_from(PartnerLead).where(PartnerLead.city == city)
        if status is not None:
            stmt = stmt.where(PartnerLead.status == status)
        return await self._scalar_count(stmt)

    async def count_leads_open(self, *, city: str) -> int:
        stmt = (
            select(func.count())
            .select_from(PartnerLead)
            .where(
                PartnerLead.city == city,
                PartnerLead.status.in_(OPEN_PARTNER_LEAD_STATUSES),
            )
        )
        return await self._scalar_count(stmt)

    async def count_organizations_pending(self, *, city: str) -> int:
        return await self._scalar_count(
            select(func.count())
            .select_from(Organization)
            .where(
                Organization.city == city,
                Organization.verification_status.in_(ORGANIZATION_PENDING_VERIFICATION_STATUSES),
            )
        )

    async def _count_stamps(
        self,
        *,
        city: str,
        period_start: datetime | None = None,
        period_end: datetime | None = None,
        stamp_source: str | None = None,
    ) -> int:
        stmt = (
            select(func.count())
            .select_from(PassportStamp)
            .join(Passport, PassportStamp.passport_id == Passport.id)
            .where(Passport.city == city)
        )
        if period_start is not None and period_end is not None:
            stmt = stmt.where(
                PassportStamp.stamped_at >= period_start,
                PassportStamp.stamped_at < period_end,
            )
        if stamp_source is not None:
            stmt = stmt.where(PassportStamp.stamp_source == stamp_source)
        return await self._scalar_count(stmt)

    async def _scalar_count(self, stmt: Select[tuple[int]]) -> int:
        result = await self._session.execute(stmt)
        return int(result.scalar_one() or 0)
