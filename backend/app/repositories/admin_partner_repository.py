"""Admin partner detail read persistence (ADMIN-02D1)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy.sql import Select

from app.core.local_event_constants import LocalEventModerationStatus
from app.core.partner_creator_content_constants import PartnerCreatorContentStatus
from app.core.passport_constants import OfferRedemptionStatus, PartnerOfferStatus
from app.models.local_event import LocalEvent
from app.models.organization import Organization
from app.models.partner_admin_action import PartnerAdminAction
from app.models.partner_creator_content import PartnerCreatorContent
from app.models.partner_profile import PartnerProfile
from app.models.passport import PartnerOffer, PassportOfferRedemption, PassportStamp


@dataclass(frozen=True, slots=True)
class AdminPartnerDetailRow:
    organization: Organization
    partner_profile: PartnerProfile | None


@dataclass(frozen=True, slots=True)
class AdminPartnerOperationalCountersRaw:
    offers_total: int
    offers_pending: int
    offers_published: int
    creator_contents_total: int
    creator_contents_pending: int
    events_total: int
    events_pending: int
    stamps_total: int
    redemptions_total: int
    redemptions_completed: int


class AdminPartnerRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_detail_row(self, organization_id: UUID) -> AdminPartnerDetailRow | None:
        stmt = (
            select(Organization)
            .options(joinedload(Organization.partner_profile))
            .where(Organization.id == organization_id)
        )
        result = await self._session.execute(stmt)
        org = result.unique().scalar_one_or_none()
        if org is None:
            return None
        profile = org.partner_profile
        return AdminPartnerDetailRow(organization=org, partner_profile=profile)

    async def fetch_counters(self, organization_id: UUID) -> AdminPartnerOperationalCountersRaw:
        return AdminPartnerOperationalCountersRaw(
            offers_total=await self._count_offers(organization_id),
            offers_pending=await self._count_offers(
                organization_id,
                status=PartnerOfferStatus.PENDING_REVIEW.value,
            ),
            offers_published=await self._count_offers(
                organization_id,
                status=PartnerOfferStatus.PUBLISHED.value,
            ),
            creator_contents_total=await self._count_creator_contents(organization_id),
            creator_contents_pending=await self._count_creator_contents(
                organization_id,
                status=PartnerCreatorContentStatus.PENDING_REVIEW.value,
            ),
            events_total=await self._count_events(organization_id),
            events_pending=await self._count_events(
                organization_id,
                moderation_status=LocalEventModerationStatus.PENDING_REVIEW.value,
            ),
            stamps_total=await self._count_stamps(organization_id),
            redemptions_total=await self._count_redemptions(organization_id),
            redemptions_completed=await self._count_redemptions(
                organization_id,
                status=OfferRedemptionStatus.COMPLETED.value,
            ),
        )

    async def _scalar_count(self, stmt: Select[tuple[int]]) -> int:
        result = await self._session.execute(stmt)
        return int(result.scalar_one() or 0)

    async def _count_offers(
        self,
        organization_id: UUID,
        *,
        status: str | None = None,
    ) -> int:
        stmt = (
            select(func.count())
            .select_from(PartnerOffer)
            .where(PartnerOffer.organization_id == organization_id)
        )
        if status is not None:
            stmt = stmt.where(PartnerOffer.status == status)
        return await self._scalar_count(stmt)

    async def _count_creator_contents(
        self,
        organization_id: UUID,
        *,
        status: str | None = None,
    ) -> int:
        stmt = (
            select(func.count())
            .select_from(PartnerCreatorContent)
            .where(PartnerCreatorContent.organization_id == organization_id)
        )
        if status is not None:
            stmt = stmt.where(PartnerCreatorContent.status == status)
        return await self._scalar_count(stmt)

    async def _count_events(
        self,
        organization_id: UUID,
        *,
        moderation_status: str | None = None,
    ) -> int:
        stmt = (
            select(func.count())
            .select_from(LocalEvent)
            .where(LocalEvent.organization_id == organization_id)
        )
        if moderation_status is not None:
            stmt = stmt.where(LocalEvent.moderation_status == moderation_status)
        return await self._scalar_count(stmt)

    async def _count_stamps(self, organization_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(PassportStamp)
            .where(PassportStamp.organization_id == organization_id)
        )
        return await self._scalar_count(stmt)

    async def _count_redemptions(
        self,
        organization_id: UUID,
        *,
        status: str | None = None,
    ) -> int:
        stmt = (
            select(func.count())
            .select_from(PassportOfferRedemption)
            .join(PartnerOffer, PassportOfferRedemption.partner_offer_id == PartnerOffer.id)
            .where(PartnerOffer.organization_id == organization_id)
        )
        if status is not None:
            stmt = stmt.where(PassportOfferRedemption.status == status)
        return await self._scalar_count(stmt)

    async def add_partner_profile(self, profile: PartnerProfile) -> PartnerProfile:
        self._session.add(profile)
        await self._session.flush()
        return profile

    async def update_organization(self, organization: Organization) -> Organization:
        await self._session.flush()
        return organization

    async def update_partner_profile(self, profile: PartnerProfile) -> PartnerProfile:
        await self._session.flush()
        return profile

    async def record_admin_action(
        self,
        *,
        organization_id: UUID,
        partner_profile_id: UUID | None,
        action: str,
        actor_user_id: UUID,
        previous_status: str | None = None,
        new_status: str | None = None,
        previous_visibility: str | None = None,
        new_visibility: str | None = None,
        reason: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> PartnerAdminAction:
        entry = PartnerAdminAction(
            organization_id=organization_id,
            partner_profile_id=partner_profile_id,
            action=action,
            actor_user_id=actor_user_id,
            previous_status=previous_status,
            new_status=new_status,
            previous_visibility=previous_visibility,
            new_visibility=new_visibility,
            reason=reason,
            metadata_=metadata,
        )
        self._session.add(entry)
        await self._session.flush()
        return entry

    async def count_admin_actions(self, organization_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(PartnerAdminAction)
            .where(PartnerAdminAction.organization_id == organization_id)
        )
        return await self._scalar_count(stmt)

    async def get_latest_admin_action(
        self,
        organization_id: UUID,
    ) -> PartnerAdminAction | None:
        stmt = (
            select(PartnerAdminAction)
            .where(PartnerAdminAction.organization_id == organization_id)
            .order_by(PartnerAdminAction.created_at.desc())
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()
