"""Modes d'ouverture des inscriptions — AUTH-04A.

Une seule source de vérité, côté backend. Auparavant l'état se lisait dans trois
variables indépendantes (`REGISTRATION_ENABLED`, `REGISTRATION_RATE_LIMIT_PER_HOUR`
côté API, `NEXT_PUBLIC_REGISTRATION_ENABLED` côté WEB), qu'il fallait tenir
cohérentes à la main — ce qui a été fait à la main pour le pilote, et ce qui peut
donc être oublié.

Ici le mode décide, et les seuils en découlent. Le frontend ne déclare plus rien :
il lit `GET /auth/registration-status`.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum

from app.core.config import Settings


class RegistrationMode(StrEnum):
    CLOSED = "closed"
    PILOT = "pilot"
    PUBLIC = "public"


@dataclass(frozen=True)
class RegistrationPolicy:
    """Ce que le mode implique, résolu une fois puis lu partout."""

    mode: RegistrationMode
    open: bool
    #: Turnstile exigé : un jeton absent ou invalide refuse l'inscription.
    turnstile_required: bool
    #: Plafond par IP et par heure. Haut en PILOT : une salle entière partage une
    #: seule IP publique derrière le NAT de son établissement.
    ip_hourly_limit: int
    #: Plafond par IP sur une minute, contre l'automatisation en rafale.
    ip_burst_limit: int
    #: Plafond d'inscriptions abouties, toutes IP confondues. Seul garde-fou
    #: contre un robot réparti sur de nombreuses adresses.
    global_hourly_limit: int
    #: Fin d'ouverture annoncée, le cas échéant. Purement informative : la
    #: fermeture effective reste un changement de mode, jamais une horloge.
    closes_at: datetime | None


def resolve_registration_policy(settings: Settings) -> RegistrationPolicy:
    mode = _resolve_mode(settings)

    if mode is RegistrationMode.CLOSED:
        return RegistrationPolicy(
            mode=mode,
            open=False,
            turnstile_required=False,
            ip_hourly_limit=settings.registration_rate_limit_per_hour,
            ip_burst_limit=settings.registration_ip_burst_limit,
            global_hourly_limit=settings.registration_global_hourly_limit,
            closes_at=None,
        )

    if mode is RegistrationMode.PILOT:
        return RegistrationPolicy(
            mode=mode,
            open=True,
            # Configurable, mais jamais imposé : un pilote se surveille, et la
            # verification d'adresse reste obligatoire de toute facon.
            turnstile_required=settings.turnstile_required_in_pilot,
            ip_hourly_limit=settings.registration_pilot_ip_hourly_limit,
            ip_burst_limit=settings.registration_ip_burst_limit,
            global_hourly_limit=settings.registration_global_hourly_limit,
            closes_at=_aware(settings.registration_closes_at),
        )

    return RegistrationPolicy(
        mode=mode,
        open=True,
        turnstile_required=True,
        ip_hourly_limit=settings.registration_rate_limit_per_hour,
        ip_burst_limit=settings.registration_ip_burst_limit,
        global_hourly_limit=settings.registration_global_hourly_limit,
        closes_at=None,
    )


def _resolve_mode(settings: Settings) -> RegistrationMode:
    """Déduit le mode, en respectant l'ancienne variable le temps de la transition.

    `REGISTRATION_MODE` fait autorité dès qu'elle est déclarée. Tant qu'elle ne
    l'est pas, on retombe sur `REGISTRATION_ENABLED`, de sorte qu'un déploiement
    existant — dont le Preview actuellement ouvert — garde exactement son
    comportement en installant cette version.
    """
    declared = (settings.registration_mode or "").strip().lower()
    if declared:
        return RegistrationMode(declared)
    return RegistrationMode.PILOT if settings.registration_enabled else RegistrationMode.CLOSED


def _aware(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value if value.tzinfo else value.replace(tzinfo=UTC)
