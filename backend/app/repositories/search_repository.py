"""Full-text search persistence (FEATURE-B / TICKET-B.4)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ColumnElement

from app.core.local_event_constants import LocalEventModerationStatus, LocalEventVisibility
from app.core.organization_constants import OrganizationVisibility, VerificationStatus
from app.core.passport_constants import PartnerOfferStatus
from app.core.search_constants import FTS_CONFIG, SearchPeriod
from app.core.tribe_constants import TribeVisibility
from app.models.local_event import LocalEvent
from app.models.neighborhood import Neighborhood
from app.models.organization import Organization
from app.models.passport import PartnerOffer
from app.models.post import Post
from app.models.tribe import Tribe
from app.models.user import User
from app.models.user_profile import ProfileVisibility, UserProfile


@dataclass(frozen=True)
class SearchRow:
    entity_id: uuid.UUID
    rank: float
    title: str | None = None
    name: str | None = None
    slug: str | None = None
    city: str | None = None
    body: str | None = None
    username: str | None = None
    starts_at: datetime | None = None
    is_flash: bool | None = None


class SearchRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _tsquery(self, query: str) -> ColumnElement[object]:
        return func.plainto_tsquery(FTS_CONFIG, query)

    def _rank(self, vector: Any, query: str) -> Any:
        return func.ts_rank_cd(vector, self._tsquery(query))

    def _city_match(self, column: Any, city_lower: str) -> Any:
        return func.lower(column) == city_lower

    async def resolve_neighborhood_id(
        self,
        *,
        city_lower: str,
        neighborhood_slug: str | None,
    ) -> uuid.UUID | None:
        if not neighborhood_slug:
            return None
        result = await self._session.execute(
            select(Neighborhood.id).where(
                func.lower(Neighborhood.city) == city_lower,
                Neighborhood.slug == neighborhood_slug.strip().lower(),
                Neighborhood.is_active.is_(True),
            )
        )
        return result.scalar_one_or_none()

    async def search_posts(
        self,
        *,
        query: str,
        city_lower: str,
        neighborhood_id: uuid.UUID | None,
        limit: int,
        offset: int,
    ) -> tuple[list[SearchRow], int]:
        tsq = self._tsquery(query)
        rank = self._rank(Post.search_vector, query)
        filters = [
            Post.is_active.is_(True),
            Post.tribe_id.is_(None),
            self._city_match(Post.city, city_lower),
            Post.search_vector.op("@@")(tsq),
        ]
        if neighborhood_id is not None:
            filters.append(Post.neighborhood_id == neighborhood_id)
        base = select(Post.id, Post.title, Post.body, Post.city, rank.label("rank")).where(
            *filters
        )
        count_stmt = select(func.count()).select_from(base.subquery())
        total = int((await self._session.execute(count_stmt)).scalar_one())
        rows = await self._session.execute(
            base.order_by(rank.desc(), Post.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        items = [
            SearchRow(
                entity_id=row.id,
                rank=float(row.rank),
                title=row.title,
                body=row.body,
                city=row.city,
            )
            for row in rows.all()
        ]
        return items, total

    async def search_events(
        self,
        *,
        query: str,
        city_lower: str,
        neighborhood_id: uuid.UUID | None,
        period: SearchPeriod,
        now: datetime,
        limit: int,
        offset: int,
    ) -> tuple[list[SearchRow], int]:
        tsq = self._tsquery(query)
        rank = self._rank(LocalEvent.search_vector, query)
        filters: list[ColumnElement[bool]] = [
            LocalEvent.moderation_status == LocalEventModerationStatus.APPROVED.value,
            LocalEvent.is_cancelled.is_(False),
            LocalEvent.visibility == LocalEventVisibility.PUBLIC.value,
            self._city_match(LocalEvent.city, city_lower),
            LocalEvent.search_vector.op("@@")(tsq),
        ]
        if neighborhood_id is not None:
            filters.append(LocalEvent.neighborhood_id == neighborhood_id)
        if period == SearchPeriod.UPCOMING:
            filters.append(LocalEvent.starts_at >= now)
        elif period == SearchPeriod.PAST:
            filters.append(LocalEvent.starts_at < now)

        base = select(
            LocalEvent.id,
            LocalEvent.title,
            LocalEvent.city,
            LocalEvent.starts_at,
            rank.label("rank"),
        ).where(*filters)
        count_stmt = select(func.count()).select_from(base.subquery())
        total = int((await self._session.execute(count_stmt)).scalar_one())
        if period == SearchPeriod.PAST:
            order_stmt = base.order_by(rank.desc(), LocalEvent.starts_at.desc())
        else:
            order_stmt = base.order_by(rank.desc(), LocalEvent.starts_at.asc())
        rows = await self._session.execute(order_stmt.limit(limit).offset(offset))
        items = [
            SearchRow(
                entity_id=row.id,
                rank=float(row.rank),
                title=row.title,
                city=row.city,
                starts_at=row.starts_at,
            )
            for row in rows.all()
        ]
        return items, total

    async def search_organizations(
        self,
        *,
        query: str,
        city_lower: str,
        neighborhood_id: uuid.UUID | None,
        limit: int,
        offset: int,
    ) -> tuple[list[SearchRow], int]:
        tsq = self._tsquery(query)
        rank = self._rank(Organization.search_vector, query)
        filters = [
            Organization.verification_status == VerificationStatus.VERIFIED.value,
            Organization.visibility == OrganizationVisibility.PUBLIC.value,
            self._city_match(Organization.city, city_lower),
            Organization.search_vector.op("@@")(tsq),
        ]
        if neighborhood_id is not None:
            filters.append(Organization.neighborhood_id == neighborhood_id)
        base = select(
            Organization.id,
            Organization.name,
            Organization.slug,
            Organization.city,
            rank.label("rank"),
        ).where(*filters)
        count_stmt = select(func.count()).select_from(base.subquery())
        total = int((await self._session.execute(count_stmt)).scalar_one())
        rows = await self._session.execute(
            base.order_by(rank.desc(), Organization.name.asc()).limit(limit).offset(offset)
        )
        items = [
            SearchRow(
                entity_id=row.id,
                rank=float(row.rank),
                name=row.name,
                slug=row.slug,
                city=row.city,
            )
            for row in rows.all()
        ]
        return items, total

    async def search_offers(
        self,
        *,
        query: str,
        city_lower: str,
        neighborhood_id: uuid.UUID | None,
        now: datetime,
        limit: int,
        offset: int,
    ) -> tuple[list[SearchRow], int]:
        tsq = self._tsquery(query)
        rank = self._rank(PartnerOffer.search_vector, query)
        filters = [
            Organization.verification_status == VerificationStatus.VERIFIED.value,
            Organization.visibility == OrganizationVisibility.PUBLIC.value,
            func.lower(Organization.city) == city_lower,
            PartnerOffer.status == PartnerOfferStatus.PUBLISHED.value,
            PartnerOffer.is_active.is_(True),
            (PartnerOffer.valid_from.is_(None)) | (PartnerOffer.valid_from <= now),
            (PartnerOffer.valid_until.is_(None)) | (PartnerOffer.valid_until >= now),
            PartnerOffer.search_vector.op("@@")(tsq),
        ]
        if neighborhood_id is not None:
            filters.append(PartnerOffer.neighborhood_id == neighborhood_id)
        base = (
            select(
                PartnerOffer.id,
                PartnerOffer.title,
                PartnerOffer.is_flash,
                Organization.city,
                rank.label("rank"),
            )
            .join(Organization, PartnerOffer.organization_id == Organization.id)
            .where(*filters)
        )
        count_stmt = select(func.count()).select_from(base.subquery())
        total = int((await self._session.execute(count_stmt)).scalar_one())
        rows = await self._session.execute(
            base.order_by(rank.desc(), PartnerOffer.valid_until.asc().nulls_last())
            .limit(limit)
            .offset(offset)
        )
        items = [
            SearchRow(
                entity_id=row.id,
                rank=float(row.rank),
                title=row.title,
                city=row.city,
                is_flash=row.is_flash,
            )
            for row in rows.all()
        ]
        return items, total

    async def search_tribes(
        self,
        *,
        query: str,
        city_lower: str,
        limit: int,
        offset: int,
    ) -> tuple[list[SearchRow], int]:
        tsq = self._tsquery(query)
        rank = self._rank(Tribe.search_vector, query)
        filters = [
            Tribe.visibility == TribeVisibility.PUBLIC.value,
            Tribe.archived_at.is_(None),
            self._city_match(Tribe.city, city_lower),
            Tribe.search_vector.op("@@")(tsq),
        ]
        base = select(
            Tribe.id,
            Tribe.name,
            Tribe.slug,
            Tribe.city,
            rank.label("rank"),
        ).where(*filters)
        count_stmt = select(func.count()).select_from(base.subquery())
        total = int((await self._session.execute(count_stmt)).scalar_one())
        rows = await self._session.execute(
            base.order_by(rank.desc(), Tribe.is_featured.desc(), Tribe.name.asc())
            .limit(limit)
            .offset(offset)
        )
        items = [
            SearchRow(
                entity_id=row.id,
                rank=float(row.rank),
                name=row.name,
                slug=row.slug,
                city=row.city,
            )
            for row in rows.all()
        ]
        return items, total

    async def search_profiles(
        self,
        *,
        query: str,
        city_lower: str,
        viewer_city_lower: str | None,
        limit: int,
        offset: int,
    ) -> tuple[list[SearchRow], int]:
        tsq = self._tsquery(query)
        rank = self._rank(UserProfile.search_vector, query)
        visibility_filter = UserProfile.visibility == ProfileVisibility.PUBLIC.value
        if viewer_city_lower:
            visibility_filter = or_(
                UserProfile.visibility == ProfileVisibility.PUBLIC.value,
                and_(
                    UserProfile.visibility == ProfileVisibility.CITY_ONLY.value,
                    func.lower(UserProfile.city) == viewer_city_lower,
                ),
            )
        filters = [
            User.is_active.is_(True),
            UserProfile.onboarding_completed.is_(True),
            func.lower(UserProfile.city) == city_lower,
            visibility_filter,
            UserProfile.search_vector.op("@@")(tsq),
        ]
        base = (
            select(
                UserProfile.user_id,
                UserProfile.username,
                UserProfile.display_name,
                UserProfile.city,
                rank.label("rank"),
            )
            .join(User, User.id == UserProfile.user_id)
            .where(*filters)
        )
        count_stmt = select(func.count()).select_from(base.subquery())
        total = int((await self._session.execute(count_stmt)).scalar_one())
        rows = await self._session.execute(
            base.order_by(rank.desc(), UserProfile.username.asc()).limit(limit).offset(offset)
        )
        items = [
            SearchRow(
                entity_id=row.user_id,
                rank=float(row.rank),
                username=row.username,
                name=row.display_name,
                city=row.city,
            )
            for row in rows.all()
        ]
        return items, total

    async def search_neighborhoods(
        self,
        *,
        query: str,
        city_lower: str,
        limit: int,
        offset: int,
    ) -> tuple[list[SearchRow], int]:
        tsq = self._tsquery(query)
        rank = self._rank(Neighborhood.search_vector, query)
        filters = [
            Neighborhood.is_active.is_(True),
            func.lower(Neighborhood.city) == city_lower,
            Neighborhood.search_vector.op("@@")(tsq),
        ]
        base = select(
            Neighborhood.id,
            Neighborhood.display_name,
            Neighborhood.slug,
            Neighborhood.city,
            rank.label("rank"),
        ).where(*filters)
        count_stmt = select(func.count()).select_from(base.subquery())
        total = int((await self._session.execute(count_stmt)).scalar_one())
        rows = await self._session.execute(
            base.order_by(
                rank.desc(),
                Neighborhood.is_featured.desc(),
                Neighborhood.display_name.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        items = [
            SearchRow(
                entity_id=row.id,
                rank=float(row.rank),
                name=row.display_name,
                slug=row.slug,
                city=row.city,
            )
            for row in rows.all()
        ]
        return items, total
