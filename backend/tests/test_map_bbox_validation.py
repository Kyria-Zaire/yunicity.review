"""Unit tests for map bbox validation (FEATURE-D / TICKET-D.3)."""

from __future__ import annotations

import pytest
from app.core.errors import AppError
from app.services.map_event_service import MapBbox, MapEventService

pytestmark = pytest.mark.unit


def test_validate_bbox_rejects_inverted_bounds() -> None:
    with pytest.raises(AppError) as exc_info:
        MapEventService._validate_bbox(
            MapBbox(lat_min=49.30, lon_min=3.9, lat_max=49.20, lon_max=4.1)
        )
    assert exc_info.value.code == "INVALID_BBOX"


def test_validate_bbox_rejects_oversized_area() -> None:
    with pytest.raises(AppError) as exc_info:
        MapEventService._validate_bbox(
            MapBbox(lat_min=49.0, lon_min=3.0, lat_max=50.0, lon_max=4.0)
        )
    assert exc_info.value.code == "BBOX_TOO_LARGE"
