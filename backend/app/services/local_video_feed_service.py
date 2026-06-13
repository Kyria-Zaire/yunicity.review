"""Local Video feed service (FEATURE-CREATORS-V2 / C2-S2-00)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.local_video_constants import (
    LOCAL_VIDEO_DEFAULT_CITY,
    LOCAL_VIDEO_FEED_DEFAULT_LIMIT,
    LOCAL_VIDEO_FEED_MAX_LIMIT,
    LocalVideoStatus,
    LocalVideoType,
)
from app.core.local_video_cursor import (
    decode_local_video_feed_cursor,
    encode_local_video_feed_cursor,
)
from app.models.local_video import LocalVideo
from app.repositories.local_video_like_repository import LocalVideoLikeRepository
from app.repositories.local_video_repository import LocalVideoRepository
from app.schemas.local_video import (
    LocalVideoFeedAuthor,
    LocalVideoFeedItem,
    LocalVideoFeedResponse,
)
from app.services.local_video.geo import haversine_meters, walking_minutes_from_meters


@dataclass(frozen=True)
class LocalVideoFeedQuery:
    city: str
    limit: int
    cursor: str | None
    latitude: float | None
    longitude: float | None
    viewer_user_id: uuid.UUID | None = None


class LocalVideoFeedService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = LocalVideoRepository(session)
        self._likes = LocalVideoLikeRepository(session)

    async def list_feed(self, query: LocalVideoFeedQuery) -> LocalVideoFeedResponse:
        city = query.city.strip() or LOCAL_VIDEO_DEFAULT_CITY
        limit = min(max(query.limit, 1), LOCAL_VIDEO_FEED_MAX_LIMIT)

        cursor_published_at = None
        cursor_id = None
        if query.cursor:
            cursor_published_at, cursor_id = decode_local_video_feed_cursor(query.cursor)

        rows = await self._repo.list_published_feed(
            city=city,
            limit=limit + 1,
            cursor_published_at=cursor_published_at,
            cursor_id=cursor_id,
        )

        has_more = len(rows) > limit
        page = rows[:limit]

        liked_ids: set[uuid.UUID] = set()
        if query.viewer_user_id is not None and page:
            liked_ids = await self._likes.list_liked_video_ids(
                query.viewer_user_id,
                [video.id for video in page],
            )

        items = [
            self._to_feed_item(
                video,
                latitude=query.latitude,
                longitude=query.longitude,
                liked_by_me=video.id in liked_ids,
            )
            for video in page
        ]

        next_cursor = None
        if has_more and page:
            last = page[-1]
            if last.published_at is not None:
                next_cursor = encode_local_video_feed_cursor(last.published_at, last.id)

        return LocalVideoFeedResponse(items=items, next_cursor=next_cursor, city=city)

    def _to_feed_item(
        self,
        video: LocalVideo,
        *,
        latitude: float | None,
        longitude: float | None,
        liked_by_me: bool = False,
    ) -> LocalVideoFeedItem:
        author = video.author
        profile = author.profile if author is not None else None
        neighborhood = video.neighborhood
        place = video.cultural_place

        distance_meters: int | None = None
        walk_minutes: int | None = None
        if latitude is not None and longitude is not None:
            target_lat, target_lon = self._resolve_coordinates(video)
            if target_lat is not None and target_lon is not None:
                meters = haversine_meters(latitude, longitude, target_lat, target_lon)
                distance_meters = int(round(meters))
                walk_minutes = walking_minutes_from_meters(meters)

        return LocalVideoFeedItem(
            id=video.id,
            author_user_id=video.author_user_id,
            author=LocalVideoFeedAuthor(
                id=video.author_user_id,
                username=profile.username if profile is not None else None,
                full_name=author.full_name,
                avatar_url=profile.avatar_url if profile is not None else None,
            ),
            city=video.city,
            neighborhood_id=video.neighborhood_id,
            neighborhood_name=neighborhood.display_name,
            neighborhood_slug=neighborhood.slug,
            video_type=LocalVideoType(video.video_type),
            title=video.title,
            description=video.description,
            cultural_place_id=video.cultural_place_id,
            cultural_place_slug=place.slug if place is not None else None,
            cultural_place_name=place.name if place is not None else None,
            local_event_id=video.local_event_id,
            tribe_id=video.tribe_id,
            organization_id=video.organization_id,
            media_url=video.media_url,
            thumbnail_url=video.thumbnail_url,
            duration_seconds=float(video.duration_seconds),
            mime_type=video.mime_type,
            latitude=float(video.latitude) if video.latitude is not None else None,
            longitude=float(video.longitude) if video.longitude is not None else None,
            status=LocalVideoStatus(video.status),
            published_at=video.published_at,
            created_at=video.created_at,
            distance_meters=distance_meters,
            walk_minutes=walk_minutes,
            like_count=video.like_count,
            comment_count=video.comment_count,
            liked_by_me=liked_by_me,
        )

    @staticmethod
    def _resolve_coordinates(video: LocalVideo) -> tuple[float | None, float | None]:
        if video.latitude is not None and video.longitude is not None:
            return float(video.latitude), float(video.longitude)
        neighborhood = video.neighborhood
        if neighborhood.latitude is not None and neighborhood.longitude is not None:
            return float(neighborhood.latitude), float(neighborhood.longitude)
        return None, None


def normalize_feed_limit(limit: int | None) -> int:
    if limit is None:
        return LOCAL_VIDEO_FEED_DEFAULT_LIMIT
    return min(max(limit, 1), LOCAL_VIDEO_FEED_MAX_LIMIT)
