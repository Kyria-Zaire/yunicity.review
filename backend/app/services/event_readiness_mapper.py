"""Map LocalEvent ORM rows to readiness API fields — RF-03A."""

from __future__ import annotations

from datetime import UTC, datetime

from app.core.event_readiness import EventReadinessInput, event_readiness
from app.models.local_event import LocalEvent
from app.schemas.event_readiness import EventReadinessCheckItem, EventReadinessFields


def build_event_readiness_fields(
    event: LocalEvent,
    *,
    now: datetime | None = None,
) -> EventReadinessFields:
    result = event_readiness(
        EventReadinessInput(
            title=event.title,
            description=event.description,
            starts_at=event.starts_at,
            ends_at=event.ends_at,
            location_name=event.location_name,
            address=event.address,
            visibility=event.visibility,
            moderation_status=event.moderation_status,
            is_cancelled=event.is_cancelled,
        ),
        now=now or datetime.now(UTC),
    )
    return EventReadinessFields(
        readiness=result.status.value,
        classification=result.classification.value,
        contributes_to_territory=result.contributes_to_territory,
        territory_contribution_label=result.territory_contribution_label,
        checks=[
            EventReadinessCheckItem(
                key=check.key,
                label=check.label,
                passed=check.passed,
                severity=check.severity,
            )
            for check in result.checks
        ],
    )
