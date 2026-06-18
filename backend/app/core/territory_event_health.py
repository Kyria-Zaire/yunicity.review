"""Territory event health — RF-03A (real upcoming published counts only)."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

TERRITORY_EVENT_HEALTH_HEALTHY_MIN = 5
TERRITORY_EVENT_HEALTH_WARNING_MIN = 1


class TerritoryEventHealthStatus(StrEnum):
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass(frozen=True)
class TerritoryEventHealthResult:
    status: TerritoryEventHealthStatus
    upcoming_published_count: int
    label: str
    signal_emoji: str


def territory_event_health_label(status: TerritoryEventHealthStatus) -> str:
    if status == TerritoryEventHealthStatus.HEALTHY:
        return "Agenda vivant"
    if status == TerritoryEventHealthStatus.WARNING:
        return "Agenda faible"
    return "Aucun événement à venir"


def territory_event_health_signal_emoji(status: TerritoryEventHealthStatus) -> str:
    if status == TerritoryEventHealthStatus.HEALTHY:
        return "🟢"
    if status == TerritoryEventHealthStatus.WARNING:
        return "🟡"
    return "🔴"


def territory_event_health(
    upcoming_published_count: int,
) -> TerritoryEventHealthResult:
    """Derive territory vitality from real upcoming published events."""
    count = max(upcoming_published_count, 0)
    if count >= TERRITORY_EVENT_HEALTH_HEALTHY_MIN:
        status = TerritoryEventHealthStatus.HEALTHY
    elif count >= TERRITORY_EVENT_HEALTH_WARNING_MIN:
        status = TerritoryEventHealthStatus.WARNING
    else:
        status = TerritoryEventHealthStatus.CRITICAL

    return TerritoryEventHealthResult(
        status=status,
        upcoming_published_count=count,
        label=territory_event_health_label(status),
        signal_emoji=territory_event_health_signal_emoji(status),
    )
