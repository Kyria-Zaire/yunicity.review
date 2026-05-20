"""Passport business logic — activation, offers, stamps, redemptions (TICKET-303)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.flash_offer import build_flash_snapshot
from app.core.organization_constants import VerificationStatus
from app.core.passport_constants import (
    OfferRedemptionStatus,
    PassportStatus,
    PassportTierCode,
)
from app.core.passport_qr import build_qr_payload
from app.core.passport_tokens import generate_passport_number, generate_qr_token_placeholder
from app.models.local_stamp import CitizenLocalStamp
from app.models.passport import (
    PartnerOffer,
    Passport,
    PassportOfferRedemption,
    PassportStamp,
    PassportTier,
)
from app.models.user import User
from app.repositories.local_stamp_repository import LocalStampRepository
from app.repositories.partner_offer_repository import PartnerOfferRepository
from app.repositories.passport_repository import PassportRepository
from app.repositories.post_repository import PostRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.partner_offer import PartnerOfferListResponse, PartnerOfferResponse
from app.schemas.passport import (
    PassportActivateRequest,
    PassportMeResponse,
    PassportStampKind,
    PassportStampListResponse,
    PassportStampOrganizationSummary,
    PassportStampResponse,
    PassportStatsResponse,
    PassportTierListResponse,
    PassportTierResponse,
)
from app.schemas.redemption import RedemptionResponse
from app.schemas.scan import PassportQrResponse
from app.services.local_stamp_service import LocalStampService
from app.services.passport_level_hooks import evaluate_passport_level_after_activity
from app.services.passport_level_service import PassportLevelService


class PassportService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._passports = PassportRepository(session)
        self._offers = PartnerOfferRepository(session)
        self._profiles = ProfileRepository(session)
        self._posts = PostRepository(session)
        self._levels = PassportLevelService(session)

    async def list_public_tiers(self) -> PassportTierListResponse:
        tiers = await self._passports.list_public_tiers()
        return PassportTierListResponse(
            items=[PassportTierResponse.model_validate(t) for t in tiers]
        )

    async def get_me(self, user: User) -> PassportMeResponse:
        passport = await self._require_active_passport(user.id)
        return await self._build_me_response(passport, user)

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
            return await self._build_me_response(existing, user)

        city = await self._resolve_city(user, payload)
        initial_code = PassportLevelService.initial_tier_code_for_user(user)
        tier = await self._require_tier(initial_code)
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
            tier_unlocked_at=now,
            reputation_score=0,
        )
        try:
            created = await self._passports.create_passport(passport)
        except IntegrityError as exc:
            await self._session.rollback()
            retry = await self._passports.get_active_for_user(user.id)
            if retry is not None:
                return await self._build_me_response(retry, user)
            raise AppError(
                status_code=409,
                code="PASSPORT_ACTIVATION_FAILED",
                detail="Impossible d'activer le Passport pour le moment.",
            ) from exc

        await self._session.commit()
        await self._session.refresh(created, attribute_names=["tier"])
        return await self._build_me_response(created, user)

    async def list_stamps(self, user: User) -> PassportStampListResponse:
        passport = await self._require_active_passport(user.id)
        visit_stamps = await self._passports.list_stamps_for_passport(passport.id)
        local_stamps = await LocalStampRepository(self._session).list_for_user(user.id)
        items = [self._visit_stamp_response(s) for s in visit_stamps]
        items.extend(self._memory_stamp_response(s) for s in local_stamps)
        items.sort(key=lambda item: item.stamped_at, reverse=True)
        return PassportStampListResponse(items=items, total=len(items))

    @staticmethod
    def _visit_stamp_response(stamp: PassportStamp) -> PassportStampResponse:
        org = stamp.organization
        return PassportStampResponse(
            id=stamp.id,
            kind=PassportStampKind.VISIT,
            passport_id=stamp.passport_id,
            organization_id=stamp.organization_id,
            stamp_source=stamp.stamp_source,
            stamped_at=stamp.stamped_at,
            organization=PassportStampOrganizationSummary.model_validate(org) if org else None,
        )

    @staticmethod
    def _memory_stamp_response(stamp: CitizenLocalStamp) -> PassportStampResponse:
        definition = stamp.definition
        title = definition.title if definition else "Souvenir local"
        description = definition.description if definition else None
        icon = definition.icon if definition else "seal"
        slug = definition.slug if definition else None
        human = LocalStampService.human_line(stamp, definition) if definition else title
        org = stamp.organization
        org_summary = (
            PassportStampOrganizationSummary.model_validate(org) if org is not None else None
        )
        return PassportStampResponse(
            id=stamp.id,
            kind=PassportStampKind.MEMORY,
            stamped_at=stamp.earned_at,
            title=title,
            description=description,
            icon=icon,
            slug=slug,
            city=stamp.city,
            human_line=human,
            organization=org_summary,
        )

    async def list_visible_offers(self, user: User) -> PartnerOfferListResponse:
        passport = await self._require_active_passport(user.id)
        now = datetime.now(UTC)
        offers = await self._offers.list_visible_offers(now=now)
        tier_code = passport.tier.code if passport.tier else PassportTierCode.BASIC.value
        filtered = [o for o in offers if self._offer_accessible(o, tier_code)]
        items = [self._to_partner_offer_response(o) for o in filtered]
        return PartnerOfferListResponse(items=items, total=len(items))

    @staticmethod
    def _to_partner_offer_response(offer: object) -> PartnerOfferResponse:
        from app.models.passport import PartnerOffer

        assert isinstance(offer, PartnerOffer)
        flash = build_flash_snapshot(offer)
        base = PartnerOfferResponse.model_validate(offer)
        return base.model_copy(
            update={
                "is_flash": flash.is_flash,
                "flash_ends_at": flash.flash_ends_at,
                "remaining_hours": flash.remaining_hours,
                "remaining_minutes": flash.remaining_minutes,
            }
        )

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
        org = offer.organization
        if org is None:
            raise AppError(
                status_code=500,
                code="OFFER_ORGANIZATION_MISSING",
                detail="Organisation partenaire introuvable.",
            )
        try:
            created = await self._passports.create_redemption(redemption)
            await self._passports.increment_redemptions_count(passport)
            new_local = await LocalStampService(self._session).evaluate_after_redemption(
                passport=passport,
                offer=offer,
                organization=org,
                redeemed_at=now,
                via_partner_scan=False,
                send_notifications=False,
            )
            await self._session.commit()
            await self._session.refresh(created)
            for stamp in new_local:
                await LocalStampService(self._session).notify_stamp_earned(passport.user_id, stamp)
        except IntegrityError as exc:
            await self._session.rollback()
            raise AppError(
                status_code=409,
                code="REDEMPTION_ALREADY_EXISTS",
                detail="Vous avez déjà utilisé cette offre.",
            ) from exc

        await evaluate_passport_level_after_activity(self._session, passport.id)
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

    async def _require_tier(self, code: PassportTierCode) -> PassportTier:
        tier = await self._passports.get_tier_by_code(code)
        if tier is None or not tier.is_active:
            raise AppError(
                status_code=503,
                code="PASSPORT_TIERS_NOT_CONFIGURED",
                detail="Catalogue des tiers Passport indisponible.",
            )
        return tier

    async def _build_me_response(self, passport: Passport, user: User) -> PassportMeResponse:
        tier = passport.tier
        if tier is None:
            raise AppError(
                status_code=500,
                code="PASSPORT_TIER_MISSING",
                detail="Tier Passport manquant.",
            )
        tier_code = tier.code.value if isinstance(tier.code, PassportTierCode) else str(tier.code)
        posts_count = await self._posts.count_citizen_posts_for_user(user.id)
        score = PassportLevelService.compute_reputation_score(
            passport, user, posts_count=posts_count
        )
        progression = PassportLevelService.build_progression_hint(
            current_tier_code=tier_code,
            reputation_score=score,
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
            reputation_score=score,
            progression=progression,
            tier_unlocked_at=passport.tier_unlocked_at,
            onboarding_completed=passport.onboarding_completed,
            onboarding_step=passport.onboarding_step,
            activated_at=passport.activated_at,
            created_at=passport.created_at,
            updated_at=passport.updated_at,
        )

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
