"""Admin passport ops read service (ADMIN-03A)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.passport_admin_constants import (
    ADMIN_PASSPORT_REASON_MIN_LENGTH,
    PASSPORT_ADMIN_ACTIONS,
    PassportAdminAction,
)
from app.core.passport_constants import PassportStatus, PassportTierCode
from app.models.passport import PassportOfferRedemption, PassportStamp
from app.models.user import User
from app.repositories.admin_passport_repository import (
    AdminPassportActionRow,
    AdminPassportListRow,
    AdminPassportRepository,
)
from app.schemas.admin_passport import (
    ADMIN_PASSPORT_LIST_PAGE_SIZE_MAX,
    ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_MAX,
    DEFAULT_ADMIN_PASSPORTS_CITY,
    AdminPassportActionActorUser,
    AdminPassportActionItem,
    AdminPassportActionListResponse,
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
    AdminPassportStatusPatchRequest,
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
        self._session = session
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
        row = await self._require_passport(passport_id)
        return await self._build_detail_response(row)

    async def patch_passport_status(
        self,
        passport_id: uuid.UUID,
        actor: User,
        payload: AdminPassportStatusPatchRequest,
    ) -> AdminPassportDetailResponse:
        row = await self._require_passport(passport_id)
        passport = row.passport
        reason = payload.reason.strip()
        if len(reason) < ADMIN_PASSPORT_REASON_MIN_LENGTH:
            raise AppError(
                status_code=422,
                code="INVALID_PASSPORT_REASON",
                detail="Le motif doit contenir au moins 3 caractères.",
            )

        previous_status = self._raw_status(passport.status)
        if previous_status == PassportStatus.REVOKED:
            raise AppError(
                status_code=422,
                code="PASSPORT_STATUS_NOT_MUTABLE",
                detail="Ce passport révoqué ne peut pas être modifié via l'admin V1.",
            )

        target_status = self._staff_status_to_db(payload.status)
        if previous_status == target_status:
            raise AppError(
                status_code=422,
                code="PASSPORT_STATUS_UNCHANGED",
                detail="Le passport est déjà dans ce statut.",
            )

        action = self._action_for_transition(previous_status, target_status)
        now = datetime.now(UTC)
        passport.status = target_status
        if target_status == PassportStatus.SUSPENDED:
            passport.suspended_at = now
        else:
            passport.suspended_at = None

        await self._repo.update_passport(passport)
        await self._repo.record_admin_action(
            passport_id=passport.id,
            user_id=passport.user_id,
            action=action.value,
            actor_user_id=actor.id,
            previous_status=previous_status.value,
            new_status=target_status.value,
            reason=reason,
            created_at=now,
        )
        await self._session.commit()
        await self._session.refresh(passport)

        refreshed = await self._repo.get_passport_detail(passport_id)
        assert refreshed is not None
        return await self._build_detail_response(refreshed)

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

    async def list_actions(
        self,
        *,
        passport_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> AdminPassportActionListResponse:
        await self._require_passport(passport_id)
        resolved_page_size = min(max(page_size, 1), ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_MAX)
        resolved_page = max(page, 1)
        rows, total = await self._repo.list_admin_actions(
            passport_id=passport_id,
            page=resolved_page,
            page_size=resolved_page_size,
        )
        return AdminPassportActionListResponse(
            items=[self._to_action_item(row) for row in rows],
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

    async def _build_detail_response(
        self, row: AdminPassportListRow
    ) -> AdminPassportDetailResponse:
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

    @staticmethod
    def _raw_status(raw_status: str) -> PassportStatus:
        return raw_status if isinstance(raw_status, PassportStatus) else PassportStatus(raw_status)

    @staticmethod
    def _staff_status_to_db(status: AdminStaffPassportStatus) -> PassportStatus:
        if status == "suspended":
            return PassportStatus.SUSPENDED
        return PassportStatus.ACTIVE

    @staticmethod
    def _action_for_transition(
        previous: PassportStatus,
        target: PassportStatus,
    ) -> PassportAdminAction:
        if previous == PassportStatus.ACTIVE and target == PassportStatus.SUSPENDED:
            return PassportAdminAction.SUSPEND
        if previous == PassportStatus.SUSPENDED and target == PassportStatus.ACTIVE:
            return PassportAdminAction.REACTIVATE
        raise AppError(
            status_code=422,
            code="INVALID_PASSPORT_STATUS_TRANSITION",
            detail="Transition de statut non autorisée.",
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

    def _to_action_item(self, row: AdminPassportActionRow) -> AdminPassportActionItem:
        entry = row.action
        if entry.action not in PASSPORT_ADMIN_ACTIONS:
            raise AppError(
                status_code=500,
                code="INVALID_PASSPORT_ADMIN_ACTION",
                detail="Action staff passport invalide en base.",
            )
        return AdminPassportActionItem(
            id=entry.id,
            action=entry.action,  # type: ignore[arg-type]
            previous_status=entry.previous_status,
            new_status=entry.new_status,
            reason=entry.reason,
            actor_user=self._to_action_actor(row),
            created_at=entry.created_at,
        )

    @staticmethod
    def _to_action_actor(row: AdminPassportActionRow) -> AdminPassportActionActorUser:
        actor = row.actor
        if actor is None:
            assert row.action.actor_user_id is not None
            return AdminPassportActionActorUser(
                id=row.action.actor_user_id,
                email="Compte staff supprimé",
                display_name=None,
            )
        display_name: str | None = None
        if row.actor_profile is not None and row.actor_profile.display_name:
            display_name = row.actor_profile.display_name
        elif actor.full_name:
            display_name = actor.full_name
        return AdminPassportActionActorUser(
            id=actor.id,
            email=actor.email,
            display_name=display_name,
        )
