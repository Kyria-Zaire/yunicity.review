"""Local event territorial readiness — RF-03A (no ticketing / YM spend)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum
from typing import Literal

from app.core.local_event_constants import (
    LocalEventModerationStatus,
    LocalEventVisibility,
)

PLACEHOLDER_DESCRIPTION_SNIPPET = (
    "un moment pilote proposé dans le cadre du réseau partenaire yunicity"
)
VAGUE_EVENT_TITLES: frozenset[str] = frozenset(
    {
        "afterwork découverte",
        "découverte culinaire",
        "atelier ressources locales",
        "conseils style & entretien",
        "événement local",
        "rencontre locale",
    }
)

CheckSeverity = Literal["ok", "warning", "error"]


class EventReadinessStatus(StrEnum):
    READY = "ready"
    PARTIAL = "partial"
    NOT_READY = "not_ready"


class EventContentClassification(StrEnum):
    """Audit taxonomy — REAL / PARTIAL / PLACEHOLDER."""

    REAL = "real"
    PARTIAL = "partial"
    PLACEHOLDER = "placeholder"


@dataclass(frozen=True)
class EventReadinessCheck:
    key: str
    label: str
    passed: bool
    severity: CheckSeverity


@dataclass(frozen=True)
class EventReadinessResult:
    status: EventReadinessStatus
    classification: EventContentClassification
    contributes_to_territory: bool
    territory_contribution_label: str
    checks: tuple[EventReadinessCheck, ...]


@dataclass(frozen=True)
class EventReadinessInput:
    title: str
    description: str | None
    starts_at: datetime
    ends_at: datetime | None
    location_name: str
    address: str | None
    visibility: str
    moderation_status: str
    is_cancelled: bool


def _text(value: str | None) -> str:
    return (value or "").strip()


def is_event_placeholder(
    *,
    title: str,
    description: str | None,
) -> bool:
    description_lower = _text(description).lower()
    title_lower = _text(title).lower()

    if PLACEHOLDER_DESCRIPTION_SNIPPET in description_lower:
        return True
    if title_lower in VAGUE_EVENT_TITLES and len(_text(description)) < 40:
        return True
    return False


def classify_event_content(
    *,
    title: str,
    description: str | None,
    location_name: str,
    is_placeholder: bool,
) -> EventContentClassification:
    if is_placeholder:
        return EventContentClassification.PLACEHOLDER
    title_ok = len(_text(title)) >= 3
    description_ok = len(_text(description)) >= 25
    location_ok = len(_text(location_name)) >= 2
    if title_ok and description_ok and location_ok:
        return EventContentClassification.REAL
    if title_ok or description_ok:
        return EventContentClassification.PARTIAL
    return EventContentClassification.PLACEHOLDER


def _description_defined(*, description: str | None, is_placeholder: bool) -> bool:
    if is_placeholder:
        return False
    text = _text(description)
    return len(text) >= 25 and PLACEHOLDER_DESCRIPTION_SNIPPET not in text.lower()


def _date_future(*, starts_at: datetime, now: datetime) -> bool:
    return starts_at >= now


def event_readiness(
    data: EventReadinessInput,
    *,
    now: datetime | None = None,
) -> EventReadinessResult:
    moment = now or datetime.now(UTC)
    is_placeholder = is_event_placeholder(title=data.title, description=data.description)
    classification = classify_event_content(
        title=data.title,
        description=data.description,
        location_name=data.location_name,
        is_placeholder=is_placeholder,
    )

    title_ok = len(_text(data.title)) >= 3
    description_ok = _description_defined(
        description=data.description,
        is_placeholder=is_placeholder,
    )
    date_ok = data.starts_at is not None
    date_future = _date_future(starts_at=data.starts_at, now=moment)
    location_ok = len(_text(data.location_name)) >= 2
    visibility_ok = data.visibility == LocalEventVisibility.PUBLIC.value
    publication_ok = (
        data.moderation_status == LocalEventModerationStatus.APPROVED.value
        and not data.is_cancelled
    )

    checks = (
        EventReadinessCheck(
            key="title_defined",
            label="Titre défini",
            passed=title_ok,
            severity="ok" if title_ok else "error",
        ),
        EventReadinessCheck(
            key="description_defined",
            label="Description définie",
            passed=description_ok,
            severity="ok" if description_ok else "error",
        ),
        EventReadinessCheck(
            key="date_defined",
            label="Date définie",
            passed=date_ok,
            severity="ok" if date_ok else "error",
        ),
        EventReadinessCheck(
            key="location_defined",
            label="Lieu défini",
            passed=location_ok,
            severity="ok" if location_ok else "error",
        ),
        EventReadinessCheck(
            key="visibility_enabled",
            label="Visibilité publique",
            passed=visibility_ok,
            severity="ok" if visibility_ok else "warning",
        ),
        EventReadinessCheck(
            key="publication_enabled",
            label="Publication activée",
            passed=publication_ok,
            severity="ok" if publication_ok else "warning",
        ),
        EventReadinessCheck(
            key="date_upcoming",
            label="Événement à venir",
            passed=date_future,
            severity="ok" if date_future else "warning",
        ),
        EventReadinessCheck(
            key="not_placeholder",
            label="Contenu réel (non placeholder)",
            passed=not is_placeholder,
            severity="ok" if not is_placeholder else "error",
        ),
    )

    core_ready = (
        title_ok
        and description_ok
        and location_ok
        and not is_placeholder
        and date_ok
    )

    if core_ready and publication_ok and visibility_ok and date_future:
        readiness_status = EventReadinessStatus.READY
    elif is_placeholder or not title_ok or data.is_cancelled:
        readiness_status = EventReadinessStatus.NOT_READY
    elif core_ready or (title_ok and location_ok):
        readiness_status = EventReadinessStatus.PARTIAL
    else:
        readiness_status = EventReadinessStatus.NOT_READY

    contributes = (
        readiness_status == EventReadinessStatus.READY
        and publication_ok
        and visibility_ok
        and date_future
        and not is_placeholder
    )
    if contributes:
        contribution_label = (
            "Cet événement contribue à maintenir l'agenda actif."
        )
    else:
        contribution_label = (
            "Cet événement est incomplet et n'améliore pas la vitalité du territoire."
        )

    return EventReadinessResult(
        status=readiness_status,
        classification=classification,
        contributes_to_territory=contributes,
        territory_contribution_label=contribution_label,
        checks=checks,
    )
