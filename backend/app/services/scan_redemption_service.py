"""Partner scan & passport redemption — MVP in-person flow (TICKET-306)."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.organization_constants import VerificationStatus
from app.core.passport_constants import (
    OfferRedemptionStatus,
    PartnerOfferStatus,
    PassportTierCode,
)
from app.core.passport_qr import normalize_qr_secret
from app.models.passport import PartnerOffer, Passport, PassportOfferRedemption
from app.models.user import User
from app.repositories.partner_offer_repository import PartnerOfferRepository
from app.repositories.passport_repository import PassportRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.scan import (
    ScanPassportPreview,
    ScanRedeemableOffer,
    ScanRedeemResponse,
    ScanResolveResponse,
)
from app.services.organization_membership_service import OrganizationMembershipService

logger = logging.getLogger(__name__)


class ScanRedemptionService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._passports = PassportRepository(session)
        self._offers = PartnerOfferRepository(session)
        self._profiles = ProfileRepository(session)
        self._membership = OrganizationMembershipService(session)

    async def resolve_for_partner(
        self,
        partner_user: User,
        qr_secret: str,
        *,
        client_ip: str,
    ) -> ScanResolveResponse:
        passport = await self._resolve_passport(qr_secret, partner_user.id, client_ip)
        org_ids = await self._offers.list_managed_organization_ids(partner_user.id)
        if not org_ids:
            raise AppError(
                status_code=403,
                code="SCAN_PARTNER_FORBIDDEN",
                detail="Aucun lieu vérifié ne vous autorise à scanner.",
            )

        now = datetime.now(UTC)
        offers = await self._offers.list_published_for_organizations(org_ids, now=now)
        redeemable: list[ScanRedeemableOffer] = []
        for offer in offers:
            existing = await self._passports.get_redemption(
                passport_id=passport.id,
                partner_offer_id=offer.id,
            )
            org = offer.organization
            redeemable.append(
                ScanRedeemableOffer(
                    id=offer.id,
                    title=offer.title,
                    offer_type=offer.offer_type,
                    organization_id=offer.organization_id,
                    organization_name=org.name if org else "Partenaire",
                    already_redeemed=existing is not None
                    and existing.status == OfferRedemptionStatus.COMPLETED.value,
                )
            )

        preview = await self._passport_preview(passport)
        logger.info(
            "scan_resolve_success",
            extra={
                "partner_user_id": str(partner_user.id),
                "passport_id": str(passport.id),
                "client_ip": client_ip,
                "offers_count": len(redeemable),
            },
        )
        return ScanResolveResponse(passport=preview, offers=redeemable)

    async def redeem_for_partner(
        self,
        partner_user: User,
        *,
        offer_id: uuid.UUID,
        qr_secret: str,
        client_ip: str,
    ) -> ScanRedeemResponse:
        passport = await self._resolve_passport(qr_secret, partner_user.id, client_ip)
        now = datetime.now(UTC)
        offer = await self._offers.get_by_id(offer_id)
        if offer is None:
            self._audit_failure(
                "offer_not_found",
                partner_user,
                passport,
                offer_id,
                client_ip,
            )
            raise AppError(
                status_code=404,
                code="OFFER_NOT_FOUND",
                detail="Cette offre n’existe pas.",
            )

        await self._membership.require_offer_manager(
            organization_id=offer.organization_id,
            user_id=partner_user.id,
        )

        if offer.organization.verification_status != VerificationStatus.VERIFIED.value:
            raise AppError(
                status_code=403,
                code="OFFER_NOT_VERIFIED",
                detail="Ce lieu n’est pas encore vérifié.",
            )

        if offer.status != PartnerOfferStatus.PUBLISHED.value or not offer.is_active:
            raise AppError(
                status_code=410,
                code="OFFER_NOT_PUBLISHED",
                detail="Cette offre n’est pas disponible pour le moment.",
            )

        if offer.valid_until and offer.valid_until < now:
            raise AppError(
                status_code=410,
                code="OFFER_EXPIRED",
                detail="Cette offre a expiré.",
            )
        if offer.valid_from and offer.valid_from > now:
            raise AppError(
                status_code=410,
                code="OFFER_NOT_STARTED",
                detail="Cette offre n’est pas encore active.",
            )

        tier_code = passport.tier.code if passport.tier else PassportTierCode.BASIC.value
        if not self._offer_accessible(offer, tier_code):
            raise AppError(
                status_code=403,
                code="OFFER_TIER_REQUIRED",
                detail="Le Passport de ce citoyen ne permet pas cette offre.",
            )

        existing = await self._passports.get_redemption(
            passport_id=passport.id,
            partner_offer_id=offer.id,
        )
        if existing is not None:
            raise AppError(
                status_code=409,
                code="REDEMPTION_ALREADY_EXISTS",
                detail="Cette offre a déjà été utilisée pour ce Passport.",
            )

        if offer.max_redemptions_total is not None:
            used = await self._offers.count_completed_redemptions(offer.id)
            if used >= offer.max_redemptions_total:
                raise AppError(
                    status_code=410,
                    code="OFFER_EXHAUSTED",
                    detail="Cette offre n’est plus disponible.",
                )

        metadata = self._redemption_audit_metadata(
            partner_user_id=partner_user.id,
            organization_id=offer.organization_id,
            client_ip=client_ip,
            event="redemption_success",
        )
        redemption = PassportOfferRedemption(
            passport_id=passport.id,
            partner_offer_id=offer.id,
            status=OfferRedemptionStatus.COMPLETED,
            redeemed_at=now,
            metadata_=metadata,
        )
        try:
            created = await self._passports.create_redemption(redemption)
            await self._passports.increment_redemptions_count(passport)
            stamp_added = await self._passports.add_stamp_if_missing(
                passport_id=passport.id,
                organization_id=offer.organization_id,
                stamped_at=now,
            )
            await self._session.commit()
            await self._session.refresh(created)
        except IntegrityError as exc:
            await self._session.rollback()
            raise AppError(
                status_code=409,
                code="REDEMPTION_ALREADY_EXISTS",
                detail="Cette offre a déjà été utilisée pour ce Passport.",
            ) from exc

        message = self._success_message(offer)
        logger.info(
            "scan_redeem_success",
            extra={
                "partner_user_id": str(partner_user.id),
                "passport_id": str(passport.id),
                "offer_id": str(offer.id),
                "redemption_id": str(created.id),
                "client_ip": client_ip,
            },
        )
        return ScanRedeemResponse(
            success=True,
            redemption_id=created.id,
            offer_id=offer.id,
            offer_title=offer.title,
            offer_type=offer.offer_type,
            message=message,
            stamp_added=stamp_added,
        )

    async def _resolve_passport(
        self,
        qr_secret: str,
        partner_user_id: uuid.UUID,
        client_ip: str,
    ) -> Passport:
        token = normalize_qr_secret(qr_secret)
        if not token:
            raise AppError(
                status_code=422,
                code="QR_INVALID",
                detail="Code Passport invalide.",
            )
        passport = await self._passports.get_active_by_qr_token(token)
        if passport is None:
            logger.warning(
                "scan_passport_not_found",
                extra={"partner_user_id": str(partner_user_id), "client_ip": client_ip},
            )
            raise AppError(
                status_code=404,
                code="PASSPORT_NOT_FOUND",
                detail="Passport introuvable ou inactif.",
            )
        if passport.user and not passport.user.is_active:
            raise AppError(
                status_code=403,
                code="PASSPORT_USER_INACTIVE",
                detail="Ce compte citoyen n’est pas actif.",
            )
        return passport

    async def _passport_preview(self, passport: Passport) -> ScanPassportPreview:
        profile = await self._profiles.get_by_user_id(passport.user_id)
        if profile and profile.display_name:
            label = profile.display_name
        else:
            label = passport.passport_number
        tier = passport.tier
        tier_code = (
            PassportTierCode(tier.code)
            if tier
            else PassportTierCode.BASIC
        )
        return ScanPassportPreview(
            passport_id=passport.id,
            passport_number=passport.passport_number,
            city=passport.city,
            tier_code=tier_code,
            display_label=label,
        )

    @staticmethod
    def _offer_accessible(offer: PartnerOffer, tier_code: str) -> bool:
        required = offer.tier_code_required
        if required is None:
            return True
        return required == tier_code

    @staticmethod
    def _success_message(offer: PartnerOffer) -> str:
        titles = {
            "drink": "Boisson validée avec succès.",
            "discount": "Réduction validée avec succès.",
            "gift": "Cadeau validé avec succès.",
            "vip": "Avantage VIP validé avec succès.",
            "event_access": "Accès événement validé avec succès.",
        }
        return titles.get(offer.offer_type, "Avantage appliqué avec succès.")

    @staticmethod
    def _redemption_audit_metadata(
        *,
        partner_user_id: uuid.UUID,
        organization_id: uuid.UUID,
        client_ip: str,
        event: str,
    ) -> dict[str, Any]:
        return {
            "audit": {
                "event": event,
                "redeemed_by_user_id": str(partner_user_id),
                "organization_id": str(organization_id),
                "client_ip": client_ip,
                "at": datetime.now(UTC).isoformat(),
            }
        }

    @staticmethod
    def _audit_failure(
        event: str,
        partner_user: User,
        passport: Passport | None,
        offer_id: uuid.UUID | None,
        client_ip: str,
    ) -> None:
        logger.warning(
            "scan_redeem_failed",
            extra={
                "event": event,
                "partner_user_id": str(partner_user.id),
                "passport_id": str(passport.id) if passport else None,
                "offer_id": str(offer_id) if offer_id else None,
                "client_ip": client_ip,
            },
        )
