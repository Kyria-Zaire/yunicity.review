"""Admin passport ops read service (ADMIN-03A)."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.passport_constants import PassportStatus, PassportTierCode
from app.models.passport import PassportOfferRedemption, PassportStamp
from app.repositories.admin_passport_repository import (
    AdminPassportListRow,
    AdminPassportRepository,
)
from app.schemas.admin_passport import (
    ADMIN_PASSPORT_LIST_PAGE_SIZE_MAX,
    ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_MAX,
    DEFAULT_ADMIN_PASSPORTS_CITY,
    AdminPassportDetailResponse,
    AdminPassportDetailStats,
    AdminPassportDetailUser,
    AdminPassportListItem,
    AdminPassportListResponse,
    AdminPassportListUser,
    AdminPassportRedemptionListItem,
    AdminPassportRedemptionListResponse,
    AdminPassportSearchMode,
    AdminPassportStampListItem,
    AdminPassportStampListResponse,
    AdminPassportTierDetail,
    AdminStaffPassportStatus,
)


class AdminPassportService:
    """
    Staff read API for citizen passports.

    Search without explicit ``search_mode`` (documented behavior):
    - ``q`` containing ``@`` → email (case-insensitive exact)
    - else exact ``passport_number`` match in city scope if any row exists
    - else ``display_name`` ILIKE when ``len(q) >= 2``
    """

    def __init__(self, session: AsyncSession) -> None:
        self._repo = AdminPassportRepository(session)

    async def list_passports(
        self,
        *,
        city: str | None,
        status: AdminStaffPassportStatus | None,
        q: str | None,
        search_mode: AdminPassportSearchMode | None,
        page: int,
        page_size: int,
    ) -> AdminPassportListResponse:
        resolved_city = (
            city or DEFAULT_ADMIN_PASSPORTS_CITY
        ).strip() or DEFAULT_ADMIN_PASSPORTS_CITY
        resolved_page_size = min(max(page_size, 1), ADMIN_PASSPORT_LIST_PAGE_SIZE_MAX)
        resolved_page = max(page, 1)

        resolved_q: str | None = None
        resolved_mode: AdminPassportSearchMode | None = None
        if q is not None:
            stripped = q.strip()
            if stripped:
                resolved_q = stripped
                resolved_mode = await self._resolve_search_mode(
                    city=resolved_city,
                    q=resolved_q,
                    search_mode=search_mode,
                )

        rows, total = await self._repo.list_passports(
            city=resolved_city,
            status=status,
            search_mode=resolved_mode,
            q=resolved_q,
            page=resolved_page,
            page_size=resolved_page_size,
        )
        return AdminPassportListResponse(
            items=[self._to_list_item(row) for row in rows],
            total=total,
            page=resolved_page,
            page_size=resolved_page_size,
        )

    async def get_passport_detail(self, passport_id: uuid.UUID) -> AdminPassportDetailResponse:
        row = await self._repo.get_passport_detail(passport_id)
        if row is None:
            raise AppError(
                status_code=404,
                code="PASSPORT_NOT_FOUND",
                detail="Passport introuvable.",
            )
        passport = row.passport
        redemptions_completed = await self._repo.count_redemptions_completed(passport.id)
        return AdminPassportDetailResponse(
            id=passport.id,
            passport_number=passport.passport_number,
            city=passport.city,
            status=self._staff_status(passport.status),
            qr_token=passport.qr_token,
            tier=AdminPassportTierDetail(
                code=PassportTierCode(row.tier.code),
                label=row.tier.name,
            ),
            user=AdminPassportDetailUser(
                id=row.user.id,
                email=row.user.email,
                display_name=self._display_name(row),
                is_active=row.user.is_active,
            ),
            stats=AdminPassportDetailStats(
                stamps_total=passport.stamps_count,
                redemptions_total=passport.redemptions_count,
                redemptions_completed=redemptions_completed,
            ),
            activated_at=passport.activated_at,
            suspended_at=passport.suspended_at,
            created_at=passport.created_at,
            updated_at=passport.updated_at,
        )

    async def list_stamps(
        self,
        *,
        passport_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> AdminPassportStampListResponse:
        await self._require_passport(passport_id)
        resolved_page_size = min(max(page_size, 1), ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_MAX)
        resolved_page = max(page, 1)
        stamps, total = await self._repo.list_stamps(
            passport_id=passport_id,
            page=resolved_page,
            page_size=resolved_page_size,
        )
        return AdminPassportStampListResponse(
            items=[self._to_stamp_item(stamp) for stamp in stamps],
            total=total,
            page=resolved_page,
            page_size=resolved_page_size,
        )

    async def list_redemptions(
        self,
        *,
        passport_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> AdminPassportRedemptionListResponse:
        await self._require_passport(passport_id)
        resolved_page_size = min(max(page_size, 1), ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_MAX)
        resolved_page = max(page, 1)
        redemptions, total = await self._repo.list_redemptions(
            passport_id=passport_id,
            page=resolved_page,
            page_size=resolved_page_size,
        )
        return AdminPassportRedemptionListResponse(
            items=[self._to_redemption_item(redemption) for redemption in redemptions],
            total=total,
            page=resolved_page,
            page_size=resolved_page_size,
        )

    async def _require_passport(self, passport_id: uuid.UUID) -> AdminPassportListRow:
        row = await self._repo.get_passport_detail(passport_id)
        if row is None:
            raise AppError(
                status_code=404,
                code="PASSPORT_NOT_FOUND",
                detail="Passport introuvable.",
            )
        return row

    async def _resolve_search_mode(
        self,
        *,
        city: str,
        q: str,
        search_mode: AdminPassportSearchMode | None,
    ) -> AdminPassportSearchMode:
        if search_mode is not None:
            self._validate_search_query(search_mode=search_mode, q=q)
            return search_mode

        if "@" in q:
            return AdminPassportSearchMode.EMAIL

        count = await self._repo.count_by_passport_number(city=city, passport_number=q)
        if count > 0:
            return AdminPassportSearchMode.PASSPORT_NUMBER

        if len(q) >= 2:
            return AdminPassportSearchMode.DISPLAY_NAME

        raise AppError(
            status_code=422,
            code="INVALID_PASSPORT_SEARCH",
            detail=(
                "Recherche invalide : email, numéro de passport, "
                "ou au moins 2 caractères pour le nom."
            ),
        )

    @staticmethod
    def _validate_search_query(*, search_mode: AdminPassportSearchMode, q: str) -> None:
        if search_mode == AdminPassportSearchMode.DISPLAY_NAME and len(q) < 2:
            raise AppError(
                status_code=422,
                code="INVALID_PASSPORT_SEARCH",
                detail="La recherche par nom requiert au moins 2 caractères.",
            )
        if search_mode == AdminPassportSearchMode.QR_FRAGMENT and len(q) < 12:
            raise AppError(
                status_code=422,
                code="INVALID_PASSPORT_SEARCH",
                detail="Le fragment QR requiert au moins 12 caractères.",
            )

    @staticmethod
    def _staff_status(raw_status: str) -> AdminStaffPassportStatus:
        if raw_status == PassportStatus.SUSPENDED.value:
            return "suspended"
        if raw_status == PassportStatus.REVOKED.value:
            return "suspended"
        return "active"

    @staticmethod
    def _display_name(row: AdminPassportListRow) -> str | None:
        if row.profile is not None and row.profile.display_name:
            return row.profile.display_name
        return row.user.full_name

    def _to_list_item(self, row: AdminPassportListRow) -> AdminPassportListItem:
        passport = row.passport
        return AdminPassportListItem(
            id=passport.id,
            passport_number=passport.passport_number,
            city=passport.city,
            status=self._staff_status(passport.status),
            tier_code=PassportTierCode(row.tier.code),
            user=AdminPassportListUser(
                id=row.user.id,
                email=row.user.email,
                display_name=self._display_name(row),
            ),
            stamps_count=passport.stamps_count,
            redemptions_count=passport.redemptions_count,
            activated_at=passport.activated_at,
            suspended_at=passport.suspended_at,
            created_at=passport.created_at,
        )

    @staticmethod
    def _to_stamp_item(stamp: PassportStamp) -> AdminPassportStampListItem:
        org = stamp.organization
        return AdminPassportStampListItem(
            id=stamp.id,
            organization_id=stamp.organization_id,
            organization_name=org.name,
            stamp_source=stamp.stamp_source,
            stamped_at=stamp.stamped_at,
            created_at=stamp.created_at,
        )

    @staticmethod
    def _to_redemption_item(redemption: PassportOfferRedemption) -> AdminPassportRedemptionListItem:
        offer = redemption.offer
        org = offer.organization
        return AdminPassportRedemptionListItem(
            id=redemption.id,
            offer_id=redemption.partner_offer_id,
            offer_title=offer.title,
            organization_id=offer.organization_id,
            organization_name=org.name,
            status=redemption.status,
            redeemed_at=redemption.redeemed_at,
            created_at=redemption.created_at,
        )
