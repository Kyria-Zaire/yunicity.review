"""Local search orchestration (FEATURE-B / TICKET-B.4)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Literal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.search_constants import (
    SEARCH_ALL_TYPE_ORDER,
    SEARCH_LIMIT_MAX,
    SEARCH_MULTI_TYPE_PER_GROUP_CAP,
    SEARCH_RANKING_EXPLANATION,
    SearchEntityType,
    SearchPeriod,
)
from app.core.search_query import normalize_city, normalize_search_query
from app.models.user import User
from app.repositories.search_repository import SearchRepository, SearchRow
from app.schemas.search import (
    SearchGroups,
    SearchResponse,
    SearchResultGroup,
    SearchResultItem,
)

_GROUP_KEY_BY_TYPE: dict[SearchEntityType, str] = {
    SearchEntityType.EVENT: "events",
    SearchEntityType.ORGANIZATION: "organizations",
    SearchEntityType.POST: "posts",
    SearchEntityType.OFFER: "offers",
    SearchEntityType.TRIBE: "tribes",
    SearchEntityType.USER: "users",
    SearchEntityType.NEIGHBORHOOD: "neighborhoods",
}


class SearchService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._search = SearchRepository(session)

    async def search(
        self,
        *,
        raw_query: str,
        city: str | None,
        neighborhood_slug: str | None,
        entity_type: SearchEntityType | Literal["all"],
        period: SearchPeriod,
        page: int,
        limit: int,
        viewer: User | None,
    ) -> SearchResponse:
        query = normalize_search_query(raw_query)
        resolved_city = self._resolve_city(city=city, viewer=viewer)
        city_lower = normalize_city(resolved_city).lower()
        neighborhood_id = await self._search.resolve_neighborhood_id(
            city_lower=city_lower,
            neighborhood_slug=neighborhood_slug,
        )

        page = max(page, 1)
        limit = min(max(limit, 1), SEARCH_LIMIT_MAX)
        now = datetime.now(UTC)
        viewer_city_lower = (viewer.city or "").strip().lower() if viewer else None
        if viewer_city_lower == "":
            viewer_city_lower = None

        if entity_type == "all":
            per_type_limit = min(limit, SEARCH_MULTI_TYPE_PER_GROUP_CAP)
            groups, has_more = await self._search_all(
                query=query,
                city_lower=city_lower,
                neighborhood_id=neighborhood_id,
                period=period,
                now=now,
                viewer_city_lower=viewer_city_lower,
                limit_per_type=per_type_limit,
            )
            return SearchResponse(
                query=query,
                city=resolved_city,
                neighborhood_slug=neighborhood_slug,
                type_filter="all",
                ranking_explanation=SEARCH_RANKING_EXPLANATION,
                groups=groups,
                page=1,
                page_size=per_type_limit,
                has_more=has_more,
            )

        search_type = SearchEntityType(entity_type)
        offset = (page - 1) * limit
        groups, total = await self._search_single_type(
            search_type=search_type,
            query=query,
            city_lower=city_lower,
            neighborhood_id=neighborhood_id,
            period=period,
            now=now,
            viewer_city_lower=viewer_city_lower,
            limit=limit,
            offset=offset,
        )
        has_more = (offset + _group_item_count(groups, search_type)) < total
        return SearchResponse(
            query=query,
            city=resolved_city,
            neighborhood_slug=neighborhood_slug,
            type_filter=search_type,
            ranking_explanation=SEARCH_RANKING_EXPLANATION,
            groups=groups,
            page=page,
            page_size=limit,
            has_more=has_more,
        )

    def _resolve_city(self, *, city: str | None, viewer: User | None) -> str:
        if city and city.strip():
            return normalize_city(city)
        if viewer and viewer.city and viewer.city.strip():
            return normalize_city(viewer.city)
        raise AppError(
            status_code=400,
            code="CITY_REQUIRED",
            detail="Indiquez une ville pour rechercher.",
        )

    async def _search_all(
        self,
        *,
        query: str,
        city_lower: str,
        neighborhood_id: uuid.UUID | None,
        period: SearchPeriod,
        now: datetime,
        viewer_city_lower: str | None,
        limit_per_type: int,
    ) -> tuple[SearchGroups, bool]:
        group_data: dict[str, SearchResultGroup] = {
            key: SearchResultGroup(items=[], count=0, has_more=False)
            for key in _GROUP_KEY_BY_TYPE.values()
        }
        has_more = False
        # Serialize the per-type branches: they all share this service's single
        # AsyncSession, which is NOT safe for concurrent use. Running them with
        # asyncio.gather raised sqlalchemy IllegalStateChangeError (C3-F0-T2).
        # Order, per-type limits, ranking and merge are unchanged.
        for search_type in SEARCH_ALL_TYPE_ORDER:
            items, total = await self._fetch_type(
                search_type=search_type,
                query=query,
                city_lower=city_lower,
                neighborhood_id=neighborhood_id,
                period=period,
                now=now,
                viewer_city_lower=viewer_city_lower,
                limit=limit_per_type,
                offset=0,
            )
            key = _GROUP_KEY_BY_TYPE[search_type]
            group_has_more = total > limit_per_type
            if group_has_more:
                has_more = True
            group_data[key] = SearchResultGroup(
                items=items,
                count=total,
                has_more=group_has_more,
            )
        return _build_groups(group_data), has_more

    async def _search_single_type(
        self,
        *,
        search_type: SearchEntityType,
        query: str,
        city_lower: str,
        neighborhood_id: uuid.UUID | None,
        period: SearchPeriod,
        now: datetime,
        viewer_city_lower: str | None,
        limit: int,
        offset: int,
    ) -> tuple[SearchGroups, int]:
        items, total = await self._fetch_type(
            search_type=search_type,
            query=query,
            city_lower=city_lower,
            neighborhood_id=neighborhood_id,
            period=period,
            now=now,
            viewer_city_lower=viewer_city_lower,
            limit=limit,
            offset=offset,
        )
        group_data: dict[str, SearchResultGroup] = {
            key: SearchResultGroup(items=[], count=0, has_more=False)
            for key in _GROUP_KEY_BY_TYPE.values()
        }
        key = _GROUP_KEY_BY_TYPE[search_type]
        group_data[key] = SearchResultGroup(
            items=items,
            count=total,
            has_more=(offset + len(items)) < total,
        )
        return _build_groups(group_data), total

    async def _fetch_type(
        self,
        *,
        search_type: SearchEntityType,
        query: str,
        city_lower: str,
        neighborhood_id: uuid.UUID | None,
        period: SearchPeriod,
        now: datetime,
        viewer_city_lower: str | None,
        limit: int,
        offset: int,
    ) -> tuple[list[SearchResultItem], int]:
        if search_type == SearchEntityType.POST:
            rows, total = await self._search.search_posts(
                query=query,
                city_lower=city_lower,
                neighborhood_id=neighborhood_id,
                limit=limit,
                offset=offset,
            )
        elif search_type == SearchEntityType.EVENT:
            rows, total = await self._search.search_events(
                query=query,
                city_lower=city_lower,
                neighborhood_id=neighborhood_id,
                period=period,
                now=now,
                limit=limit,
                offset=offset,
            )
        elif search_type == SearchEntityType.ORGANIZATION:
            rows, total = await self._search.search_organizations(
                query=query,
                city_lower=city_lower,
                neighborhood_id=neighborhood_id,
                limit=limit,
                offset=offset,
            )
        elif search_type == SearchEntityType.OFFER:
            rows, total = await self._search.search_offers(
                query=query,
                city_lower=city_lower,
                neighborhood_id=neighborhood_id,
                now=now,
                limit=limit,
                offset=offset,
            )
        elif search_type == SearchEntityType.TRIBE:
            rows, total = await self._search.search_tribes(
                query=query,
                city_lower=city_lower,
                limit=limit,
                offset=offset,
            )
        elif search_type == SearchEntityType.USER:
            rows, total = await self._search.search_profiles(
                query=query,
                city_lower=city_lower,
                viewer_city_lower=viewer_city_lower,
                limit=limit,
                offset=offset,
            )
        elif search_type == SearchEntityType.NEIGHBORHOOD:
            rows, total = await self._search.search_neighborhoods(
                query=query,
                city_lower=city_lower,
                limit=limit,
                offset=offset,
            )
        else:
            raise AppError(
                status_code=400,
                code="INVALID_SEARCH_TYPE",
                detail="Type de recherche inconnu.",
            )
        return [_row_to_item(row) for row in rows], total


def _row_to_item(row: SearchRow) -> SearchResultItem:
    return SearchResultItem(
        id=row.entity_id,
        rank=row.rank,
        title=row.title,
        name=row.name,
        slug=row.slug,
        city=row.city,
        body=row.body,
        username=row.username,
        starts_at=row.starts_at,
        is_flash=row.is_flash,
    )


def _build_groups(group_data: dict[str, SearchResultGroup]) -> SearchGroups:
    return SearchGroups(
        events=group_data["events"],
        organizations=group_data["organizations"],
        posts=group_data["posts"],
        offers=group_data["offers"],
        tribes=group_data["tribes"],
        users=group_data["users"],
        neighborhoods=group_data["neighborhoods"],
    )


def _group_item_count(groups: SearchGroups, search_type: SearchEntityType) -> int:
    key = _GROUP_KEY_BY_TYPE[search_type]
    group = getattr(groups, key)
    return len(group.items)
