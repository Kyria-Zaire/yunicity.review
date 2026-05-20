"""Territorial memory stamps — award on real interactions (TICKET-504)."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.flash_offer import is_flash_active
from app.core.local_stamp_constants import LocalStampSlug
from app.models.local_stamp import CitizenLocalStamp, StampDefinition
from app.models.organization import Organization
from app.models.passport import PartnerOffer, Passport
from app.repositories.local_stamp_repository import LocalStampRepository

logger = logging.getLogger(__name__)


class LocalStampService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = LocalStampRepository(session)

    async def evaluate_after_redemption(
        self,
        *,
        passport: Passport,
        offer: PartnerOffer,
        organization: Organization,
        redeemed_at: datetime,
        via_partner_scan: bool,
        send_notifications: bool = True,
    ) -> list[CitizenLocalStamp]:
        """Award MVP stamps after a completed redemption; returns newly created rows."""
        created: list[CitizenLocalStamp] = []
        city = passport.city.strip() or organization.city.strip()

        place = await self._try_award(
            slug=LocalStampSlug.FIRST_LOCAL_PLACE,
            user_id=passport.user_id,
            city=city,
            organization_id=organization.id,
            partner_offer_id=offer.id,
            earned_at=redeemed_at,
            organization=organization,
            offer=offer,
        )
        if place is not None:
            created.append(place)

        if via_partner_scan:
            scan_stamp = await self._try_award(
                slug=LocalStampSlug.FIRST_SCAN_VALIDATED,
                user_id=passport.user_id,
                city=city,
                organization_id=None,
                partner_offer_id=offer.id,
                earned_at=redeemed_at,
                organization=organization,
                offer=offer,
            )
            if scan_stamp is not None:
                created.append(scan_stamp)

        if is_flash_active(offer, now=redeemed_at):
            flash_stamp = await self._try_award(
                slug=LocalStampSlug.FIRST_FLASH_MEMORY,
                user_id=passport.user_id,
                city=city,
                organization_id=None,
                partner_offer_id=offer.id,
                earned_at=redeemed_at,
                organization=organization,
                offer=offer,
            )
            if flash_stamp is not None:
                created.append(flash_stamp)

        if send_notifications:
            for stamp in created:
                await self.notify_stamp_earned(passport.user_id, stamp)

        if created:
            logger.info(
                "local_stamps_awarded",
                extra={
                    "user_id": str(passport.user_id),
                    "count": len(created),
                    "slugs": [s.definition.slug for s in created if s.definition],
                },
            )
        return created

    async def _try_award(
        self,
        *,
        slug: LocalStampSlug,
        user_id: uuid.UUID,
        city: str,
        organization_id: uuid.UUID | None,
        partner_offer_id: uuid.UUID | None,
        earned_at: datetime,
        organization: Organization,
        offer: PartnerOffer,
    ) -> CitizenLocalStamp | None:
        definition = await self._repo.get_definition_by_slug(slug)
        if definition is None:
            return None
        if await self._repo.has_stamp(
            user_id=user_id,
            definition_id=definition.id,
            organization_id=organization_id,
        ):
            return None

        metadata = self._build_metadata(organization=organization, offer=offer, city=city)
        stamp = CitizenLocalStamp(
            user_id=user_id,
            stamp_definition_id=definition.id,
            organization_id=organization_id,
            partner_offer_id=partner_offer_id,
            city=city,
            earned_at=earned_at,
            metadata_=metadata,
        )
        return await self._repo.add_stamp(stamp)

    @staticmethod
    def _build_metadata(
        *,
        organization: Organization,
        offer: PartnerOffer,
        city: str,
    ) -> dict[str, Any]:
        return {
            "partner_name": organization.name,
            "offer_title": offer.title,
            "city": city,
        }

    async def notify_stamp_earned(
        self,
        user_id: uuid.UUID,
        stamp: CitizenLocalStamp,
    ) -> None:
        from app.services.social_notification_service import SocialNotificationService

        definition = stamp.definition
        if definition is None:
            return
        await SocialNotificationService(self._session).notify_local_stamp_earned(
            target_user_id=user_id,
            stamp_title=definition.title,
            city=stamp.city,
        )

    @staticmethod
    def human_line(stamp: CitizenLocalStamp, definition: StampDefinition) -> str:
        """Short copy for API/UI — e.g. « Premier café découvert à Reims. »"""
        meta = stamp.metadata_ or {}
        partner = meta.get("partner_name")
        city = stamp.city or meta.get("city") or ""
        if partner and definition.slug == LocalStampSlug.FIRST_LOCAL_PLACE.value:
            return f"{definition.title} chez {partner} à {city}."
        if city:
            return f"{definition.title} à {city}."
        return definition.title
