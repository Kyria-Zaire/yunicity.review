"""Partner offer business logic — moderated self-service (TICKET-305A)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import cast

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.flash_offer import (
    apply_flash_clear_on_archive,
    build_flash_snapshot,
    validate_flash_fields,
)
from app.core.offer_admin_constants import (
    OFFER_ADMIN_APPROVE_REASON,
    OFFER_ADMIN_ARCHIVE_REASON,
    OfferAdminAction,
)
from app.core.organization_constants import OrganizationVisibility, VerificationStatus
from app.core.partner_offer_workflow import (
    assert_partner_can_edit,
    assert_transition_allowed,
    is_offer_active,
)
from app.core.passport_constants import PartnerOfferStatus
from app.models.organization import Organization
from app.models.passport import PartnerOffer
from app.models.user import User
from app.repositories.admin_partner_offer_repository import AdminPartnerOfferRepository
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.partner_offer_repository import PartnerOfferRepository
from app.schemas.admin_partner_offer import (
    PARTNER_OFFER_LIST_PAGE_SIZE_MAX,
    PartnerOfferAdminCreateRequest,
    PartnerOfferAdminListResponse,
    PartnerOfferAdminResponse,
    PartnerOfferAdminSummaryResponse,
    PartnerOfferAdminUpdateRequest,
    PartnerOfferOrganizationAdmin,
    PartnerOfferRejectRequest,
    VerifiedOrganizationListResponse,
    VerifiedOrganizationOption,
)
from app.schemas.partner_offer_management import (
    PartnerOfferCreateRequest,
    PartnerOfferManagementListResponse,
    PartnerOfferManagementResponse,
    PartnerOfferUpdateRequest,
)
from app.services.feed_offer_sync import FeedOfferSyncService
from app.services.notification_triggers import notify_offer_approved, notify_offer_rejected
from app.services.organization_membership_service import OrganizationMembershipService


class PartnerOfferService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._offers = PartnerOfferRepository(session)
        self._orgs = OrganizationRepository(session)
        self._membership = OrganizationMembershipService(session)
        self._offer_admin = AdminPartnerOfferRepository(session)

    # --- Partner self-service ---

    async def create_draft(
        self,
        actor: User,
        payload: PartnerOfferCreateRequest,
    ) -> PartnerOfferManagementResponse:
        org = await self._require_verified_organization(payload.organization_id)
        await self._membership.require_offer_manager(
            organization_id=org.id,
            user_id=actor.id,
        )
        self._validate_dates(payload.valid_from, payload.valid_until)
        offer = PartnerOffer(
            organization_id=org.id,
            title=payload.title.strip(),
            description=payload.description.strip() if payload.description else None,
            offer_type=payload.offer_type,
            status=PartnerOfferStatus.DRAFT,
            is_active=False,
            tier_code_required=payload.tier_code_required,
            max_redemptions_per_passport=payload.redemption_limit,
            max_redemptions_total=payload.max_redemptions_total,
            valid_from=payload.valid_from,
            valid_until=payload.valid_until,
            is_flash=payload.is_flash,
            flash_ends_at=payload.flash_ends_at if payload.is_flash else None,
            created_by_user_id=actor.id,
        )
        created = await self._offers.create(offer)
        await self._session.commit()
        return await self._to_management_response(await self._require_offer(created.id))

    async def update_draft(
        self,
        actor: User,
        offer_id: uuid.UUID,
        payload: PartnerOfferUpdateRequest,
    ) -> PartnerOfferManagementResponse:
        offer = await self._require_offer(offer_id)
        await self._membership.require_offer_manager(
            organization_id=offer.organization_id,
            user_id=actor.id,
        )
        assert_partner_can_edit(offer.status)
        updates = payload.model_dump(exclude_unset=True)
        if "redemption_limit" in updates:
            updates["max_redemptions_per_passport"] = updates.pop("redemption_limit")
        valid_from = updates.get("valid_from", offer.valid_from)
        valid_until = updates.get("valid_until", offer.valid_until)
        self._validate_dates(valid_from, valid_until)
        self._merge_and_validate_flash(offer, updates)
        await self._offers.update_fields(offer, fields=updates)
        await self._session.commit()
        return await self._to_management_response(await self._require_offer(offer_id))

    async def submit_for_review(
        self,
        actor: User,
        offer_id: uuid.UUID,
    ) -> PartnerOfferManagementResponse:
        offer = await self._require_offer(offer_id)
        await self._membership.require_offer_manager(
            organization_id=offer.organization_id,
            user_id=actor.id,
        )
        self._validate_dates(offer.valid_from, offer.valid_until)
        status = (
            offer.status
            if isinstance(offer.status, PartnerOfferStatus)
            else PartnerOfferStatus(offer.status)
        )
        validate_flash_fields(
            is_flash=offer.is_flash,
            flash_ends_at=offer.flash_ends_at,
            valid_until=offer.valid_until,
            status=status,
        )
        self._transition_offer(offer, PartnerOfferStatus.PENDING_REVIEW)
        await self._session.commit()
        return await self._to_management_response(await self._require_offer(offer_id))

    async def list_my_offers(
        self,
        actor: User,
        *,
        organization_id: uuid.UUID | None,
        offer_status: str | None,
        offer_type: str | None,
        page: int,
        page_size: int,
    ) -> PartnerOfferManagementListResponse:
        org_ids = await self._offers.list_managed_organization_ids(actor.id)
        if organization_id is not None:
            await self._membership.require_offer_manager(
                organization_id=organization_id,
                user_id=actor.id,
            )
            if organization_id not in org_ids:
                org_ids = []
            else:
                org_ids = [organization_id]
        page_size = min(page_size, PARTNER_OFFER_LIST_PAGE_SIZE_MAX)
        offers, total = await self._offers.list_for_organization_ids(
            organization_ids=org_ids,
            offer_status=offer_status,
            offer_type=offer_type,
            page=page,
            page_size=page_size,
        )
        items = [await self._to_management_response(offer) for offer in offers]
        return PartnerOfferManagementListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )

    # --- Admin moderation ---

    async def list_verified_organizations(self) -> VerifiedOrganizationListResponse:
        orgs = await self._offers.list_verified_organizations()
        return VerifiedOrganizationListResponse(
            items=[
                VerifiedOrganizationOption(
                    id=org.id,
                    slug=org.slug,
                    name=org.name,
                    city=org.city,
                    visibility=org.visibility,
                )
                for org in orgs
            ]
        )

    async def create_offer_admin(
        self,
        actor: User,
        payload: PartnerOfferAdminCreateRequest,
    ) -> PartnerOfferAdminResponse:
        org = await self._require_verified_organization(payload.organization_id)
        self._validate_dates(payload.valid_from, payload.valid_until)
        offer = PartnerOffer(
            organization_id=org.id,
            title=payload.title.strip(),
            description=payload.description.strip() if payload.description else None,
            offer_type=payload.offer_type,
            status=PartnerOfferStatus.DRAFT,
            is_active=False,
            tier_code_required=payload.tier_code_required,
            max_redemptions_per_passport=payload.redemption_limit,
            max_redemptions_total=payload.max_redemptions_total,
            valid_from=payload.valid_from,
            valid_until=payload.valid_until,
            created_by_user_id=actor.id,
        )
        created = await self._offers.create(offer)
        await self._session.commit()
        return await self.get_offer_admin(created.id)

    async def update_offer_admin(
        self,
        offer_id: uuid.UUID,
        payload: PartnerOfferAdminUpdateRequest,
    ) -> PartnerOfferAdminResponse:
        offer = await self._require_offer(offer_id)
        await self._require_verified_organization(offer.organization_id)
        updates = payload.model_dump(exclude_unset=True)
        if "redemption_limit" in updates:
            updates["max_redemptions_per_passport"] = updates.pop("redemption_limit")
        valid_from = updates.get("valid_from", offer.valid_from)
        valid_until = updates.get("valid_until", offer.valid_until)
        self._validate_dates(valid_from, valid_until)
        await self._offers.update_fields(offer, fields=updates)
        await self._session.commit()
        return await self.get_offer_admin(offer_id)

    async def get_offer_admin(self, offer_id: uuid.UUID) -> PartnerOfferAdminResponse:
        offer = await self._require_offer(offer_id)
        return await self._to_admin_response(offer)

    async def get_offers_admin_summary(self, *, city: str) -> PartnerOfferAdminSummaryResponse:
        counts = await self._offers.fetch_admin_summary(city=city)
        return PartnerOfferAdminSummaryResponse(
            city=city,
            generated_at=datetime.now(UTC),
            total=counts.total,
            pending_review=counts.pending_review,
            published=counts.published,
            draft=counts.draft,
            rejected=counts.rejected,
            archived=counts.archived,
            contributor_partners=counts.contributor_partners,
            expired_or_inactive=counts.expired_or_inactive,
        )

    async def list_offers_admin(
        self,
        *,
        offer_status: str | None,
        offer_type: str | None,
        organization_id: uuid.UUID | None,
        title_query: str | None,
        page: int,
        page_size: int,
    ) -> PartnerOfferAdminListResponse:
        page_size = min(page_size, PARTNER_OFFER_LIST_PAGE_SIZE_MAX)
        offers, total = await self._offers.list_admin(
            offer_status=offer_status,
            offer_type=offer_type,
            organization_id=organization_id,
            title_query=title_query,
            page=page,
            page_size=page_size,
        )
        items = [await self._to_admin_response(offer) for offer in offers]
        return PartnerOfferAdminListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )

    async def approve_offer(
        self,
        moderator: User,
        offer_id: uuid.UUID,
    ) -> PartnerOfferAdminResponse:
        offer = await self._require_offer(offer_id)
        org = await self._require_verified_organization(offer.organization_id)
        self._validate_dates(offer.valid_from, offer.valid_until)
        previous_status = self._offer_status_value(offer.status)
        self._transition_offer(
            offer,
            PartnerOfferStatus.PUBLISHED,
            moderator=moderator,
            clear_rejection=True,
        )
        await self._record_offer_admin_action(
            offer_id=offer.id,
            moderator=moderator,
            action=OfferAdminAction.APPROVE,
            previous_status=previous_status,
            new_status=self._offer_status_value(offer.status),
            reason=OFFER_ADMIN_APPROVE_REASON,
        )
        org.visibility = OrganizationVisibility.PUBLIC
        await FeedOfferSyncService(self._session).upsert_offer_post(offer, org)
        await self._session.commit()
        if offer.created_by_user_id is not None:
            await notify_offer_approved(self._session, offer.created_by_user_id)
        return await self.get_offer_admin(offer_id)

    async def reject_offer(
        self,
        moderator: User,
        offer_id: uuid.UUID,
        payload: PartnerOfferRejectRequest,
    ) -> PartnerOfferAdminResponse:
        offer = await self._require_offer(offer_id)
        await self._require_verified_organization(offer.organization_id)
        reason = payload.reason.strip()
        previous_status = self._offer_status_value(offer.status)
        self._transition_offer(
            offer,
            PartnerOfferStatus.REJECTED,
            moderator=moderator,
            rejection_reason=reason,
        )
        await self._record_offer_admin_action(
            offer_id=offer.id,
            moderator=moderator,
            action=OfferAdminAction.REJECT,
            previous_status=previous_status,
            new_status=self._offer_status_value(offer.status),
            reason=reason,
        )
        await FeedOfferSyncService(self._session).deactivate_offer_post(offer.id)
        await self._session.commit()
        if offer.created_by_user_id is not None:
            await notify_offer_rejected(self._session, offer.created_by_user_id)
        return await self.get_offer_admin(offer_id)

    async def archive_offer(
        self,
        moderator: User,
        offer_id: uuid.UUID,
    ) -> PartnerOfferAdminResponse:
        offer = await self._require_offer(offer_id)
        await self._require_verified_organization(offer.organization_id)
        previous_status = self._offer_status_value(offer.status)
        self._transition_offer(
            offer,
            PartnerOfferStatus.ARCHIVED,
            moderator=moderator,
            clear_rejection=True,
        )
        await self._record_offer_admin_action(
            offer_id=offer.id,
            moderator=moderator,
            action=OfferAdminAction.ARCHIVE,
            previous_status=previous_status,
            new_status=self._offer_status_value(offer.status),
            reason=OFFER_ADMIN_ARCHIVE_REASON,
        )
        await FeedOfferSyncService(self._session).deactivate_offer_post(offer.id)
        await self._session.commit()
        return await self.get_offer_admin(offer_id)

    # --- Internals ---

    @staticmethod
    def _offer_status_value(status: PartnerOfferStatus | str) -> str:
        if isinstance(status, PartnerOfferStatus):
            return status.value
        return str(status)

    async def _record_offer_admin_action(
        self,
        *,
        offer_id: uuid.UUID,
        moderator: User,
        action: OfferAdminAction,
        previous_status: str,
        new_status: str,
        reason: str,
    ) -> None:
        await self._offer_admin.record_admin_action(
            partner_offer_id=offer_id,
            action=action.value,
            actor_user_id=moderator.id,
            previous_status=previous_status,
            new_status=new_status,
            reason=reason,
            created_at=datetime.now(UTC),
        )

    async def _require_offer(self, offer_id: uuid.UUID) -> PartnerOffer:
        offer = await self._offers.get_by_id(offer_id)
        if offer is None:
            raise AppError(
                status_code=404,
                code="OFFER_NOT_FOUND",
                detail="Offre introuvable.",
            )
        return offer

    async def _require_verified_organization(self, organization_id: uuid.UUID) -> Organization:
        org = await self._orgs.get_by_id(organization_id)
        if org is None:
            raise AppError(
                status_code=404,
                code="ORGANIZATION_NOT_FOUND",
                detail="Organisation introuvable.",
            )
        if org.verification_status != VerificationStatus.VERIFIED.value:
            raise AppError(
                status_code=422,
                code="ORGANIZATION_NOT_VERIFIED",
                detail="Les offres Passport sont réservées aux organisations vérifiées.",
            )
        return org

    def _transition_offer(
        self,
        offer: PartnerOffer,
        target: PartnerOfferStatus,
        *,
        moderator: User | None = None,
        rejection_reason: str | None = None,
        clear_rejection: bool = False,
    ) -> None:
        assert_transition_allowed(offer.status, target)
        apply_flash_clear_on_archive(offer, target)
        offer.status = target
        offer.is_active = is_offer_active(target)
        if moderator is not None:
            offer.moderated_by_user_id = moderator.id
            offer.moderated_at = datetime.now(UTC)
        if target == PartnerOfferStatus.REJECTED:
            offer.rejection_reason = rejection_reason
        elif clear_rejection:
            offer.rejection_reason = None

    @staticmethod
    def _validate_dates(
        valid_from: datetime | None,
        valid_until: datetime | None,
    ) -> None:
        if valid_from and valid_until and valid_until <= valid_from:
            raise AppError(
                status_code=422,
                code="INVALID_OFFER_DATES",
                detail="La date de fin doit être postérieure à la date de début.",
            )

    def _merge_and_validate_flash(
        self,
        offer: PartnerOffer,
        updates: dict[str, object],
    ) -> None:
        is_flash = offer.is_flash if "is_flash" not in updates else bool(updates["is_flash"])
        flash_ends_at = (
            offer.flash_ends_at
            if "flash_ends_at" not in updates
            else cast(datetime | None, updates.get("flash_ends_at"))
        )
        valid_until = (
            offer.valid_until
            if "valid_until" not in updates
            else cast(datetime | None, updates.get("valid_until"))
        )
        status = offer.status
        if isinstance(status, str):
            status = PartnerOfferStatus(status)
        validate_flash_fields(
            is_flash=is_flash,
            flash_ends_at=flash_ends_at if is_flash else None,
            valid_until=valid_until,
            status=status,
        )
        if "is_flash" in updates or "flash_ends_at" in updates:
            updates["is_flash"] = is_flash
            updates["flash_ends_at"] = flash_ends_at if is_flash else None

    async def _to_management_response(
        self,
        offer: PartnerOffer,
    ) -> PartnerOfferManagementResponse:
        redemptions_count = await self._offers.count_completed_redemptions(offer.id)
        status = (
            offer.status
            if isinstance(offer.status, PartnerOfferStatus)
            else PartnerOfferStatus(offer.status)
        )
        flash = build_flash_snapshot(offer)
        return PartnerOfferManagementResponse(
            id=offer.id,
            organization_id=offer.organization_id,
            title=offer.title,
            description=offer.description,
            offer_type=offer.offer_type,
            offer_status=status,
            is_active=offer.is_active,
            tier_code_required=offer.tier_code_required,
            max_redemptions_total=offer.max_redemptions_total,
            redemption_limit=offer.max_redemptions_per_passport,
            valid_from=offer.valid_from,
            valid_until=offer.valid_until,
            redemptions_count=redemptions_count,
            created_by_user_id=offer.created_by_user_id,
            moderated_by_user_id=offer.moderated_by_user_id,
            moderated_at=offer.moderated_at,
            rejection_reason=offer.rejection_reason,
            is_flash=offer.is_flash,
            flash_ends_at=offer.flash_ends_at,
            flash_active=flash.is_flash,
            remaining_hours=flash.remaining_hours,
            remaining_minutes=flash.remaining_minutes,
            notification_sent_at=offer.notification_sent_at,
            created_at=offer.created_at,
            updated_at=offer.updated_at,
        )

    async def _to_admin_response(self, offer: PartnerOffer) -> PartnerOfferAdminResponse:
        org = offer.organization
        if org is None:
            org = await self._orgs.get_by_id(offer.organization_id)
        assert org is not None
        redemptions_count = await self._offers.count_completed_redemptions(offer.id)
        status = (
            offer.status
            if isinstance(offer.status, PartnerOfferStatus)
            else PartnerOfferStatus(offer.status)
        )
        return PartnerOfferAdminResponse(
            id=offer.id,
            organization_id=offer.organization_id,
            title=offer.title,
            description=offer.description,
            offer_type=offer.offer_type,
            offer_status=status,
            is_active=offer.is_active,
            tier_code_required=offer.tier_code_required,
            max_redemptions_total=offer.max_redemptions_total,
            redemption_limit=offer.max_redemptions_per_passport,
            valid_from=offer.valid_from,
            valid_until=offer.valid_until,
            redemptions_count=redemptions_count,
            created_by_user_id=offer.created_by_user_id,
            moderated_by_user_id=offer.moderated_by_user_id,
            moderated_at=offer.moderated_at,
            rejection_reason=offer.rejection_reason,
            created_at=offer.created_at,
            updated_at=offer.updated_at,
            organization=PartnerOfferOrganizationAdmin(
                id=org.id,
                slug=org.slug,
                name=org.name,
                city=org.city,
                verification_status=org.verification_status,
                visibility=org.visibility,
            ),
        )
