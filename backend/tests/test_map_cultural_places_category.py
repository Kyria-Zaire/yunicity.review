"""Map cultural-places category[] filter tests (WEB-MAP-PORTAL-01)."""

from __future__ import annotations

from unittest.mock import AsyncMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.cultural_place_service import CulturalPlaceService
from app.services.map_event_service import MapBbox

_REIMS_BBOX = MapBbox(
    lat_min=49.24,
    lon_min=4.02,
    lat_max=49.27,
    lon_max=4.06,
)


@pytest.mark.unit
def test_normalize_categories_for_map_filter() -> None:
    assert CulturalPlaceService._normalize_categories(None) is None
    assert CulturalPlaceService._normalize_categories([]) is None
    assert CulturalPlaceService._normalize_categories(["  "]) is None
    assert CulturalPlaceService._normalize_categories([" Museum ", "PARK"]) == [
        "museum",
        "park",
    ]


@pytest.mark.unit
@pytest.mark.asyncio
async def test_list_map_places_forwards_normalized_categories_to_repository() -> None:
    session = AsyncMock(spec=AsyncSession)
    service = CulturalPlaceService(session)
    service._repo = AsyncMock()
    service._repo.list_in_bbox = AsyncMock(return_value=[])

    await service.list_map_places(
        bbox=_REIMS_BBOX,
        city="Reims",
        limit=50,
        categories=[" Museum ", "PARK"],
    )

    service._repo.list_in_bbox.assert_awaited_once()
    assert service._repo.list_in_bbox.await_args is not None
    assert service._repo.list_in_bbox.await_args.kwargs["categories"] == ["museum", "park"]


@pytest.mark.unit
@pytest.mark.asyncio
async def test_list_map_places_omits_categories_when_not_provided() -> None:
    session = AsyncMock(spec=AsyncSession)
    service = CulturalPlaceService(session)
    service._repo = AsyncMock()
    service._repo.list_in_bbox = AsyncMock(return_value=[])

    await service.list_map_places(bbox=_REIMS_BBOX, city="Reims", limit=50)

    assert service._repo.list_in_bbox.await_args is not None
    assert service._repo.list_in_bbox.await_args.kwargs["categories"] is None
