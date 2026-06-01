"""Signed partners data access (WEB-PARTNERS-01)."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy.sql import Select

from app.core.organization_constants import VerificationStatus
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES, PartnershipType, PartnerStatus
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile


class PartnerRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _filtered_stmt(
        self,
        *,
        city: str,
        statuses: frozenset[PartnerStatus],
        partnership_type: PartnershipType | None,
        featured_only: bool,
    ) -> Select[tuple[PartnerProfile]]:
        stmt: Select[tuple[PartnerProfile]] = (
            select(PartnerProfile)
            .join(PartnerProfile.organization)
            .where(Organization.city == city)
            .where(
                PartnerProfile.partner_status.in_([status.value for status in statuses])
            )
        )
        if partnership_type is not None:
            stmt = stmt.where(PartnerProfile.partnership_type == partnership_type.value)
        if featured_only:
            stmt = stmt.where(PartnerProfile.is_featured.is_(True))
        return stmt

    async def count_public(
        self,
        *,
        city: str,
        statuses: frozenset[PartnerStatus],
        partnership_type: PartnershipType | None,
        featured_only: bool,
    ) -> int:
        base = self._filtered_stmt(
            city=city,
            statuses=statuses,
            partnership_type=partnership_type,
            featured_only=featured_only,
        )
        stmt = select(func.count()).select_from(base.subquery())
        result = await self._session.execute(stmt)
        return int(result.scalar_one())

    async def list_public(
        self,
        *,
        city: str,
        statuses: frozenset[PartnerStatus],
        partnership_type: PartnershipType | None,
        featured_only: bool,
        limit: int,
        offset: int,
    ) -> list[PartnerProfile]:
        stmt = (
            self._filtered_stmt(
                city=city,
                statuses=statuses,
                partnership_type=partnership_type,
                featured_only=featured_only,
            )
            .options(joinedload(PartnerProfile.organization))
            .order_by(
                PartnerProfile.is_featured.desc(),
                PartnerProfile.featured_priority.desc(),
                Organization.name.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    async def get_by_slug(
        self,
        *,
        city: str,
        slug: str,
    ) -> PartnerProfile | None:
        stmt = (
            select(PartnerProfile)
            .join(PartnerProfile.organization)
            .options(joinedload(PartnerProfile.organization))
            .where(Organization.city == city, Organization.slug == slug)
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalars().unique().one_or_none()

    async def get_by_organization_id(self, organization_id: UUID) -> PartnerProfile | None:
        stmt = (
            select(PartnerProfile)
            .options(joinedload(PartnerProfile.organization))
            .where(PartnerProfile.organization_id == organization_id)
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalars().unique().one_or_none()

    async def get_by_partner_profile_id(self, profile_id: UUID) -> PartnerProfile | None:
        stmt = (
            select(PartnerProfile)
            .options(joinedload(PartnerProfile.organization))
            .where(PartnerProfile.id == profile_id)
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalars().unique().one_or_none()

    @staticmethod
    def default_public_statuses() -> frozenset[PartnerStatus]:
        return PUBLIC_PARTNER_STATUSES

    @staticmethod
    def is_verified_organization(org: Organization) -> bool:
        status = (
            org.verification_status
            if isinstance(org.verification_status, VerificationStatus)
            else VerificationStatus(org.verification_status)
        )
        return status == VerificationStatus.VERIFIED
