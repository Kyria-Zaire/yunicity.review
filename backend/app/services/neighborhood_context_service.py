"""Territorial context for a neighborhood — no rankings (TICKET-602)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import AppError
from app.core.local_event_constants import LocalEventModerationStatus
from app.core.neighborhood_constants import (
    NEIGHBORHOOD_CONTEXT_EVENTS_LIMIT,
    NEIGHBORHOOD_CONTEXT_OFFERS_LIMIT,
    NEIGHBORHOOD_CONTEXT_ORGS_LIMIT,
    NEIGHBORHOOD_CONTEXT_POSTS_LIMIT,
)
from app.core.organization_constants import VerificationStatus
from app.core.passport_constants import PartnerOfferStatus
from app.models.local_event import LocalEvent
from app.models.organization import Organization
from app.models.passport import PartnerOffer
from app.models.post import Post
from app.repositories.neighborhood_repository import NeighborhoodRepository
from app.schemas.neighborhood import (
    NeighborhoodContextEventItem,
    NeighborhoodContextOfferItem,
    NeighborhoodContextOrganizationItem,
    NeighborhoodContextPostItem,
    NeighborhoodContextResponse,
    NeighborhoodContextStats,
)
from app.services.neighborhood_service import NeighborhoodService


class NeighborhoodContextService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._neighborhoods = NeighborhoodRepository(session)

    async def get_context(self, *, city: str, slug: str) -> NeighborhoodContextResponse:
        hood = await self._neighborhoods.get_by_city_slug(city=city, slug=slug, active_only=True)
        if hood is None:
            raise AppError(
                status_code=404,
                code="NEIGHBORHOOD_NOT_FOUND",
                detail="Quartier introuvable.",
            )
        hood_id = hood.id
        now = datetime.now(UTC)

        events = await self._recent_events(hood_id, now=now)
        orgs = await self._organizations(hood_id)
        offers = await self._recent_offers(hood_id)
        posts = await self._recent_posts(hood_id)

        stats = NeighborhoodContextStats(
            events_count=await self._count_events(hood_id, now=now),
            organizations_count=await self._count_organizations(hood_id),
            offers_count=await self._count_offers(hood_id),
            posts_count=await self._count_posts(hood_id),
        )

        return NeighborhoodContextResponse(
            neighborhood=NeighborhoodService._to_response(hood),
            stats=stats,
            recent_events=events,
            organizations=orgs,
            recent_offers=offers,
            recent_posts=posts,
        )

    async def _recent_events(
        self, neighborhood_id: uuid.UUID, *, now: datetime
    ) -> list[NeighborhoodContextEventItem]:
        stmt = (
            select(LocalEvent)
            .where(
                LocalEvent.neighborhood_id == neighborhood_id,
                LocalEvent.moderation_status == LocalEventModerationStatus.APPROVED.value,
                LocalEvent.is_cancelled.is_(False),
                LocalEvent.starts_at >= now,
            )
            .order_by(LocalEvent.starts_at.asc())
            .limit(NEIGHBORHOOD_CONTEXT_EVENTS_LIMIT)
        )
        result = await self._session.execute(stmt)
        return [
            NeighborhoodContextEventItem(
                id=row.id,
                title=row.title,
                starts_at=row.starts_at,
                location_name=row.location_name,
            )
            for row in result.scalars().all()
        ]

    async def _organizations(
        self, neighborhood_id: uuid.UUID
    ) -> list[NeighborhoodContextOrganizationItem]:
        stmt = (
            select(Organization)
            .where(
                Organization.neighborhood_id == neighborhood_id,
                Organization.verification_status == VerificationStatus.VERIFIED.value,
            )
            .order_by(Organization.name.asc())
            .limit(NEIGHBORHOOD_CONTEXT_ORGS_LIMIT)
        )
        result = await self._session.execute(stmt)
        return [
            NeighborhoodContextOrganizationItem(id=row.id, name=row.name, slug=row.slug)
            for row in result.scalars().all()
        ]

    async def _recent_offers(
        self, neighborhood_id: uuid.UUID
    ) -> list[NeighborhoodContextOfferItem]:
        stmt = (
            select(PartnerOffer)
            .where(
                PartnerOffer.neighborhood_id == neighborhood_id,
                PartnerOffer.status == PartnerOfferStatus.PUBLISHED.value,
                PartnerOffer.is_active.is_(True),
            )
            .options(selectinload(PartnerOffer.organization))
            .order_by(PartnerOffer.updated_at.desc())
            .limit(NEIGHBORHOOD_CONTEXT_OFFERS_LIMIT)
        )
        result = await self._session.execute(stmt)
        return [
            NeighborhoodContextOfferItem(
                id=row.id,
                title=row.title,
                organization_name=row.organization.name,
            )
            for row in result.scalars().all()
        ]

    async def _recent_posts(self, neighborhood_id: uuid.UUID) -> list[NeighborhoodContextPostItem]:
        stmt = (
            select(Post)
            .where(Post.neighborhood_id == neighborhood_id, Post.is_active.is_(True))
            .order_by(Post.created_at.desc())
            .limit(NEIGHBORHOOD_CONTEXT_POSTS_LIMIT)
        )
        result = await self._session.execute(stmt)
        return [
            NeighborhoodContextPostItem(
                id=row.id,
                type=row.type,
                title=row.title,
                body=row.body,
                created_at=row.created_at,
            )
            for row in result.scalars().all()
        ]

    async def _count_events(self, neighborhood_id: uuid.UUID, *, now: datetime) -> int:
        stmt = (
            select(func.count())
            .select_from(LocalEvent)
            .where(
                LocalEvent.neighborhood_id == neighborhood_id,
                LocalEvent.moderation_status == LocalEventModerationStatus.APPROVED.value,
                LocalEvent.is_cancelled.is_(False),
                LocalEvent.starts_at >= now,
            )
        )
        return int((await self._session.execute(stmt)).scalar_one())

    async def _count_organizations(self, neighborhood_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Organization)
            .where(
                Organization.neighborhood_id == neighborhood_id,
                Organization.verification_status == VerificationStatus.VERIFIED.value,
            )
        )
        return int((await self._session.execute(stmt)).scalar_one())

    async def _count_offers(self, neighborhood_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(PartnerOffer)
            .where(
                PartnerOffer.neighborhood_id == neighborhood_id,
                PartnerOffer.status == PartnerOfferStatus.PUBLISHED.value,
                PartnerOffer.is_active.is_(True),
            )
        )
        return int((await self._session.execute(stmt)).scalar_one())

    async def _count_posts(self, neighborhood_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Post)
            .where(
                Post.neighborhood_id == neighborhood_id,
                Post.is_active.is_(True),
            )
        )
        return int((await self._session.execute(stmt)).scalar_one())
