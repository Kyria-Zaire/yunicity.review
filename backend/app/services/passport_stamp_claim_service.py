"""Passport stamp QR claim service — MVP (WEB-PARTNERS-04A)."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES, PartnerStatus
from app.core.passport_constants import PassportStampSource
from app.core.passport_stamp_qr import decode_stamp_qr_token
from app.models.user import User
from app.repositories.partner_offer_repository import PartnerOfferRepository
from app.repositories.partner_repository import PartnerRepository
from app.repositories.passport_repository import PassportRepository
from app.schemas.passport_stamp_claim import (
    StampClaimItem,
    StampClaimOrganizationItem,
    StampClaimPassportSummary,
    StampClaimResponse,
)
from app.services.passport_level_hooks import evaluate_passport_level_after_activity

logger = logging.getLogger(__name__)


class PassportStampClaimService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._passports = PassportRepository(session)
        self._partners = PartnerRepository(session)
        self._offers = PartnerOfferRepository(session)

    async def claim(self, user: User, token: str) -> tuple[StampClaimResponse, bool]:
        """Return (response, created). `created` is True for 201, False for 200."""
        # 1. Verify JWT — raises 400 STAMP_TOKEN_INVALID or 410 STAMP_TOKEN_EXPIRED
        payload = decode_stamp_qr_token(token)

        organization_id = uuid.UUID(payload["organization_id"])
        partner_profile_id = uuid.UUID(payload["partner_profile_id"])
        partner_offer_id_str: str | None = payload.get("partner_offer_id")
        nonce: str = payload.get("nonce", "")
        now = datetime.now(UTC)

        # 2. Validate partner is active (active/premium/founding_partner)
        profile = await self._partners.get_by_partner_profile_id(partner_profile_id)
        if profile is None:
            raise AppError(400, "STAMP_TOKEN_INVALID", "Ce QR n'est pas valide.")
        status = (
            profile.partner_status
            if isinstance(profile.partner_status, PartnerStatus)
            else PartnerStatus(profile.partner_status)
        )
        if status not in PUBLIC_PARTNER_STATUSES:
            raise AppError(
                403,
                "PARTNER_NOT_ACTIVE",
                "Ce partenaire n'est pas actif pour le moment.",
            )

        # 3. Validate offer if present
        partner_offer_id: uuid.UUID | None = None
        if partner_offer_id_str is not None:
            partner_offer_id = uuid.UUID(partner_offer_id_str)
            offer = await self._offers.get_by_id(partner_offer_id)
            if offer is None or not offer.is_active:
                raise AppError(
                    410,
                    "OFFER_NOT_ACTIVE_OR_EXPIRED",
                    "Cette offre n'est plus disponible.",
                )
            if offer.valid_until and offer.valid_until < now:
                raise AppError(410, "OFFER_NOT_ACTIVE_OR_EXPIRED", "Cette offre a expiré.")

        # 4. Load user passport
        passport = await self._passports.get_active_for_user(user.id)
        if passport is None:
            raise AppError(404, "PASSPORT_NOT_FOUND", "Passport actif introuvable.")

        # 5. Attempt stamp — idempotent via unique(passport_id, organization_id)
        metadata: dict[str, object] = {"nonce": nonce, "qr_version": 1}
        if partner_offer_id is not None:
            metadata["partner_offer_id"] = str(partner_offer_id)

        created = await self._passports.add_stamp_if_missing(
            passport_id=passport.id,
            organization_id=organization_id,
            stamped_at=now,
            stamp_source=PassportStampSource.QR,
            metadata=metadata,
        )

        logger.info(
            "stamp_qr_claim",
            extra={
                "user_id": str(user.id),
                "organization_id": str(organization_id),
                "partner_profile_id": str(partner_profile_id),
                "stamp_created": created,
                "nonce": nonce,
            },
        )

        if created:
            await self._session.commit()
            await self._session.refresh(passport)
            await evaluate_passport_level_after_activity(self._session, passport.id)
        # else: stamp already existed — no commit, passport data is accurate from initial load

        # 6. Build response — load stamp with org for display
        stamp = await self._passports.get_stamp_with_org(
            passport_id=passport.id,
            organization_id=organization_id,
        )
        if stamp is None:
            raise AppError(500, "STAMP_LOAD_ERROR", "Erreur interne lors du chargement du tampon.")

        org = stamp.organization
        tier_code = passport.tier.code if passport.tier else "basic"
        stamp_source_val = (
            stamp.stamp_source
            if isinstance(stamp.stamp_source, str)
            else stamp.stamp_source.value
        )

        response = StampClaimResponse(
            status="created" if created else "already_claimed",
            already_claimed=not created,
            stamp=StampClaimItem(
                id=stamp.id,
                organization_id=stamp.organization_id,
                organization=StampClaimOrganizationItem(
                    id=org.id,
                    slug=org.slug,
                    name=org.name,
                    city=org.city,
                    logo_url=org.logo_url,
                ) if org else StampClaimOrganizationItem(
                    id=organization_id,
                    slug="",
                    name="Partenaire",
                    city="",
                ),
                stamp_source=stamp_source_val,
                stamped_at=stamp.stamped_at,
            ),
            passport=StampClaimPassportSummary(
                stamps_count=passport.stamps_count,
                tier_code=tier_code,
            ),
        )
        return response, created
