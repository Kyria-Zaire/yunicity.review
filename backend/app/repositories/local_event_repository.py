"""Local event persistence (TICKET-505)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.local_event_constants import LocalEventModerationStatus
from app.models.local_event import EventInterest, LocalEvent


class LocalEventRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, event_id: uuid.UUID) -> LocalEvent | None:
        from app.models.organization import Organization  # local import évite circulaire

        result = await self._session.execute(
            select(LocalEvent)
            .options(
                selectinload(LocalEvent.organization).selectinload(Organization.partner_profile),
                selectinload(LocalEvent.neighborhood),
            )
            .where(LocalEvent.id == event_id)
        )
        return result.scalar_one_or_none()

    async def add(self, event: LocalEvent) -> LocalEvent:
        self._session.add(event)
        await self._session.flush()
        return event

    async def update_fields(self, event: LocalEvent, *, fields: dict[str, object]) -> None:
        for key, value in fields.items():
            setattr(event, key, value)
        await self._session.flush()

    async def list_public_for_city(
        self,
        *,
        city: str | None,
        limit: int,
        offset: int = 0,
        now: datetime | None = None,
        organization_slug: str | None = None,
    ) -> list[LocalEvent]:
        from app.models.organization import Organization  # local import évite circulaire

        stmt = (
            select(LocalEvent)
            .options(
                selectinload(LocalEvent.organization).selectinload(Organization.partner_profile),
                selectinload(LocalEvent.neighborhood),
            )
            .where(
                LocalEvent.moderation_status == LocalEventModerationStatus.APPROVED.value,
                LocalEvent.is_cancelled.is_(False),
                LocalEvent.visibility == "public",
            )
            .order_by(LocalEvent.starts_at.asc())
            .limit(limit)
            .offset(offset)
        )
        if city:
            stmt = stmt.where(func.lower(LocalEvent.city) == city.strip().lower())
        if now is not None:
            stmt = stmt.where(LocalEvent.starts_at >= now)
        if organization_slug is not None:
            stmt = (
                stmt
                .join(Organization, Organization.id == LocalEvent.organization_id)
                .where(Organization.slug == organization_slug.strip().lower())
            )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_public_in_bbox(
        self,
        *,
        lat_min: float,
        lon_min: float,
        lat_max: float,
        lon_max: float,
        city: str | None,
        limit: int,
        now: datetime,
    ) -> list[LocalEvent]:
        stmt = (
            select(LocalEvent)
            .options(selectinload(LocalEvent.neighborhood))
            .where(
                LocalEvent.moderation_status == LocalEventModerationStatus.APPROVED.value,
                LocalEvent.is_cancelled.is_(False),
                LocalEvent.visibility == "public",
                LocalEvent.starts_at >= now,
                LocalEvent.latitude.is_not(None),
                LocalEvent.longitude.is_not(None),
                LocalEvent.latitude >= lat_min,
                LocalEvent.latitude <= lat_max,
                LocalEvent.longitude >= lon_min,
                LocalEvent.longitude <= lon_max,
            )
            .order_by(LocalEvent.starts_at.asc())
            .limit(limit)
        )
        if city:
            stmt = stmt.where(func.lower(LocalEvent.city) == city.strip().lower())
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_for_organization_ids(
        self,
        organization_ids: list[uuid.UUID],
        *,
        page: int,
        page_size: int,
    ) -> tuple[list[LocalEvent], int]:
        if not organization_ids:
            return [], 0
        base = select(LocalEvent).where(LocalEvent.organization_id.in_(organization_ids))
        count_result = await self._session.execute(
            select(func.count()).select_from(base.subquery())
        )
        total = int(count_result.scalar_one())
        result = await self._session.execute(
            base.options(selectinload(LocalEvent.organization))
            .order_by(LocalEvent.starts_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total

    async def list_admin(
        self,
        *,
        moderation_status: str | None,
        city: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[LocalEvent], int]:
        base = select(LocalEvent)
        if moderation_status:
            base = base.where(LocalEvent.moderation_status == moderation_status)
        if city:
            base = base.where(func.lower(LocalEvent.city) == city.strip().lower())
        count_result = await self._session.execute(
            select(func.count()).select_from(base.subquery())
        )
        total = int(count_result.scalar_one())
        result = await self._session.execute(
            base.options(selectinload(LocalEvent.organization))
            .order_by(LocalEvent.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total

    async def get_interest(
        self, *, user_id: uuid.UUID, event_id: uuid.UUID
    ) -> EventInterest | None:
        result = await self._session.execute(
            select(EventInterest).where(
                EventInterest.user_id == user_id,
                EventInterest.event_id == event_id,
            )
        )
        return result.scalar_one_or_none()

    async def count_interests_for_event(self, event_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(EventInterest)
            .where(EventInterest.event_id == event_id)
        )
        return int(result.scalar_one())

    async def add_interest(self, interest: EventInterest) -> EventInterest:
        self._session.add(interest)
        await self._session.flush()
        return interest

    async def delete_interest(self, interest: EventInterest) -> None:
        await self._session.delete(interest)
        await self._session.flush()

    async def list_saved_for_user(self, user_id: uuid.UUID, *, limit: int) -> list[LocalEvent]:
        result = await self._session.execute(
            select(LocalEvent)
            .join(EventInterest, EventInterest.event_id == LocalEvent.id)
            .options(
                selectinload(LocalEvent.organization),
                selectinload(LocalEvent.neighborhood),
            )
            .where(
                EventInterest.user_id == user_id,
                LocalEvent.moderation_status == LocalEventModerationStatus.APPROVED.value,
                LocalEvent.is_cancelled.is_(False),
            )
            .order_by(LocalEvent.starts_at.asc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_public_for_partner_org(
        self,
        *,
        organization_id: uuid.UUID,
        upcoming_only: bool,
        limit: int,
        offset: int,
        now: datetime,
    ) -> tuple[list[LocalEvent], int]:
        from app.models.organization import Organization  # local import évite circulaire

        base = (
            select(LocalEvent)
            .options(
                selectinload(LocalEvent.organization).selectinload(Organization.partner_profile),
                selectinload(LocalEvent.neighborhood),
            )
            .where(
                LocalEvent.organization_id == organization_id,
                LocalEvent.moderation_status == LocalEventModerationStatus.APPROVED.value,
                LocalEvent.is_cancelled.is_(False),
                LocalEvent.visibility == "public",
            )
        )
        if upcoming_only:
            base = base.where(LocalEvent.starts_at >= now)

        count_result = await self._session.execute(
            select(func.count()).select_from(base.subquery())
        )
        total = int(count_result.scalar_one())

        result = await self._session.execute(
            base.order_by(LocalEvent.starts_at.asc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), total

    async def interest_event_ids_for_user(
        self, user_id: uuid.UUID, event_ids: list[uuid.UUID]
    ) -> set[uuid.UUID]:
        if not event_ids:
            return set()
        result = await self._session.execute(
            select(EventInterest.event_id).where(
                EventInterest.user_id == user_id,
                EventInterest.event_id.in_(event_ids),
            )
        )
        return set(result.scalars().all())
