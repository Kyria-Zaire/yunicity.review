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

from collections.abc import Callable
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
        # Memes plafonds IP qu'en PILOT : quel que soit le mode, l'IP ne doit
        # jamais etre ce qui empeche une salle entiere de s'inscrire. En PUBLIC
        # les protections reelles sont Turnstile et le plafond global.
        ip_hourly_limit=settings.registration_public_ip_hourly_limit,
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


#: Ce qu'il faut absolument avoir pour ouvrir au public. L'absence de l'un
#: d'eux n'est jamais une raison de desactiver silencieusement une protection :
#: c'est une raison de refuser les inscriptions.
_PUBLIC_REQUIREMENTS: tuple[tuple[str, Callable[[Settings], bool]], ...] = (
    ("TURNSTILE_SITE_KEY", lambda s: bool(s.turnstile_site_key.strip())),
    ("TURNSTILE_SECRET_KEY", lambda s: bool(s.turnstile_secret_key.strip())),
    ("TURNSTILE_EXPECTED_HOSTNAME", lambda s: bool(s.turnstile_expected_hostname.strip())),
    ("RATE_LIMIT_KEY_PEPPER", lambda s: bool(s.rate_limit_key_pepper.strip())),
    ("REDIS_URL", lambda s: bool((s.redis_url or "").strip())),
)


def registration_config_problems(
    settings: Settings, policy: RegistrationPolicy | None = None
) -> list[str]:
    """Noms des reglages manquants qui interdisent d'ouvrir les inscriptions.

    Seuls des NOMS de variables sont rendus, jamais de valeur : la liste est
    destinee a un diagnostic d'exploitation et peut transiter par `/ready`.

    Ne s'applique qu'au mode PUBLIC. Un pilote encadre se surveille a la main et
    n'exige pas Turnstile ; exiger la meme configuration partout rendrait le
    developpement local impraticable sans rien ajouter a la securite.
    """
    resolved = policy or resolve_registration_policy(settings)
    if resolved.mode is not RegistrationMode.PUBLIC:
        return []
    return [nom for nom, present in _PUBLIC_REQUIREMENTS if not present(settings)]
