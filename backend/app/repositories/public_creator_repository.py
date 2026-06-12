"""Public creator profile data access (FEATURE-CREATORS-V1 C1-03)."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.organization_constants import OrganizationVisibility, VerificationStatus
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES
from app.core.partner_creator_content_constants import PartnerCreatorContentStatus
from app.models.neighborhood import Neighborhood
from app.models.organization import Organization
from app.models.partner_creator_content import PartnerCreatorContent
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

    async def list_public_creators_with_published_content(
        self,
        *,
        city: str,
        query: str | None,
        limit: int,
        offset: int,
    ) -> tuple[list[tuple[Organization, int]], int]:
        """Creators with at least one published public content (C1-04 directory)."""
        trimmed_city = city.strip()
        published_count = func.count(PartnerCreatorContent.id).label("published_count")
        filters: list[Any] = [
            Organization.verification_status == VerificationStatus.VERIFIED.value,
            Organization.visibility == OrganizationVisibility.PUBLIC.value,
            func.lower(Organization.city) == trimmed_city.lower(),
            PartnerProfile.partner_status.in_(
                [status.value for status in PUBLIC_PARTNER_STATUSES]
            ),
            PartnerCreatorContent.status == PartnerCreatorContentStatus.PUBLISHED.value,
            PartnerCreatorContent.is_active.is_(True),
        ]
        normalized_query = (query or "").strip()
        if normalized_query:
            pattern = f"%{normalized_query}%"
            filters.append(
                or_(
                    Organization.name.ilike(pattern),
                    PartnerProfile.public_partner_label.ilike(pattern),
                    Neighborhood.display_name.ilike(pattern),
                )
            )

        grouped = (
            select(Organization.id.label("organization_id"), published_count)
            .join(PartnerProfile, PartnerProfile.organization_id == Organization.id)
            .join(
                PartnerCreatorContent,
                PartnerCreatorContent.organization_id == Organization.id,
            )
            .outerjoin(Neighborhood, Organization.neighborhood_id == Neighborhood.id)
            .where(*filters)
            .group_by(Organization.id)
            .having(published_count > 0)
        ).subquery()

        total = int(
            (await self._session.execute(select(func.count()).select_from(grouped))).scalar_one()
        )

        stmt = (
            select(Organization, grouped.c.published_count)
            .join(grouped, Organization.id == grouped.c.organization_id)
            .options(
                selectinload(Organization.neighborhood),
                selectinload(Organization.partner_profile),
            )
            .order_by(grouped.c.published_count.desc(), Organization.name.asc())
            .offset(offset)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        rows = [(org, int(count)) for org, count in result.all()]
        return rows, total
