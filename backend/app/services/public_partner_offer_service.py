"""Public partner offer catalog (WEB-PARTNERS-03 / 08B)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES, PartnerStatus
from app.core.passport_constants import PartnerOfferType, PassportTierCode
from app.core.passport_level_rules import tier_can_access
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile
from app.models.passport import PartnerOffer
from app.models.user import User
from app.repositories.partner_offer_repository import PartnerOfferRepository
from app.repositories.partner_repository import PartnerRepository
from app.repositories.passport_repository import PassportRepository
from app.schemas.partner_offer_public import (
    PartnerOfferPartnerSummary,
    PartnerOfferPublic,
    PartnerOfferPublicListResponse,
)
from app.services.partner_offer_readiness_mapper import build_partner_offer_readiness_fields


class PublicPartnerOfferService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._offers = PartnerOfferRepository(session)
        self._partners = PartnerRepository(session)
        self._passports = PassportRepository(session)

    async def list_catalog(
        self,
        *,
        city: str,
        partner_slug: str | None,
        featured_only: bool,
        offer_type: PartnerOfferType | None,
        limit: int,
        offset: int,
    ) -> PartnerOfferPublicListResponse:
        trimmed_city = city.strip()
        capped_limit = min(max(limit, 1), 100)
        safe_offset = max(offset, 0)
        now = datetime.now(UTC)
        rows, total = await self._offers.list_public_catalog(
            city=trimmed_city,
            partner_slug=partner_slug.strip().lower() if partner_slug else None,
            featured_only=featured_only,
            offer_type=offer_type.value if offer_type else None,
            now=now,
            limit=capped_limit,
            offset=safe_offset,
        )
        return PartnerOfferPublicListResponse(
            city=trimmed_city,
            items=[self._to_public_item(row) for row in rows],
            count=len(rows),
            total=total,
            offset=safe_offset,
            limit=capped_limit,
        )

    async def list_for_partner_slug(
        self,
        *,
        city: str,
        slug: str,
        limit: int,
        offset: int,
    ) -> PartnerOfferPublicListResponse:
        profile = await self._require_public_partner(city=city, slug=slug)
        return await self.list_catalog(
            city=city,
            partner_slug=profile.organization.slug,
            featured_only=False,
            offer_type=None,
            limit=limit,
            offset=offset,
        )

    async def list_for_passport_user(
        self,
        user: User,
        *,
        city: str | None,
        partner_slug: str | None,
        featured_only: bool,
        offer_type: PartnerOfferType | None,
        limit: int,
        offset: int,
    ) -> PartnerOfferPublicListResponse:
        passport = await self._passports.get_active_for_user(user.id)
        if passport is None:
            raise AppError(
                status_code=404,
                code="PASSPORT_NOT_FOUND",
                detail="Activez votre Passport pour voir les offres.",
            )
        resolved_city = (city or passport.city or "Reims").strip()
        tier_code = passport.tier.code if passport.tier else PassportTierCode.BASIC.value
        catalog = await self.list_catalog(
            city=resolved_city,
            partner_slug=partner_slug,
            featured_only=featured_only,
            offer_type=offer_type,
            limit=limit,
            offset=offset,
        )
        filtered = [
            item
            for item in catalog.items
            if tier_can_access(item.tier_code_required, tier_code)
        ]
        return catalog.model_copy(
            update={
                "city": resolved_city,
                "items": filtered,
                "count": len(filtered),
                "total": len(filtered),
            }
        )

    async def _require_public_partner(self, *, city: str, slug: str) -> PartnerProfile:
        profile = await self._partners.get_by_slug(city=city.strip(), slug=slug.strip().lower())
        if profile is None:
            raise AppError(404, "PARTNER_NOT_FOUND", "Partenaire introuvable.")
        try:
            status = PartnerStatus(profile.partner_status)
        except ValueError:
            raise AppError(404, "PARTNER_NOT_FOUND", "Partenaire introuvable.") from None
        if status not in PUBLIC_PARTNER_STATUSES:
            raise AppError(404, "PARTNER_NOT_FOUND", "Partenaire introuvable.")
        return profile

    def _to_public_item(self, offer: PartnerOffer) -> PartnerOfferPublic:
        org = offer.organization
        profile = org.partner_profile
        partner_status = PartnerStatus.ACTIVE
        if profile is not None:
            partner_status = (
                profile.partner_status
                if isinstance(profile.partner_status, PartnerStatus)
                else PartnerStatus(profile.partner_status)
            )
        readiness = build_partner_offer_readiness_fields(offer, org=org)
        return PartnerOfferPublic(
            id=offer.id,
            slug=offer.slug,
            title=offer.title,
            description=offer.description,
            value_label=offer.value_label,
            offer_type=(
                offer.offer_type
                if isinstance(offer.offer_type, PartnerOfferType)
                else PartnerOfferType(offer.offer_type)
            ),
            conditions=offer.conditions,
            valid_from=offer.valid_from,
            valid_until=offer.valid_until,
            is_featured=offer.is_featured,
            tier_code_required=offer.tier_code_required,
            readiness=readiness,
            is_passport_eligible=readiness.is_passport_eligible,
            partner=self._partner_summary(org, partner_status),
        )

    def _partner_summary(
        self,
        org: Organization,
        partner_status: PartnerStatus,
    ) -> PartnerOfferPartnerSummary:
        return PartnerOfferPartnerSummary(
            name=org.name,
            slug=org.slug,
            city=org.city,
            category=org.category,
            logo_url=org.logo_url,
            cover_image_url=org.banner_url,
            is_verified=PartnerRepository.is_verified_organization(org),
            partner_status=partner_status,
        )
