"""Neighborhood citizen contributions persistence (FEATURE-QUARTIERS-V2 / Q2-S3-01)."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.neighborhood_v2_constants import NeighborhoodContributionStatus
from app.models.neighborhood_editorial import NeighborhoodContribution


class NeighborhoodContributionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, contribution: NeighborhoodContribution) -> NeighborhoodContribution:
        self._session.add(contribution)
        await self._session.flush()
        return contribution

    async def author_has_pending(self, author_user_id: uuid.UUID) -> bool:
        result = await self._session.execute(
            select(NeighborhoodContribution.id)
            .where(
                NeighborhoodContribution.author_user_id == author_user_id,
                NeighborhoodContribution.status == NeighborhoodContributionStatus.PENDING.value,
            )
            .limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def get_latest_approved_for_author_hood(
        self,
        *,
        author_user_id: uuid.UUID,
        neighborhood_id: uuid.UUID,
    ) -> NeighborhoodContribution | None:
        result = await self._session.execute(
            select(NeighborhoodContribution)
            .where(
                NeighborhoodContribution.author_user_id == author_user_id,
                NeighborhoodContribution.neighborhood_id == neighborhood_id,
                NeighborhoodContribution.status == NeighborhoodContributionStatus.APPROVED.value,
                NeighborhoodContribution.approved_at.is_not(None),
            )
            .order_by(NeighborhoodContribution.approved_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, contribution_id: uuid.UUID) -> NeighborhoodContribution | None:
        return await self._session.get(NeighborhoodContribution, contribution_id)
