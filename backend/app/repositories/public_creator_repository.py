"""Public creator profile data access (FEATURE-CREATORS-V1 C1-03)."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.organization_constants import OrganizationVisibility, VerificationStatus
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile


class PublicCreatorRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_public_creator_organization(
        self,
        creator_id: uuid.UUID,
    ) -> Organization | None:
        """Resolve a public partner organization eligible as creator profile."""
        stmt = (
            select(Organization)
            .join(PartnerProfile, PartnerProfile.organization_id == Organization.id)
            .options(
                selectinload(Organization.neighborhood),
                selectinload(Organization.partner_profile),
            )
            .where(
                Organization.id == creator_id,
                Organization.verification_status == VerificationStatus.VERIFIED.value,
                Organization.visibility == OrganizationVisibility.PUBLIC.value,
                PartnerProfile.partner_status.in_(
                    [status.value for status in PUBLIC_PARTNER_STATUSES]
                ),
            )
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()
