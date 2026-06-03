"""Admin partner detail read service (ADMIN-02D1)."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.organization_constants import VerificationStatus
from app.core.partner_constants import PartnershipType, PartnerStatus
from app.models.partner_profile import PartnerProfile
from app.repositories.admin_partner_repository import AdminPartnerRepository
from app.schemas.admin_partner import (
    AdminPartnerDetailCapabilities,
    AdminPartnerDetailLinks,
    AdminPartnerDetailResponse,
    AdminPartnerOperationalCounters,
    AdminPartnerOrganizationDetail,
    AdminPartnerProfileDetail,
)


class AdminPartnerService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = AdminPartnerRepository(session)

    async def get_partner_detail(self, organization_id: UUID) -> AdminPartnerDetailResponse:
        row = await self._repo.get_detail_row(organization_id)
        if row is None:
            raise AppError(
                status_code=404,
                code="ORGANIZATION_NOT_FOUND",
                detail="Organization introuvable.",
            )

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

    def _to_profile_detail(
        self,
        profile: PartnerProfile | None,
    ) -> AdminPartnerProfileDetail | None:
        if profile is None:
            return None
        partner_status = (
            profile.partner_status
            if isinstance(profile.partner_status, PartnerStatus)
            else PartnerStatus(profile.partner_status)
        )
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
        if profile is None:
            verified = (
                verification_status
                if isinstance(verification_status, VerificationStatus)
                else VerificationStatus(verification_status)
            ) == VerificationStatus.VERIFIED
            return AdminPartnerDetailCapabilities(
                can_activate=False,
                can_pause=False,
                can_upgrade_premium=False,
                can_create_profile=verified,
            )

        status = (
            profile.partner_status
            if isinstance(profile.partner_status, PartnerStatus)
            else PartnerStatus(profile.partner_status)
        )
        return AdminPartnerDetailCapabilities(
            can_activate=status == PartnerStatus.SIGNED,
            can_pause=status == PartnerStatus.ACTIVE,
            can_upgrade_premium=status == PartnerStatus.ACTIVE,
            can_create_profile=False,
        )
