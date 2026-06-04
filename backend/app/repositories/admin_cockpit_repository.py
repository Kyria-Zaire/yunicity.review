"""Admin cockpit aggregate counts (ADMIN-01A)."""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

from app.core.feed_constants import ReportStatus
from app.core.local_event_constants import LocalEventModerationStatus
from app.core.organization_constants import (
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.partner_constants import PartnerStatus
from app.core.partner_creator_content_constants import PartnerCreatorContentStatus
from app.core.partner_lead_constants import PartnerLeadStatus
from app.core.passport_constants import (
    OfferRedemptionStatus,
    PartnerOfferStatus,
    PassportStampSource,
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
from app.models.report import Report
from app.models.user import User

# Open pipeline leads — excludes signed, converted, rejected, archived.
OPEN_PARTNER_LEAD_STATUSES: frozenset[str] = frozenset(
    {
        PartnerLeadStatus.NEW.value,
        PartnerLeadStatus.CONTACTED.value,
        PartnerLeadStatus.INTERESTED.value,
        PartnerLeadStatus.MEETING_SCHEDULED.value,
    }
)

ORGANIZATION_PENDING_VERIFICATION_STATUSES: frozenset[str] = frozenset(
    {
        VerificationStatus.PENDING.value,
        VerificationStatus.UNDER_REVIEW.value,
    }
)


@dataclass(frozen=True, slots=True)
class AdminCockpitRawCounts:
    users_total: int
    users_active: int
    passports_total_scoped: int
    partners_total: int
    offers_total: int
    events_total: int
    creator_contents_total: int
    partner_leads_total: int
    offers_pending: int
    creator_contents_pending: int
    events_pending: int
    reports_pending: int
    partner_leads_open: int
    organizations_pending_review: int
    partner_status_active: int
    partner_status_signed: int
    partner_status_premium: int
    partner_status_founding_partner: int
    partner_status_paused: int
    org_public_with_partner: int
    org_private_with_partner: int
    org_verified_with_partner: int
    org_pending_review_with_partner: int
    passports_total: int
    stamps_total: int
    qr_stamps: int
    partner_stamps: int
    redemptions_total: int
    redemptions_completed: int


class AdminCockpitRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def fetch_counts(self, city: str) -> AdminCockpitRawCounts:
        """Aggregate cockpit metrics. Users are global; territorial entities use ``city``."""
        return AdminCockpitRawCounts(
            users_total=await self._count_users_total(),
            users_active=await self._count_users_active(),
            passports_total_scoped=await self._count_passports(city=city),
            partners_total=await self._count_partner_profiles(city=city),
            offers_total=await self._count_offers(city=city),
            events_total=await self._count_events(city=city),
            creator_contents_total=await self._count_creator_contents(city=city),
            partner_leads_total=await self._count_leads(city=city),
            offers_pending=await self._count_offers(
                city=city,
                status=PartnerOfferStatus.PENDING_REVIEW.value,
            ),
            creator_contents_pending=await self._count_creator_contents(
                city=city,
                status=PartnerCreatorContentStatus.PENDING_REVIEW.value,
            ),
            events_pending=await self._count_events(
                city=city,
                moderation_status=LocalEventModerationStatus.PENDING_REVIEW.value,
            ),
            reports_pending=await self._count_reports_pending(),
            partner_leads_open=await self._count_leads(
                city=city,
                statuses=OPEN_PARTNER_LEAD_STATUSES,
            ),
            organizations_pending_review=await self._count_organizations_pending(city=city),
            partner_status_active=await self._count_partner_profiles(
                city=city,
                partner_status=PartnerStatus.ACTIVE.value,
            ),
            partner_status_signed=await self._count_partner_profiles(
                city=city,
                partner_status=PartnerStatus.SIGNED.value,
            ),
            partner_status_premium=await self._count_partner_profiles(
                city=city,
                partner_status=PartnerStatus.PREMIUM.value,
            ),
            partner_status_founding_partner=await self._count_partner_profiles(
                city=city,
                partner_status=PartnerStatus.FOUNDING_PARTNER.value,
            ),
            partner_status_paused=await self._count_partner_profiles(
                city=city,
                partner_status=PartnerStatus.PAUSED.value,
            ),
            org_public_with_partner=await self._count_orgs_with_partner(
                city=city,
                visibility=OrganizationVisibility.PUBLIC.value,
            ),
            org_private_with_partner=await self._count_orgs_with_partner(
                city=city,
                visibility=OrganizationVisibility.PRIVATE.value,
            ),
            org_verified_with_partner=await self._count_orgs_with_partner(
                city=city,
                verification_status=VerificationStatus.VERIFIED.value,
            ),
            org_pending_review_with_partner=await self._count_orgs_with_partner(
                city=city,
                verification_statuses=ORGANIZATION_PENDING_VERIFICATION_STATUSES,
            ),
            passports_total=await self._count_passports(city=city),
            stamps_total=await self._count_stamps(city=city),
            qr_stamps=await self._count_stamps(
                city=city,
                stamp_source=PassportStampSource.QR.value,
            ),
            partner_stamps=await self._count_stamps(
                city=city,
                stamp_source=PassportStampSource.ORGANIZATION.value,
            ),
            redemptions_total=await self._count_redemptions(city=city),
            redemptions_completed=await self._count_redemptions(
                city=city,
                status=OfferRedemptionStatus.COMPLETED.value,
            ),
        )

    async def _scalar_count(self, stmt: Select[tuple[int]]) -> int:
        result = await self._session.execute(stmt)
        return int(result.scalar_one() or 0)

    async def _count_users_total(self) -> int:
        return await self._scalar_count(select(func.count()).select_from(User))

    async def _count_users_active(self) -> int:
        return await self._scalar_count(
            select(func.count()).select_from(User).where(User.is_active.is_(True))
        )

    async def _count_passports(self, *, city: str) -> int:
        return await self._scalar_count(
            select(func.count()).select_from(Passport).where(Passport.city == city)
        )

    async def _count_partner_profiles(
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

    async def _count_offers(
        self,
        *,
        city: str,
        status: str | None = None,
    ) -> int:
        stmt = (
            select(func.count())
            .select_from(PartnerOffer)
            .join(Organization, PartnerOffer.organization_id == Organization.id)
            .where(Organization.city == city)
        )
        if status is not None:
            stmt = stmt.where(PartnerOffer.status == status)
        return await self._scalar_count(stmt)

    async def _count_events(
        self,
        *,
        city: str,
        moderation_status: str | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(LocalEvent).where(LocalEvent.city == city)
        if moderation_status is not None:
            stmt = stmt.where(LocalEvent.moderation_status == moderation_status)
        return await self._scalar_count(stmt)

    async def _count_creator_contents(
        self,
        *,
        city: str,
        status: str | None = None,
    ) -> int:
        stmt = (
            select(func.count())
            .select_from(PartnerCreatorContent)
            .join(Organization, PartnerCreatorContent.organization_id == Organization.id)
            .where(Organization.city == city)
        )
        if status is not None:
            stmt = stmt.where(PartnerCreatorContent.status == status)
        return await self._scalar_count(stmt)

    async def _count_leads(
        self,
        *,
        city: str,
        statuses: frozenset[str] | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(PartnerLead).where(PartnerLead.city == city)
        if statuses is not None:
            stmt = stmt.where(PartnerLead.status.in_(statuses))
        return await self._scalar_count(stmt)

    async def _count_organizations_pending(self, *, city: str) -> int:
        return await self._scalar_count(
            select(func.count())
            .select_from(Organization)
            .where(
                Organization.city == city,
                Organization.verification_status.in_(ORGANIZATION_PENDING_VERIFICATION_STATUSES),
            )
        )

    async def _count_orgs_with_partner(
        self,
        *,
        city: str,
        visibility: str | None = None,
        verification_status: str | None = None,
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
        if verification_status is not None:
            stmt = stmt.where(Organization.verification_status == verification_status)
        if verification_statuses is not None:
            stmt = stmt.where(Organization.verification_status.in_(verification_statuses))
        return await self._scalar_count(stmt)

    async def _count_stamps(
        self,
        *,
        city: str,
        stamp_source: str | None = None,
    ) -> int:
        # Stamp city scoping: join passport (passport.city) for territorial filter.
        stmt = (
            select(func.count())
            .select_from(PassportStamp)
            .join(Passport, PassportStamp.passport_id == Passport.id)
            .where(Passport.city == city)
        )
        if stamp_source is not None:
            stmt = stmt.where(PassportStamp.stamp_source == stamp_source)
        return await self._scalar_count(stmt)

    async def _count_reports_pending(self) -> int:
        stmt = select(func.count()).select_from(Report).where(
            Report.status == ReportStatus.PENDING.value
        )
        return await self._scalar_count(stmt)

    async def _count_redemptions(
        self,
        *,
        city: str,
        status: str | None = None,
    ) -> int:
        stmt = (
            select(func.count())
            .select_from(PassportOfferRedemption)
            .join(Passport, PassportOfferRedemption.passport_id == Passport.id)
            .where(Passport.city == city)
        )
        if status is not None:
            stmt = stmt.where(PassportOfferRedemption.status == status)
        return await self._scalar_count(stmt)
