"""Admin partner offer read service (ADMIN-04E-A)."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.passport_constants import OfferRedemptionStatus
from app.repositories.admin_partner_offer_repository import (
    AdminOfferRedemptionRow,
    AdminPartnerOfferRepository,
)
from app.schemas.admin_partner_offer import (
    ADMIN_OFFER_REDEMPTION_LIST_PAGE_SIZE_MAX,
    AdminOfferRedemptionChannel,
    AdminOfferRedemptionCitizen,
    AdminOfferRedemptionPassport,
    PartnerOfferAdminRedemptionListItem,
    PartnerOfferAdminRedemptionListResponse,
)


class AdminPartnerOfferService:
    """
    Staff read API for partner offer redemptions.

    Channel derivation (no dedicated DB column):
    - ``scan`` — redemption ``metadata.audit`` contains ``event=redemption_success``
      or ``redeemed_by_user_id`` (partner scan flow).
    - ``self`` — ``status=completed`` and no scan audit block in metadata
      (citizen self-redeem via ``POST /passport/offers/{id}/redeem``).
    - ``unknown`` — any other case (e.g. ``pending`` rows, legacy metadata).
    """

    def __init__(self, session: AsyncSession) -> None:
        self._repo = AdminPartnerOfferRepository(session)

    async def list_offer_redemptions(
        self,
        *,
        offer_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> PartnerOfferAdminRedemptionListResponse:
        if not await self._repo.offer_exists(offer_id):
            raise AppError(
                status_code=404,
                code="OFFER_NOT_FOUND",
                detail="Offre introuvable.",
            )

        resolved_page_size = min(max(page_size, 1), ADMIN_OFFER_REDEMPTION_LIST_PAGE_SIZE_MAX)
        resolved_page = max(page, 1)
        rows, total = await self._repo.list_offer_redemptions(
            offer_id=offer_id,
            page=resolved_page,
            page_size=resolved_page_size,
        )
        return PartnerOfferAdminRedemptionListResponse(
            items=[self._to_redemption_item(row) for row in rows],
            total=total,
            page=resolved_page,
            page_size=resolved_page_size,
        )

    @staticmethod
    def derive_redemption_channel(
        metadata: dict[str, Any] | None,
        *,
        status: str,
    ) -> AdminOfferRedemptionChannel:
        meta = metadata or {}
        audit = meta.get("audit")
        if isinstance(audit, dict):
            event = audit.get("event")
            redeemed_by = audit.get("redeemed_by_user_id")
            if event == "redemption_success" or redeemed_by:
                return "scan"

        if status == OfferRedemptionStatus.COMPLETED.value and not (
            isinstance(audit, dict) and audit
        ):
            return "self"

        return "unknown"

    @classmethod
    def _to_redemption_item(
        cls,
        row: AdminOfferRedemptionRow,
    ) -> PartnerOfferAdminRedemptionListItem:
        status_value = (
            row.redemption.status.value
            if isinstance(row.redemption.status, OfferRedemptionStatus)
            else str(row.redemption.status)
        )
        display_name: str | None = None
        if row.profile is not None and row.profile.display_name:
            display_name = row.profile.display_name
        elif row.user.full_name:
            display_name = row.user.full_name

        return PartnerOfferAdminRedemptionListItem(
            id=row.redemption.id,
            passport=AdminOfferRedemptionPassport(
                id=row.passport.id,
                passport_number=row.passport.passport_number,
            ),
            citizen=AdminOfferRedemptionCitizen(
                id=row.user.id,
                display_name=display_name,
                email=row.user.email,
            ),
            channel=cls.derive_redemption_channel(
                row.redemption.metadata_,
                status=status_value,
            ),
            status=status_value,  # type: ignore[arg-type]
            redeemed_at=row.redemption.redeemed_at,
        )
