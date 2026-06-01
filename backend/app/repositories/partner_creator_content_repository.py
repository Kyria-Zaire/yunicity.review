"""Partner creator content persistence (WEB-PARTNERS-06A)."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.partner_creator_content import PartnerCreatorContent


class PartnerCreatorContentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, content_id: uuid.UUID) -> PartnerCreatorContent | None:
        result = await self._session.execute(
            select(PartnerCreatorContent)
            .options(selectinload(PartnerCreatorContent.organization))
            .where(PartnerCreatorContent.id == content_id)
        )
        return result.scalar_one_or_none()

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
