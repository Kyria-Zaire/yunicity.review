"""Territory event health unit tests — RF-03A."""

from __future__ import annotations

import pytest
from app.core.territory_event_health import (
    TerritoryEventHealthStatus,
    territory_event_health,
    territory_event_health_label,
)


@pytest.mark.parametrize(
    ("count", "expected"),
    [
        (0, TerritoryEventHealthStatus.CRITICAL),
        (1, TerritoryEventHealthStatus.WARNING),
        (4, TerritoryEventHealthStatus.WARNING),
        (5, TerritoryEventHealthStatus.HEALTHY),
        (12, TerritoryEventHealthStatus.HEALTHY),
    ],
)
def test_territory_event_health_thresholds(
    count: int,
    expected: TerritoryEventHealthStatus,
) -> None:
    result = territory_event_health(count)
    assert result.status == expected
    assert result.upcoming_published_count == count
    assert result.label == territory_event_health_label(expected)


def test_negative_count_treated_as_zero() -> None:
    result = territory_event_health(-3)
    assert result.status == TerritoryEventHealthStatus.CRITICAL
    assert result.upcoming_published_count == 0
