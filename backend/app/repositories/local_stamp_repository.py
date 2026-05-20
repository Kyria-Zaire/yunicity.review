"""Local stamp persistence (TICKET-504)."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.local_stamp_constants import LocalStampSlug
from app.models.local_stamp import CitizenLocalStamp, StampDefinition


class LocalStampRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_definition_by_slug(self, slug: LocalStampSlug | str) -> StampDefinition | None:
        result = await self._session.execute(
            select(StampDefinition).where(
                StampDefinition.slug == str(slug),
                StampDefinition.is_active.is_(True),
            )
        )
        return result.scalar_one_or_none()

    async def has_stamp(
        self,
        *,
        user_id: uuid.UUID,
        definition_id: uuid.UUID,
        organization_id: uuid.UUID | None,
    ) -> bool:
        query = select(CitizenLocalStamp.id).where(
            CitizenLocalStamp.user_id == user_id,
            CitizenLocalStamp.stamp_definition_id == definition_id,
        )
        if organization_id is not None:
            query = query.where(CitizenLocalStamp.organization_id == organization_id)
        else:
            query = query.where(CitizenLocalStamp.organization_id.is_(None))
        result = await self._session.execute(query.limit(1))
        return result.scalar_one_or_none() is not None

    async def add_stamp(self, stamp: CitizenLocalStamp) -> CitizenLocalStamp:
        self._session.add(stamp)
        await self._session.flush()
        await self._session.refresh(
            stamp,
            attribute_names=["definition", "organization", "partner_offer"],
        )
        return stamp

    async def list_for_user(self, user_id: uuid.UUID) -> list[CitizenLocalStamp]:
        result = await self._session.execute(
            select(CitizenLocalStamp)
            .options(
                selectinload(CitizenLocalStamp.definition),
                selectinload(CitizenLocalStamp.organization),
                selectinload(CitizenLocalStamp.partner_offer),
            )
            .where(CitizenLocalStamp.user_id == user_id)
            .order_by(CitizenLocalStamp.earned_at.desc())
        )
        return list(result.scalars().all())
