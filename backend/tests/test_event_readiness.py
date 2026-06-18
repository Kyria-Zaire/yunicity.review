"""Local event readiness unit tests — RF-03A."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from app.core.event_readiness import (
    EventContentClassification,
    EventReadinessInput,
    EventReadinessStatus,
    event_readiness,
    is_event_placeholder,
)
from app.core.local_event_constants import (
    LocalEventModerationStatus,
    LocalEventVisibility,
)


def _base_input(**overrides: object) -> EventReadinessInput:
    now = datetime.now(UTC)
    defaults = {
        "title": "Concert jazz au Boulingrin",
        "description": (
            "Soirée jazz en plein air avec des musiciens locaux et une restauration "
            "sur place jusqu'à minuit."
        ),
        "starts_at": now + timedelta(days=7),
        "ends_at": now + timedelta(days=7, hours=3),
        "location_name": "Place du Boulingrin",
        "address": "Place du Boulingrin, Reims",
        "visibility": LocalEventVisibility.PUBLIC.value,
        "moderation_status": LocalEventModerationStatus.APPROVED.value,
        "is_cancelled": False,
    }
    defaults.update(overrides)
    return EventReadinessInput(**defaults)  # type: ignore[arg-type]


def test_complete_upcoming_event_is_ready() -> None:
    result = event_readiness(_base_input())
    assert result.status == EventReadinessStatus.READY
    assert result.classification == EventContentClassification.REAL
    assert result.contributes_to_territory is True
    assert "contribue" in result.territory_contribution_label.lower()


def test_incomplete_event_missing_description_is_partial() -> None:
    result = event_readiness(_base_input(description=None))
    assert result.status == EventReadinessStatus.PARTIAL
    assert result.contributes_to_territory is False


def test_past_event_is_partial_not_territory_contributor() -> None:
    now = datetime.now(UTC)
    result = event_readiness(
        _base_input(starts_at=now - timedelta(days=1)),
        now=now,
    )
    assert result.status in {
        EventReadinessStatus.PARTIAL,
        EventReadinessStatus.READY,
    }
    assert result.contributes_to_territory is False
    assert "n'améliore pas" in result.territory_contribution_label.lower()


def test_placeholder_pilot_event_is_not_ready() -> None:
    assert is_event_placeholder(
        title="Afterwork découverte",
        description="Un moment pilote proposé dans le cadre du réseau partenaire Yunicity.",
    )
    result = event_readiness(
        _base_input(
            title="Afterwork découverte",
            description="Un moment pilote proposé dans le cadre du réseau partenaire Yunicity.",
        )
    )
    assert result.status == EventReadinessStatus.NOT_READY
    assert result.classification == EventContentClassification.PLACEHOLDER
    assert result.contributes_to_territory is False


def test_pending_review_event_is_partial() -> None:
    result = event_readiness(
        _base_input(moderation_status=LocalEventModerationStatus.PENDING_REVIEW.value)
    )
    assert result.status == EventReadinessStatus.PARTIAL
    assert result.contributes_to_territory is False


def test_cancelled_event_is_not_ready() -> None:
    result = event_readiness(_base_input(is_cancelled=True))
    assert result.status == EventReadinessStatus.NOT_READY
    assert result.contributes_to_territory is False


@pytest.mark.parametrize(
    ("description", "expected"),
    [
        ("", EventContentClassification.PARTIAL),
        (
            "Un moment pilote proposé dans le cadre du réseau partenaire Yunicity.",
            EventContentClassification.PLACEHOLDER,
        ),
    ],
)
def test_classification_levels(description: str, expected: EventContentClassification) -> None:
    result = event_readiness(
        _base_input(
            title="Atelier",
            description=description,
            location_name="Centre-ville",
        )
    )
    assert result.classification == expected
