"""Partner creator content persistence (WEB-PARTNERS-06A)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.organization_constants import OrganizationVisibility, VerificationStatus
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES
from app.core.partner_creator_content_constants import PartnerCreatorContentStatus
from app.models.organization import Organization
from app.models.partner_creator_content import PartnerCreatorContent
from app.models.partner_profile import PartnerProfile
from app.services.partner_creator_content_admin_queries import (
    normalize_admin_creator_content_title_query,
)


@dataclass(frozen=True, slots=True)
class PartnerCreatorContentAdminSummaryCounts:
    total: int
    pending_review: int
    published: int
    rejected: int
    archived: int
    draft: int
    contributing_partners: int


class PartnerCreatorContentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, content_id: uuid.UUID) -> PartnerCreatorContent | None:
        result = await self._session.execute(
            select(PartnerCreatorContent)
            .options(
                selectinload(PartnerCreatorContent.organization),
                selectinload(PartnerCreatorContent.created_by),
            )
            .where(PartnerCreatorContent.id == content_id)
        )
        return result.scalar_one_or_none()

    async def fetch_admin_summary(self, *, city: str) -> PartnerCreatorContentAdminSummaryCounts:
        city_filter = func.lower(Organization.city) == city.strip().lower()
        org_join = PartnerCreatorContent.organization_id == Organization.id

        async def _count(*extra: Any) -> int:
            stmt = (
                select(func.count())
                .select_from(PartnerCreatorContent)
                .join(Organization, org_join)
                .where(city_filter, *extra)
            )
            return int((await self._session.execute(stmt)).scalar_one())

        contributing_stmt = (
            select(func.count(func.distinct(PartnerCreatorContent.organization_id)))
            .select_from(PartnerCreatorContent)
            .join(Organization, org_join)
            .where(city_filter)
        )
        contributing_partners = int(
            (await self._session.execute(contributing_stmt)).scalar_one()
        )

        return PartnerCreatorContentAdminSummaryCounts(
            total=await _count(),
            pending_review=await _count(
                PartnerCreatorContent.status == PartnerCreatorContentStatus.PENDING_REVIEW.value,
            ),
            published=await _count(
                PartnerCreatorContent.status == PartnerCreatorContentStatus.PUBLISHED.value,
            ),
            rejected=await _count(
                PartnerCreatorContent.status == PartnerCreatorContentStatus.REJECTED.value,
            ),
            archived=await _count(
                PartnerCreatorContent.status == PartnerCreatorContentStatus.ARCHIVED.value,
            ),
            draft=await _count(
                PartnerCreatorContent.status == PartnerCreatorContentStatus.DRAFT.value,
            ),
            contributing_partners=contributing_partners,
        )

    async def list_admin(
        self,
        *,
        status: str | None,
        city: str | None = None,
        organization_id: uuid.UUID | None = None,
        title_query: str | None = None,
        page: int,
        page_size: int,
        sort_newest: bool = True,
    ) -> tuple[list[PartnerCreatorContent], int]:
        filters: list[Any] = []
        if status is not None:
            filters.append(PartnerCreatorContent.status == status)
        if organization_id is not None:
            filters.append(PartnerCreatorContent.organization_id == organization_id)
        normalized_title = normalize_admin_creator_content_title_query(title_query)
        if normalized_title:
            filters.append(PartnerCreatorContent.title.ilike(f"%{normalized_title}%"))

        base = select(PartnerCreatorContent)
        if city:
            base = base.join(Organization, PartnerCreatorContent.organization_id == Organization.id)
            filters.append(func.lower(Organization.city) == city.strip().lower())

        if filters:
            base = base.where(*filters)

        count_result = await self._session.execute(
            select(func.count()).select_from(base.subquery())
        )
        total = int(count_result.scalar_one())

        order = (
            PartnerCreatorContent.created_at.desc()
            if sort_newest
            else PartnerCreatorContent.created_at.asc()
        )
        stmt = (
            base.options(
                selectinload(PartnerCreatorContent.organization),
                selectinload(PartnerCreatorContent.created_by),
            )
            .order_by(order)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all()), total

    async def list_for_organization_ids(
        self,
        organization_ids: list[uuid.UUID],
        *,
        status: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[PartnerCreatorContent], int]:
        if not organization_ids:
            return [], 0
        filters: list[Any] = [
            PartnerCreatorContent.organization_id.in_(organization_ids),
        ]
        if status is not None:
            filters.append(PartnerCreatorContent.status == status)

        count_stmt = select(func.count()).select_from(PartnerCreatorContent).where(*filters)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        stmt = (
            select(PartnerCreatorContent)
            .options(selectinload(PartnerCreatorContent.organization))
            .where(*filters)
            .order_by(PartnerCreatorContent.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all()), total

    async def list_published_for_city(
        self,
        *,
        city: str,
        limit: int,
        offset: int,
    ) -> tuple[list[PartnerCreatorContent], int]:
        """Published, active contents for public partner orgs in a city (C1-01 hub)."""
        filters = self._published_public_filters(city=city)
        base = (
            select(PartnerCreatorContent)
            .join(Organization, PartnerCreatorContent.organization_id == Organization.id)
            .join(PartnerProfile, PartnerProfile.organization_id == Organization.id)
            .where(*filters)
        )
        count_stmt = select(func.count()).select_from(base.subquery())
        total = int((await self._session.execute(count_stmt)).scalar_one())
        stmt = (
            base.options(selectinload(PartnerCreatorContent.organization))
            .order_by(
                PartnerCreatorContent.moderated_at.desc().nullslast(),
                PartnerCreatorContent.updated_at.desc(),
            )
            .offset(offset)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all()), total

    def _published_public_filters(self, *, city: str | None = None) -> list[Any]:
        filters: list[Any] = [
            PartnerCreatorContent.status == PartnerCreatorContentStatus.PUBLISHED.value,
            PartnerCreatorContent.is_active.is_(True),
            Organization.verification_status == VerificationStatus.VERIFIED.value,
            Organization.visibility == OrganizationVisibility.PUBLIC.value,
            PartnerProfile.partner_status.in_([status.value for status in PUBLIC_PARTNER_STATUSES]),
        ]
        if city is not None:
            filters.append(func.lower(Organization.city) == city.strip().lower())
        return filters

    async def get_published_public_by_id(
        self,
        content_id: uuid.UUID,
    ) -> PartnerCreatorContent | None:
        filters = [PartnerCreatorContent.id == content_id, *self._published_public_filters()]
        stmt = (
            select(PartnerCreatorContent)
            .join(Organization, PartnerCreatorContent.organization_id == Organization.id)
            .join(PartnerProfile, PartnerProfile.organization_id == Organization.id)
            .where(*filters)
            .options(selectinload(PartnerCreatorContent.organization))
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_related_published_for_city(
        self,
        *,
        city: str,
        exclude_id: uuid.UUID,
        limit: int,
    ) -> list[PartnerCreatorContent]:
        filters = [
            PartnerCreatorContent.id != exclude_id,
            *self._published_public_filters(city=city),
        ]
        stmt = (
            select(PartnerCreatorContent)
            .join(Organization, PartnerCreatorContent.organization_id == Organization.id)
            .join(PartnerProfile, PartnerProfile.organization_id == Organization.id)
            .where(*filters)
            .options(selectinload(PartnerCreatorContent.organization))
            .order_by(
                PartnerCreatorContent.moderated_at.desc().nullslast(),
                PartnerCreatorContent.updated_at.desc(),
            )
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    async def list_published_for_organization(
        self,
        organization_id: uuid.UUID,
        *,
        limit: int,
        offset: int,
    ) -> tuple[list[PartnerCreatorContent], int]:
        return await self.list_published_public_for_creator(
            organization_id,
            limit=limit,
            offset=offset,
        )

    async def list_published_public_for_creator(
        self,
        organization_id: uuid.UUID,
        *,
        limit: int,
        offset: int,
    ) -> tuple[list[PartnerCreatorContent], int]:
        """Published public contents for a creator org (C1-03 profile)."""
        filters: list[Any] = [
            PartnerCreatorContent.organization_id == organization_id,
            *self._published_public_filters(),
        ]
        base = (
            select(PartnerCreatorContent)
            .join(Organization, PartnerCreatorContent.organization_id == Organization.id)
            .join(PartnerProfile, PartnerProfile.organization_id == Organization.id)
            .where(*filters)
        )
        count_stmt = select(func.count()).select_from(base.subquery())
        total = int((await self._session.execute(count_stmt)).scalar_one())
        stmt = (
            base.options(selectinload(PartnerCreatorContent.organization))
            .order_by(
                PartnerCreatorContent.moderated_at.desc().nullslast(),
                PartnerCreatorContent.updated_at.desc(),
            )
            .offset(offset)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all()), total

    async def create(self, content: PartnerCreatorContent) -> PartnerCreatorContent:
        self._session.add(content)
        await self._session.flush()
        await self._session.refresh(content, attribute_names=["organization"])
        return content

    async def update_fields(
        self,
        content: PartnerCreatorContent,
        *,
        fields: dict[str, Any],
    ) -> PartnerCreatorContent:
        for key, value in fields.items():
            setattr(content, key, value)
        await self._session.flush()
        return content
