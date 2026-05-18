"""Partner offer persistence — visibility, moderation, org-scoped lists."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.organization_constants import (
    OrganizationMemberRole,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.passport_constants import OfferRedemptionStatus, PartnerOfferStatus
from app.models.organization import Organization, OrganizationMember
from app.models.passport import PartnerOffer, PassportOfferRedemption

_OFFER_MANAGER_ROLES = (
    OrganizationMemberRole.OWNER.value,
    OrganizationMemberRole.ADMIN.value,
)


class PartnerOfferRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _visible_offer_filters(self, *, now: datetime) -> tuple[Any, ...]:
        return (
            Organization.verification_status == VerificationStatus.VERIFIED.value,
            Organization.visibility == OrganizationVisibility.PUBLIC.value,
            PartnerOffer.status == PartnerOfferStatus.PUBLISHED.value,
            PartnerOffer.is_active.is_(True),
            (PartnerOffer.valid_from.is_(None)) | (PartnerOffer.valid_from <= now),
            (PartnerOffer.valid_until.is_(None)) | (PartnerOffer.valid_until >= now),
        )

    async def list_visible_offers(self, *, now: datetime) -> list[PartnerOffer]:
        result = await self._session.execute(
            select(PartnerOffer)
            .join(Organization, PartnerOffer.organization_id == Organization.id)
            .options(selectinload(PartnerOffer.organization))
            .where(*self._visible_offer_filters(now=now))
            .order_by(PartnerOffer.created_at.desc())
        )
        return list(result.scalars().unique().all())

    async def get_visible_offer_by_id(
        self,
        offer_id: uuid.UUID,
        *,
        now: datetime,
    ) -> PartnerOffer | None:
        result = await self._session.execute(
            select(PartnerOffer)
            .join(Organization, PartnerOffer.organization_id == Organization.id)
            .options(selectinload(PartnerOffer.organization))
            .where(PartnerOffer.id == offer_id, *self._visible_offer_filters(now=now))
        )
        return result.scalar_one_or_none()

    async def count_completed_redemptions(self, partner_offer_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(PassportOfferRedemption)
            .where(
                PassportOfferRedemption.partner_offer_id == partner_offer_id,
                PassportOfferRedemption.status == OfferRedemptionStatus.COMPLETED.value,
            )
        )
        return int(result.scalar_one())

    async def get_by_id(self, offer_id: uuid.UUID) -> PartnerOffer | None:
        result = await self._session.execute(
            select(PartnerOffer)
            .options(selectinload(PartnerOffer.organization))
            .where(PartnerOffer.id == offer_id)
        )
        return result.scalar_one_or_none()

    async def list_admin(
        self,
        *,
        offer_status: str | None,
        offer_type: str | None,
        organization_id: uuid.UUID | None,
        page: int,
        page_size: int,
    ) -> tuple[list[PartnerOffer], int]:
        return await self._list_filtered(
            offer_status=offer_status,
            offer_type=offer_type,
            organization_id=organization_id,
            organization_ids=None,
            page=page,
            page_size=page_size,
        )

    async def list_for_organization_ids(
        self,
        *,
        organization_ids: list[uuid.UUID],
        offer_status: str | None,
        offer_type: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[PartnerOffer], int]:
        if not organization_ids:
            return [], 0
        return await self._list_filtered(
            offer_status=offer_status,
            offer_type=offer_type,
            organization_id=None,
            organization_ids=organization_ids,
            page=page,
            page_size=page_size,
        )

    async def list_pending_moderation(
        self,
        *,
        page: int,
        page_size: int,
    ) -> tuple[list[PartnerOffer], int]:
        return await self._list_filtered(
            offer_status=PartnerOfferStatus.PENDING_REVIEW.value,
            offer_type=None,
            organization_id=None,
            organization_ids=None,
            page=page,
            page_size=page_size,
        )

    async def _list_filtered(
        self,
        *,
        offer_status: str | None,
        offer_type: str | None,
        organization_id: uuid.UUID | None,
        organization_ids: list[uuid.UUID] | None,
        page: int,
        page_size: int,
    ) -> tuple[list[PartnerOffer], int]:
        filters: list[Any] = []
        if offer_status:
            filters.append(PartnerOffer.status == offer_status)
        if offer_type:
            filters.append(PartnerOffer.offer_type == offer_type)
        if organization_id:
            filters.append(PartnerOffer.organization_id == organization_id)
        if organization_ids is not None:
            filters.append(PartnerOffer.organization_id.in_(organization_ids))

        count_stmt = select(func.count()).select_from(PartnerOffer)
        if filters:
            count_stmt = count_stmt.where(*filters)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        stmt = (
            select(PartnerOffer)
            .options(selectinload(PartnerOffer.organization))
            .order_by(PartnerOffer.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        if filters:
            stmt = stmt.where(*filters)
        result = await self._session.execute(stmt)
        return list(result.scalars().all()), total

    async def list_managed_organization_ids(self, user_id: uuid.UUID) -> list[uuid.UUID]:
        result = await self._session.execute(
            select(OrganizationMember.organization_id)
            .join(Organization, Organization.id == OrganizationMember.organization_id)
            .where(
                OrganizationMember.user_id == user_id,
                OrganizationMember.status == "active",
                OrganizationMember.role.in_(_OFFER_MANAGER_ROLES),
                Organization.verification_status == VerificationStatus.VERIFIED.value,
            )
        )
        return list(result.scalars().all())

    async def create(self, offer: PartnerOffer) -> PartnerOffer:
        self._session.add(offer)
        await self._session.flush()
        await self._session.refresh(offer, attribute_names=["organization"])
        return offer

    async def update_fields(self, offer: PartnerOffer, *, fields: dict[str, Any]) -> PartnerOffer:
        for key, value in fields.items():
            setattr(offer, key, value)
        await self._session.flush()
        return offer

    async def list_verified_organizations(self) -> list[Organization]:
        result = await self._session.execute(
            select(Organization)
            .where(Organization.verification_status == VerificationStatus.VERIFIED.value)
            .order_by(Organization.name.asc())
        )
        return list(result.scalars().all())
