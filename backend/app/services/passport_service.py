"""Passport business logic — activation, offers, stamps, redemptions (TICKET-303)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.organization_constants import VerificationStatus
from app.core.passport_constants import (
    DEFAULT_PASSPORT_TIER_CODE,
    OfferRedemptionStatus,
    PassportStatus,
    PassportTierCode,
)
from app.core.passport_qr import build_qr_payload
from app.core.passport_tokens import generate_passport_number, generate_qr_token_placeholder
from app.models.passport import PartnerOffer, Passport, PassportOfferRedemption, PassportTier
from app.models.user import User
from app.repositories.partner_offer_repository import PartnerOfferRepository
from app.repositories.passport_repository import PassportRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.partner_offer import PartnerOfferListResponse, PartnerOfferResponse
from app.schemas.passport import (
    PassportActivateRequest,
    PassportMeResponse,
    PassportStampListResponse,
    PassportStampResponse,
    PassportStatsResponse,
    PassportTierListResponse,
    PassportTierResponse,
)
from app.schemas.redemption import RedemptionResponse
from app.schemas.scan import PassportQrResponse


class PassportService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._passports = PassportRepository(session)
        self._offers = PartnerOfferRepository(session)
        self._profiles = ProfileRepository(session)

    async def list_public_tiers(self) -> PassportTierListResponse:
        tiers = await self._passports.list_public_tiers()
        return PassportTierListResponse(
            items=[PassportTierResponse.model_validate(t) for t in tiers]
        )

    async def get_me(self, user: User) -> PassportMeResponse:
        passport = await self._require_active_passport(user.id)
        return self._to_me_response(passport)

    async def get_qr(self, user: User) -> PassportQrResponse:
        passport = await self._require_active_passport(user.id)
        return PassportQrResponse(
            qr_payload=build_qr_payload(passport.qr_token),
            passport_number=passport.passport_number,
            expires_at=None,
        )

    async def activate(
        self,
        user: User,
        payload: PassportActivateRequest | None = None,
    ) -> PassportMeResponse:
        existing = await self._passports.get_active_for_user(user.id)
        if existing is not None:
            return self._to_me_response(existing)

        city = await self._resolve_city(user, payload)
        tier = await self._require_basic_tier()
        now = datetime.now(UTC)

        passport = Passport(
            user_id=user.id,
            tier_id=tier.id,
            city=city,
            passport_number=generate_passport_number(city),
            qr_token=generate_qr_token_placeholder(),
            status=PassportStatus.ACTIVE,
            onboarding_completed=True,
            onboarding_step="activated",
            activated_at=now,
        )
        try:
            created = await self._passports.create_passport(passport)
        except IntegrityError as exc:
            await self._session.rollback()
            retry = await self._passports.get_active_for_user(user.id)
            if retry is not None:
                return self._to_me_response(retry)
            raise AppError(
                status_code=409,
                code="PASSPORT_ACTIVATION_FAILED",
                detail="Impossible d'activer le Passport pour le moment.",
            ) from exc

        await self._session.commit()
        await self._session.refresh(created, attribute_names=["tier"])
        return self._to_me_response(created)

    async def list_stamps(self, user: User) -> PassportStampListResponse:
        passport = await self._require_active_passport(user.id)
        stamps = await self._passports.list_stamps_for_passport(passport.id)
        items = [PassportStampResponse.model_validate(s) for s in stamps]
        return PassportStampListResponse(items=items, total=len(items))

    async def list_visible_offers(self, user: User) -> PartnerOfferListResponse:
        passport = await self._require_active_passport(user.id)
        now = datetime.now(UTC)
        offers = await self._offers.list_visible_offers(now=now)
        tier_code = passport.tier.code if passport.tier else PassportTierCode.BASIC.value
        filtered = [o for o in offers if self._offer_accessible(o, tier_code)]
        items = [PartnerOfferResponse.model_validate(o) for o in filtered]
        return PartnerOfferListResponse(items=items, total=len(items))

    async def redeem_offer(self, user: User, offer_id: uuid.UUID) -> RedemptionResponse:
        passport = await self._require_active_passport(user.id)
        now = datetime.now(UTC)
        offer = await self._offers.get_visible_offer_by_id(offer_id, now=now)
        if offer is None:
            raise AppError(
                status_code=404,
                code="OFFER_NOT_FOUND",
                detail="Offre introuvable ou non disponible.",
            )

        tier_code = passport.tier.code if passport.tier else PassportTierCode.BASIC.value
        if not self._offer_accessible(offer, tier_code):
            raise AppError(
                status_code=403,
                code="OFFER_TIER_REQUIRED",
                detail="Votre tier Passport ne permet pas cette offre.",
            )

        if offer.organization.verification_status != VerificationStatus.VERIFIED.value:
            raise AppError(
                status_code=403,
                code="OFFER_NOT_VERIFIED",
                detail="Cette offre provient d'un partenaire non vérifié.",
            )

        existing = await self._passports.get_redemption(
            passport_id=passport.id,
            partner_offer_id=offer.id,
        )
        if existing is not None:
            raise AppError(
                status_code=409,
                code="REDEMPTION_ALREADY_EXISTS",
                detail="Vous avez déjà utilisé cette offre.",
            )

        if offer.max_redemptions_total is not None:
            used = await self._offers.count_completed_redemptions(offer.id)
            if used >= offer.max_redemptions_total:
                raise AppError(
                    status_code=410,
                    code="OFFER_EXHAUSTED",
                    detail="Cette offre n'est plus disponible.",
                )

        redemption = PassportOfferRedemption(
            passport_id=passport.id,
            partner_offer_id=offer.id,
            status=OfferRedemptionStatus.COMPLETED,
            redeemed_at=now,
        )
        try:
            created = await self._passports.create_redemption(redemption)
            await self._passports.increment_redemptions_count(passport)
            await self._session.commit()
            await self._session.refresh(created)
        except IntegrityError as exc:
            await self._session.rollback()
            raise AppError(
                status_code=409,
                code="REDEMPTION_ALREADY_EXISTS",
                detail="Vous avez déjà utilisé cette offre.",
            ) from exc

        return RedemptionResponse.model_validate(created)

    async def _require_active_passport(self, user_id: uuid.UUID) -> Passport:
        passport = await self._passports.get_active_for_user(user_id)
        if passport is None:
            raise AppError(
                status_code=404,
                code="PASSPORT_NOT_ACTIVE",
                detail="Aucun Passport actif. Activez votre Passport pour continuer.",
            )
        return passport

    async def _require_basic_tier(self) -> PassportTier:
        tier = await self._passports.get_tier_by_code(PassportTierCode(DEFAULT_PASSPORT_TIER_CODE))
        if tier is None or not tier.is_active:
            raise AppError(
                status_code=503,
                code="PASSPORT_TIERS_NOT_CONFIGURED",
                detail="Catalogue des tiers Passport indisponible.",
            )
        return tier

    async def _resolve_city(
        self,
        user: User,
        payload: PassportActivateRequest | None,
    ) -> str:
        if payload and payload.city:
            return payload.city.strip()
        if user.city:
            return user.city.strip()
        profile = await self._profiles.get_by_user_id(user.id)
        if profile and profile.city:
            return profile.city.strip()
        raise AppError(
            status_code=422,
            code="PASSPORT_CITY_REQUIRED",
            detail="La ville est requise pour activer votre Passport.",
        )

    @staticmethod
    def _offer_accessible(offer: PartnerOffer, tier_code: str) -> bool:
        required = offer.tier_code_required
        if required is None:
            return True
        return required == tier_code

    @staticmethod
    def _to_me_response(passport: Passport) -> PassportMeResponse:
        tier = passport.tier
        if tier is None:
            raise AppError(
                status_code=500,
                code="PASSPORT_TIER_MISSING",
                detail="Tier Passport manquant.",
            )
        return PassportMeResponse(
            id=passport.id,
            user_id=passport.user_id,
            city=passport.city,
            passport_number=passport.passport_number,
            qr_token=passport.qr_token,
            status=PassportStatus(passport.status),
            tier=PassportTierResponse.model_validate(tier),
            stats=PassportStatsResponse(
                stamps_count=passport.stamps_count,
                redemptions_count=passport.redemptions_count,
                last_stamp_at=passport.last_stamp_at,
            ),
            onboarding_completed=passport.onboarding_completed,
            onboarding_step=passport.onboarding_step,
            activated_at=passport.activated_at,
            created_at=passport.created_at,
            updated_at=passport.updated_at,
        )
