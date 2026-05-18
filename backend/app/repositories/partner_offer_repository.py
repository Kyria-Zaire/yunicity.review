"""Partner offer persistence — visible offers and redemption helpers."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.organization_constants import OrganizationVisibility, VerificationStatus
from app.core.passport_constants import PartnerOfferStatus
from app.models.organization import Organization
from app.models.passport import PartnerOffer


class PartnerOfferRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _visible_offer_filters(self, *, now: datetime) -> tuple[Any, ...]:
        return (
            Organization.verification_status == VerificationStatus.VERIFIED.value,
            Organization.visibility == OrganizationVisibility.PUBLIC.value,
            PartnerOffer.status == PartnerOfferStatus.ACTIVE.value,
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
        from app.core.passport_constants import OfferRedemptionStatus
        from app.models.passport import PassportOfferRedemption

        result = await self._session.execute(
            select(func.count())
            .select_from(PassportOfferRedemption)
            .where(
                PassportOfferRedemption.partner_offer_id == partner_offer_id,
                PassportOfferRedemption.status == OfferRedemptionStatus.COMPLETED.value,
            )
        )
        return int(result.scalar_one())
