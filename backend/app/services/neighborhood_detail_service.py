"""Quartier vivant — unified neighborhood detail (FEATURE-QUARTIERS-V2 / Q2-S1-03)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import AppError
from app.core.local_event_constants import LocalEventModerationStatus
from app.core.neighborhood_v2_constants import (
    NEIGHBORHOOD_DETAIL_CONTRIBUTIONS_LIMIT,
    NEIGHBORHOOD_DETAIL_EVENTS_LIMIT,
    NEIGHBORHOOD_DETAIL_PASSPORT_OFFERS_LIMIT,
    NEIGHBORHOOD_DETAIL_PLACES_LIMIT,
    NEIGHBORHOOD_DETAIL_VIDEOS_LIMIT,
    NEIGHBORHOOD_OFFICIAL_LABEL_DEFAULT,
    NeighborhoodContributionStatus,
)
from app.core.passport_constants import PartnerOfferStatus
from app.models.cultural_place import CulturalPlace
from app.models.local_event import LocalEvent
from app.models.local_video import LocalVideo
from app.models.neighborhood import Neighborhood
from app.models.neighborhood_editorial import NeighborhoodContribution
from app.models.passport import PartnerOffer
from app.repositories.cultural_place_repository import CulturalPlaceRepository
from app.repositories.local_video_repository import LocalVideoRepository
from app.repositories.neighborhood_repository import NeighborhoodRepository
from app.schemas.neighborhood import (
    NeighborhoodDetailContributionItem,
    NeighborhoodDetailEventItem,
    NeighborhoodDetailHero,
    NeighborhoodDetailHistory,
    NeighborhoodDetailPassportOfferItem,
    NeighborhoodDetailPlaceItem,
    NeighborhoodDetailResponse,
    NeighborhoodDetailStats,
    NeighborhoodDetailVideoAuthor,
    NeighborhoodDetailVideoItem,
)
from app.services.neighborhood_v2_presenter import (
    map_alias_item,
    map_mood_slugs,
    to_neighborhood_response,
)

# Tribes / creators: no direct neighborhood FK on Tribe or creator profile (Q2-S1-03).
# Post-based tribe linkage is indirect; creator domain has no quartier scope yet.


class NeighborhoodDetailService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._neighborhoods = NeighborhoodRepository(session)
        self._videos = LocalVideoRepository(session)
        self._places = CulturalPlaceRepository(session)

    async def get_detail(self, *, city: str, slug: str) -> NeighborhoodDetailResponse:
        hood = await self._neighborhoods.get_by_city_slug_with_editorial(
            city=city,
            slug=slug,
            active_only=True,
        )
        if hood is None:
            raise AppError(
                status_code=404,
                code="NEIGHBORHOOD_NOT_FOUND",
                detail="Quartier introuvable.",
            )

        hood_id = hood.id
        now = datetime.now(UTC)

        base = to_neighborhood_response(hood, include_editorial=True)
        videos = await self._videos_for_neighborhood(hood)
        places = await self._places_for_neighborhood(hood_id)
        events = await self._upcoming_events(hood_id, now=now)
        contributions = await self._approved_contributions(hood_id)
        passport_offers = await self._passport_offers(hood_id)

        stats = NeighborhoodDetailStats(
            places_count=await self._count_places(hood_id),
            events_count=await self._count_events(hood_id, now=now),
            videos_count=await self._videos.count_published_for_neighborhood(hood_id),
            tribes_count=0,
            creators_count=0,
            contributions_count=await self._count_approved_contributions(hood_id),
        )

        return NeighborhoodDetailResponse(
            **base.model_dump(),
            hero=self._build_hero(hood),
            history=self._build_history(hood),
            videos=videos,
            places=places,
            events=events,
            tribes=[],
            creators=[],
            passport_offers=passport_offers,
            contributions=contributions,
            stats=stats,
        )

    @staticmethod
    def _build_hero(hood: Neighborhood) -> NeighborhoodDetailHero:
        aliases = [
            map_alias_item(item) for item in sorted(hood.aliases, key=lambda a: a.sort_order)
        ]
        moods = map_mood_slugs(list(hood.mood_assignments))
        return NeighborhoodDetailHero(
            id=hood.id,
            slug=hood.slug,
            display_name=hood.display_name,
            official_label=hood.official_label or NEIGHBORHOOD_OFFICIAL_LABEL_DEFAULT,
            aliases=aliases,
            moods=moods,
            featured_quote=hood.featured_quote,
            cover_image_url=hood.cover_image_url,
            hero_image_storage_key=hood.hero_image_storage_key,
        )

    @staticmethod
    def _build_history(hood: Neighborhood) -> NeighborhoodDetailHistory:
        return NeighborhoodDetailHistory(
            long_story=hood.long_story,
            featured_quote=hood.featured_quote,
        )

    async def _videos_for_neighborhood(
        self, hood: Neighborhood
    ) -> list[NeighborhoodDetailVideoItem]:
        rows = await self._videos.list_published_for_neighborhood(
            neighborhood_id=hood.id,
            limit=NEIGHBORHOOD_DETAIL_VIDEOS_LIMIT,
        )
        return [self._map_video_item(row, neighborhood_slug=hood.slug) for row in rows]

    @staticmethod
    def _map_video_item(
        video: LocalVideo, *, neighborhood_slug: str
    ) -> NeighborhoodDetailVideoItem:
        author = video.author
        profile = author.profile if author is not None else None
        return NeighborhoodDetailVideoItem(
            id=video.id,
            title=video.title,
            thumbnail_url=video.thumbnail_url,
            duration_seconds=float(video.duration_seconds),
            neighborhood_slug=neighborhood_slug,
            published_at=video.published_at,
            video_type=video.video_type,
            author=NeighborhoodDetailVideoAuthor(
                id=video.author_user_id,
                username=profile.username if profile is not None else None,
                full_name=author.full_name,
                avatar_url=profile.avatar_url if profile is not None else None,
            ),
        )

    async def _places_for_neighborhood(
        self, neighborhood_id: uuid.UUID
    ) -> list[NeighborhoodDetailPlaceItem]:
        rows = await self._places.list_for_neighborhood(
            neighborhood_id=neighborhood_id,
            active_only=True,
            limit=NEIGHBORHOOD_DETAIL_PLACES_LIMIT,
        )
        return [self._map_place_item(row) for row in rows]

    @staticmethod
    def _map_place_item(row: CulturalPlace) -> NeighborhoodDetailPlaceItem:
        image_url = row.image_url or row.thumbnail_image_url or row.hero_image_url
        return NeighborhoodDetailPlaceItem(
            id=row.id,
            slug=row.slug,
            name=row.name,
            category=row.category,
            image_url=image_url,
            is_partner=False,
        )

    async def _upcoming_events(
        self, neighborhood_id: uuid.UUID, *, now: datetime
    ) -> list[NeighborhoodDetailEventItem]:
        stmt = (
            select(LocalEvent)
            .where(
                LocalEvent.neighborhood_id == neighborhood_id,
                LocalEvent.moderation_status == LocalEventModerationStatus.APPROVED.value,
                LocalEvent.is_cancelled.is_(False),
                LocalEvent.starts_at >= now,
            )
            .order_by(LocalEvent.starts_at.asc())
            .limit(NEIGHBORHOOD_DETAIL_EVENTS_LIMIT)
        )
        result = await self._session.execute(stmt)
        return [
            NeighborhoodDetailEventItem(
                id=row.id,
                title=row.title,
                starts_at=row.starts_at,
                location_name=row.location_name,
                cover_image_url=row.cover_image_url,
            )
            for row in result.scalars().all()
        ]

    async def _approved_contributions(
        self, neighborhood_id: uuid.UUID
    ) -> list[NeighborhoodDetailContributionItem]:
        stmt = (
            select(NeighborhoodContribution)
            .where(
                NeighborhoodContribution.neighborhood_id == neighborhood_id,
                NeighborhoodContribution.status == NeighborhoodContributionStatus.APPROVED.value,
            )
            .order_by(NeighborhoodContribution.approved_at.desc().nullslast())
            .limit(NEIGHBORHOOD_DETAIL_CONTRIBUTIONS_LIMIT)
        )
        result = await self._session.execute(stmt)
        return [
            NeighborhoodDetailContributionItem(
                id=row.id,
                title=row.title,
                body=row.body,
                author_label=row.display_identity_label,
                passport_verified_snapshot=row.passport_verified_snapshot,
                approved_at=row.approved_at,
                created_at=row.created_at,
            )
            for row in result.scalars().all()
        ]

    async def _passport_offers(
        self, neighborhood_id: uuid.UUID
    ) -> list[NeighborhoodDetailPassportOfferItem]:
        stmt = (
            select(PartnerOffer)
            .where(
                PartnerOffer.neighborhood_id == neighborhood_id,
                PartnerOffer.status == PartnerOfferStatus.PUBLISHED.value,
                PartnerOffer.is_active.is_(True),
            )
            .options(selectinload(PartnerOffer.organization))
            .order_by(PartnerOffer.updated_at.desc())
            .limit(NEIGHBORHOOD_DETAIL_PASSPORT_OFFERS_LIMIT)
        )
        result = await self._session.execute(stmt)
        return [
            NeighborhoodDetailPassportOfferItem(
                id=row.id,
                title=row.title,
                organization_name=row.organization.name,
            )
            for row in result.scalars().all()
        ]

    async def _count_places(self, neighborhood_id: uuid.UUID) -> int:
        return await self._places.count_for_neighborhood(
            neighborhood_id=neighborhood_id,
            active_only=True,
        )

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

    async def _count_approved_contributions(self, neighborhood_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(NeighborhoodContribution)
            .where(
                NeighborhoodContribution.neighborhood_id == neighborhood_id,
                NeighborhoodContribution.status == NeighborhoodContributionStatus.APPROVED.value,
            )
        )
        return int((await self._session.execute(stmt)).scalar_one())
