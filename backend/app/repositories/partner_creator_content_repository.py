"""Partner creator content persistence (WEB-PARTNERS-06A)."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.organization_constants import OrganizationVisibility, VerificationStatus
from app.core.partner_creator_content_constants import PartnerCreatorContentStatus
from app.models.organization import Organization
from app.models.partner_creator_content import PartnerCreatorContent


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

    async def list_admin(
        self,
        *,
        status: str | None,
        page: int,
        page_size: int,
        sort_newest: bool = True,
    ) -> tuple[list[PartnerCreatorContent], int]:
        filters: list[Any] = []
        if status is not None:
            filters.append(PartnerCreatorContent.status == status)

        count_stmt = select(func.count()).select_from(PartnerCreatorContent).where(*filters)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        order = (
            PartnerCreatorContent.created_at.desc()
            if sort_newest
            else PartnerCreatorContent.created_at.asc()
        )
        stmt = (
            select(PartnerCreatorContent)
            .options(
                selectinload(PartnerCreatorContent.organization),
                selectinload(PartnerCreatorContent.created_by),
            )
            .where(*filters)
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

    async def list_published_for_organization(
        self,
        organization_id: uuid.UUID,
        *,
        limit: int,
        offset: int,
    ) -> tuple[list[PartnerCreatorContent], int]:
        filters: list[Any] = [
            PartnerCreatorContent.organization_id == organization_id,
            PartnerCreatorContent.status == PartnerCreatorContentStatus.PUBLISHED.value,
            PartnerCreatorContent.is_active.is_(True),
            Organization.verification_status == VerificationStatus.VERIFIED.value,
            Organization.visibility == OrganizationVisibility.PUBLIC.value,
        ]
        count_stmt = (
            select(func.count())
            .select_from(PartnerCreatorContent)
            .join(Organization, PartnerCreatorContent.organization_id == Organization.id)
            .where(*filters)
        )
        total = int((await self._session.execute(count_stmt)).scalar_one())
        stmt = (
            select(PartnerCreatorContent)
            .join(Organization, PartnerCreatorContent.organization_id == Organization.id)
            .where(*filters)
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
