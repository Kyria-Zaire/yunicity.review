"""Admin partner detail and staff actions (ADMIN-02D1 / 02D3A)."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.organization_constants import OrganizationVisibility, VerificationStatus
from app.core.partner_admin_constants import (
    FEATURED_ELIGIBLE_PARTNER_STATUSES,
    PartnerAdminAction,
)
from app.core.partner_constants import PartnershipType, PartnerStatus
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile
from app.models.user import User
from app.repositories.admin_partner_repository import AdminPartnerDetailRow, AdminPartnerRepository
from app.schemas.admin_partner import (
    AdminPartnerActivateRequest,
    AdminPartnerCreateProfileRequest,
    AdminPartnerDetailCapabilities,
    AdminPartnerDetailLinks,
    AdminPartnerDetailResponse,
    AdminPartnerOperationalCounters,
    AdminPartnerOrganizationDetail,
    AdminPartnerPatchRequest,
    AdminPartnerPauseRequest,
    AdminPartnerProfileDetail,
    AdminPartnerUpgradePremiumRequest,
)


class AdminPartnerService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = AdminPartnerRepository(session)

    async def get_partner_detail(self, organization_id: UUID) -> AdminPartnerDetailResponse:
        row = await self._require_detail_row(organization_id)
        return await self._build_detail_response(row)

    async def create_profile(
        self,
        organization_id: UUID,
        actor: User,
        payload: AdminPartnerCreateProfileRequest,
    ) -> AdminPartnerDetailResponse:
        row = await self._require_detail_row(organization_id)
        self._require_verified(row.organization)
        if row.partner_profile is not None:
            raise AppError(
                status_code=409,
                code="PARTNER_PROFILE_ALREADY_EXISTS",
                detail="Un profil partenaire existe déjà pour cette organisation.",
            )

        now = datetime.now(UTC)
        profile = PartnerProfile(
            organization_id=row.organization.id,
            partner_status=PartnerStatus.SIGNED,
            partnership_type=payload.partnership_type,
            signed_at=now,
            activated_at=None,
            public_partner_label=payload.public_partner_label,
            is_featured=False,
        )
        await self._repo.add_partner_profile(profile)
        await self._repo.record_admin_action(
            organization_id=row.organization.id,
            partner_profile_id=profile.id,
            action=PartnerAdminAction.CREATE_PROFILE.value,
            actor_user_id=actor.id,
            previous_status=None,
            new_status=PartnerStatus.SIGNED.value,
            reason=payload.reason,
        )
        await self._commit_and_refresh()
        return await self.get_partner_detail(organization_id)

    async def activate(
        self,
        organization_id: UUID,
        actor: User,
        payload: AdminPartnerActivateRequest,
    ) -> AdminPartnerDetailResponse:
        row = await self._require_detail_row(organization_id)
        self._require_verified(row.organization)
        profile = self._require_profile(row)
        status = self._partner_status(profile)
        previous_status = status.value

        if status == PartnerStatus.SIGNED:
            profile.partner_status = PartnerStatus.ACTIVE
            profile.activated_at = datetime.now(UTC)
            new_status = PartnerStatus.ACTIVE.value
        elif status == PartnerStatus.PAUSED:
            profile.partner_status = PartnerStatus.ACTIVE
            new_status = PartnerStatus.ACTIVE.value
        else:
            raise AppError(
                status_code=422,
                code="INVALID_PARTNER_STATUS_TRANSITION",
                detail="Seuls les partenaires signés ou en pause peuvent être activés.",
            )

        prev_visibility: str | None = None
        new_visibility: str | None = None
        if payload.visibility is not None:
            prev_visibility, new_visibility = await self._apply_visibility(
                row.organization,
                payload.visibility,
            )

        await self._repo.update_partner_profile(profile)
        await self._repo.record_admin_action(
            organization_id=row.organization.id,
            partner_profile_id=profile.id,
            action=PartnerAdminAction.ACTIVATE.value,
            actor_user_id=actor.id,
            previous_status=previous_status,
            new_status=new_status,
            previous_visibility=prev_visibility,
            new_visibility=new_visibility,
            reason=payload.reason,
        )
        await self._commit_and_refresh()
        return await self.get_partner_detail(organization_id)

    async def pause(
        self,
        organization_id: UUID,
        actor: User,
        payload: AdminPartnerPauseRequest,
    ) -> AdminPartnerDetailResponse:
        row = await self._require_detail_row(organization_id)
        profile = self._require_profile(row)
        status = self._partner_status(profile)
        previous_status = status.value

        if status not in {PartnerStatus.ACTIVE, PartnerStatus.PREMIUM}:
            raise AppError(
                status_code=422,
                code="INVALID_PARTNER_STATUS_TRANSITION",
                detail="Seuls les partenaires actifs ou premium peuvent être mis en pause.",
            )

        profile.partner_status = PartnerStatus.PAUSED
        await self._repo.update_partner_profile(profile)
        await self._repo.record_admin_action(
            organization_id=row.organization.id,
            partner_profile_id=profile.id,
            action=PartnerAdminAction.PAUSE.value,
            actor_user_id=actor.id,
            previous_status=previous_status,
            new_status=PartnerStatus.PAUSED.value,
            reason=payload.reason,
        )
        await self._commit_and_refresh()
        return await self.get_partner_detail(organization_id)

    async def upgrade_premium(
        self,
        organization_id: UUID,
        actor: User,
        payload: AdminPartnerUpgradePremiumRequest,
    ) -> AdminPartnerDetailResponse:
        row = await self._require_detail_row(organization_id)
        profile = self._require_profile(row)
        status = self._partner_status(profile)
        previous_status = status.value

        if status != PartnerStatus.ACTIVE:
            raise AppError(
                status_code=422,
                code="INVALID_PARTNER_STATUS_TRANSITION",
                detail="Seul un partenaire actif peut passer en premium.",
            )

        profile.partner_status = PartnerStatus.PREMIUM
        await self._repo.update_partner_profile(profile)
        await self._repo.record_admin_action(
            organization_id=row.organization.id,
            partner_profile_id=profile.id,
            action=PartnerAdminAction.UPGRADE_PREMIUM.value,
            actor_user_id=actor.id,
            previous_status=previous_status,
            new_status=PartnerStatus.PREMIUM.value,
            reason=payload.reason,
        )
        await self._commit_and_refresh()
        return await self.get_partner_detail(organization_id)

    async def patch_settings(
        self,
        organization_id: UUID,
        actor: User,
        payload: AdminPartnerPatchRequest,
    ) -> AdminPartnerDetailResponse:
        row = await self._require_detail_row(organization_id)
        profile = self._require_profile(row)
        updates = payload.model_dump(exclude_unset=True)
        if not updates:
            raise AppError(
                status_code=422,
                code="EMPTY_PATCH_PAYLOAD",
                detail="Aucun champ à mettre à jour.",
            )

        status = self._partner_status(profile)
        previous_status = status.value
        prev_visibility: str | None = None
        new_visibility: str | None = None

        if "visibility" in updates:
            prev_visibility, new_visibility = await self._apply_visibility(
                row.organization,
                updates["visibility"],
            )

        if updates.get("is_featured") is True and status not in FEATURED_ELIGIBLE_PARTNER_STATUSES:
            raise AppError(
                status_code=422,
                code="FEATURED_REQUIRES_ACTIVE_PARTNER",
                detail=(
                    "Le partenaire doit être actif, premium ou fondateur pour être mis en avant."
                ),
            )

        if "is_featured" in updates:
            profile.is_featured = updates["is_featured"]
        if "public_partner_label" in updates:
            profile.public_partner_label = updates["public_partner_label"]

        await self._repo.update_partner_profile(profile)
        await self._repo.record_admin_action(
            organization_id=row.organization.id,
            partner_profile_id=profile.id,
            action=PartnerAdminAction.UPDATE_SETTINGS.value,
            actor_user_id=actor.id,
            previous_status=previous_status,
            new_status=previous_status,
            previous_visibility=prev_visibility,
            new_visibility=new_visibility,
            reason=None,
            metadata={"fields": sorted(updates.keys())},
        )
        await self._commit_and_refresh()
        return await self.get_partner_detail(organization_id)

    async def _commit_and_refresh(self) -> None:
        await self._session.commit()
        self._session.expire_all()

    async def _require_detail_row(self, organization_id: UUID) -> AdminPartnerDetailRow:
        row = await self._repo.get_detail_row(organization_id)
        if row is None:
            raise AppError(
                status_code=404,
                code="ORGANIZATION_NOT_FOUND",
                detail="Organization introuvable.",
            )
        return row

    async def _build_detail_response(
        self,
        row: AdminPartnerDetailRow,
    ) -> AdminPartnerDetailResponse:
        org = row.organization
        counters_raw = await self._repo.fetch_counters(org.id)
        org_id_str = str(org.id)

        return AdminPartnerDetailResponse(
            organization=AdminPartnerOrganizationDetail(
                id=org.id,
                name=org.name,
                slug=org.slug,
                type=org.type,
                city=org.city,
                visibility=org.visibility,
                verification_status=org.verification_status,
                created_at=org.created_at,
                updated_at=org.updated_at,
            ),
            partner_profile=self._to_profile_detail(row.partner_profile),
            counters=AdminPartnerOperationalCounters(
                offers_total=counters_raw.offers_total,
                offers_pending=counters_raw.offers_pending,
                offers_published=counters_raw.offers_published,
                creator_contents_total=counters_raw.creator_contents_total,
                creator_contents_pending=counters_raw.creator_contents_pending,
                events_total=counters_raw.events_total,
                events_pending=counters_raw.events_pending,
                stamps_total=counters_raw.stamps_total,
                redemptions_total=counters_raw.redemptions_total,
                redemptions_completed=counters_raw.redemptions_completed,
            ),
            links=AdminPartnerDetailLinks(
                public_place_slug=org.slug,
                organization_id=org_id_str,
                offers_admin=f"/passport-offers?organization_id={org_id_str}",
                creator_content_admin="/creator-content",
                verification_queue=(
                    f"/partners?tab=verification&organization_id={org_id_str}"
                ),
            ),
            capabilities=self._build_capabilities(org.verification_status, row.partner_profile),
        )

    async def _apply_visibility(
        self,
        organization: Organization,
        target: OrganizationVisibility,
    ) -> tuple[str | None, str | None]:
        current = (
            organization.visibility
            if isinstance(organization.visibility, OrganizationVisibility)
            else OrganizationVisibility(organization.visibility)
        )
        if target == current:
            return current.value, current.value

        verification = (
            organization.verification_status
            if isinstance(organization.verification_status, VerificationStatus)
            else VerificationStatus(organization.verification_status)
        )
        if target in {OrganizationVisibility.PUBLIC, OrganizationVisibility.UNLISTED}:
            if verification != VerificationStatus.VERIFIED:
                raise AppError(
                    status_code=422,
                    code="ORGANIZATION_NOT_VERIFIED",
                    detail="La visibilité publique exige une organisation vérifiée.",
                )

        previous = current.value
        organization.visibility = target
        await self._repo.update_organization(organization)
        return previous, target.value

    @staticmethod
    def _require_verified(organization: Organization) -> None:
        verification = (
            organization.verification_status
            if isinstance(organization.verification_status, VerificationStatus)
            else VerificationStatus(organization.verification_status)
        )
        if verification != VerificationStatus.VERIFIED:
            raise AppError(
                status_code=422,
                code="ORGANIZATION_NOT_VERIFIED",
                detail="L'organisation doit être vérifiée pour cette action.",
            )

    @staticmethod
    def _require_profile(row: AdminPartnerDetailRow) -> PartnerProfile:
        if row.partner_profile is None:
            raise AppError(
                status_code=404,
                code="PARTNER_PROFILE_NOT_FOUND",
                detail="Profil partenaire introuvable pour cette organisation.",
            )
        return row.partner_profile

    @staticmethod
    def _partner_status(profile: PartnerProfile) -> PartnerStatus:
        return (
            profile.partner_status
            if isinstance(profile.partner_status, PartnerStatus)
            else PartnerStatus(profile.partner_status)
        )

    def _to_profile_detail(
        self,
        profile: PartnerProfile | None,
    ) -> AdminPartnerProfileDetail | None:
        if profile is None:
            return None
        partner_status = self._partner_status(profile)
        partnership_type = (
            profile.partnership_type
            if isinstance(profile.partnership_type, PartnershipType)
            else PartnershipType(profile.partnership_type)
        )
        return AdminPartnerProfileDetail(
            partner_status=partner_status,
            partnership_type=partnership_type,
            is_featured=profile.is_featured,
            signed_at=profile.signed_at,
            activated_at=profile.activated_at,
        )

    def _build_capabilities(
        self,
        verification_status: VerificationStatus,
        profile: PartnerProfile | None,
    ) -> AdminPartnerDetailCapabilities:
        verified = (
            verification_status
            if isinstance(verification_status, VerificationStatus)
            else VerificationStatus(verification_status)
        ) == VerificationStatus.VERIFIED

        if profile is None:
            return AdminPartnerDetailCapabilities(
                can_activate=False,
                can_pause=False,
                can_upgrade_premium=False,
                can_create_profile=verified,
                can_update_settings=False,
            )

        status = self._partner_status(profile)
        can_activate = verified and status in {PartnerStatus.SIGNED, PartnerStatus.PAUSED}
        return AdminPartnerDetailCapabilities(
            can_activate=can_activate,
            can_pause=status in {PartnerStatus.ACTIVE, PartnerStatus.PREMIUM},
            can_upgrade_premium=status == PartnerStatus.ACTIVE,
            can_create_profile=False,
            can_update_settings=True,
        )
