"""Modes d'ouverture des inscriptions — AUTH-04A, borné dans le temps par AUTH-04B.

Une seule source de vérité, côté backend. Auparavant l'état se lisait dans trois
variables indépendantes (`REGISTRATION_ENABLED`, `REGISTRATION_RATE_LIMIT_PER_HOUR`
côté API, `NEXT_PUBLIC_REGISTRATION_ENABLED` côté WEB), qu'il fallait tenir
cohérentes à la main — ce qui a été fait à la main pour le pilote, et ce qui peut
donc être oublié.

Ici le mode décide, et les seuils en découlent. Le frontend ne déclare plus rien :
il lit `GET /auth/registration-status`.

AUTH-04B ajoute la dimension manquante : le temps. `REGISTRATION_CLOSES_AT` était
annoncé au frontend sans jamais être comparé à l'heure — un pilote ouvert « pour
24 h » restait donc ouvert indéfiniment, et seule une intervention humaine le
refermait. La règle tient désormais en une ligne, évaluée à CHAQUE requête :

    open  ⇔  mode == PILOT  et  cutoff valide  et  now < cutoff

Aucun planificateur n'est introduit, et c'est délibéré : une tâche de fond peut
mourir, prendre du retard, ou ne pas exister sur une seconde instance. Une
comparaison faite sur le chemin de la requête, elle, ne peut pas être oubliée.
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
    #: Fin de la fenêtre PILOT, en UTC. CONTRAIGNANTE depuis AUTH-04B. Reste
    #: renseignée après l'échéance : le frontend peut alors dire « la fenêtre est
    #: terminée » plutôt que « indisponible », qui enverrait réessayer pour rien.
    #: `None` si le mode n'en porte pas, ou si la valeur est inexploitable.
    closes_at: datetime | None


def parse_registration_cutoff(raw: str) -> datetime | None:
    """Lit `REGISTRATION_CLOSES_AT` et rend un instant UTC, ou `None`.

    Rend `None` — donc ferme, en PILOT — dès que la valeur n'est pas une échéance
    exploitable : absente, illisible, ou **sans fuseau**. Ce dernier cas est le
    plus sournois : prêter UTC d'office à un horodatage naïf, comme le faisait
    l'implémentation précédente, décale silencieusement la fermeture d'une ou
    deux heures. Un instant ambigu n'ouvre rien ; il se corrige.

    Ne lève jamais : l'appelant est sur le chemin d'une requête, et une valeur
    mal saisie doit refermer les inscriptions, pas produire un 500.
    """
    value = (raw or "").strip()
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return None
    return parsed.astimezone(UTC)


def resolve_registration_policy(
    settings: Settings, *, now: datetime | None = None
) -> RegistrationPolicy:
    """Résout la politique pour un instant donné.

    `now` est injectable pour que les bornes se testent à la microseconde sans
    `sleep` ni monkeypatch d'horloge globale. Un seul instant sert à toute la
    résolution : deux lectures d'horloge dans la même décision pourraient tomber
    de part et d'autre de l'échéance.
    """
    mode = _resolve_mode(settings)
    instant = now if now is not None else datetime.now(UTC)
    if instant.tzinfo is None:
        # Comparer un instant naïf à un instant aware lève TypeError en Python.
        # Refuser ici donne un message utile, au lieu d'un 500 sur /register.
        raise ValueError("resolve_registration_policy: `now` doit être aware (UTC)")

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
        cutoff = parse_registration_cutoff(settings.registration_closes_at)
        return RegistrationPolicy(
            mode=mode,
            open=cutoff is not None and instant < cutoff,
            # Configurable, mais jamais imposé : un pilote se surveille, et la
            # verification d'adresse reste obligatoire de toute facon.
            turnstile_required=settings.turnstile_required_in_pilot,
            ip_hourly_limit=settings.registration_pilot_ip_hourly_limit,
            ip_burst_limit=settings.registration_ip_burst_limit,
            global_hourly_limit=settings.registration_global_hourly_limit,
            closes_at=cutoff,
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
        # Une ouverture publique ne s'arrête pas d'elle-même : ce serait une
        # panne programmée. Seul un pilote se borne dans le temps.
        closes_at=None,
    )


def _resolve_mode(settings: Settings) -> RegistrationMode:
    """Déduit le mode, en respectant l'ancienne variable le temps de la transition.

    `REGISTRATION_MODE` fait autorité dès qu'elle est déclarée. Tant qu'elle ne
    l'est pas, on retombe sur `REGISTRATION_ENABLED`.

    Ce repli mène à PILOT, donc — depuis AUTH-04B — il exige lui aussi une
    échéance valide. C'est volontaire : le booléen historique est exactement ce
    qui a servi à ouvrir le premier pilote, et le laisser ouvrir sans fin
    laisserait intacte la porte que ce ticket ferme.
    """
    declared = (settings.registration_mode or "").strip().lower()
    if declared:
        return RegistrationMode(declared)
    return RegistrationMode.PILOT if settings.registration_enabled else RegistrationMode.CLOSED


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

#: Ce qu'exige un PILOT, et rien de plus — les dépendances réelles du parcours.
#:
#: Turnstile en est volontairement absent : un pilote encadré se surveille à la
#: main, et l'exiger rendrait le développement local impraticable sans rien
#: ajouter à la sécurité. `EMAIL_PROVIDER` en est absent aussi, mais pour une
#: autre raison : `Settings` l'impose déjà en `prod` (voir sa validation), et le
#: redemander ici casserait les pilotes locaux qui tournent légitimement avec le
#: fournisseur `console`.
#:
#: Le cutoff figure ici parce qu'un pilote sans fin annoncée ne doit pas
#: s'ouvrir. Une échéance simplement DÉPASSÉE n'est pas un défaut de
#: configuration : elle est lisible, et la fenêtre est close — `/ready` reste
#: donc vert, et le frontend annonce une fin plutôt qu'une indisponibilité.
_PILOT_REQUIREMENTS: tuple[tuple[str, Callable[[Settings], bool]], ...] = (
    (
        "REGISTRATION_CLOSES_AT",
        lambda s: parse_registration_cutoff(s.registration_closes_at) is not None,
    ),
    ("RATE_LIMIT_KEY_PEPPER", lambda s: bool(s.rate_limit_key_pepper.strip())),
    ("REDIS_URL", lambda s: bool((s.redis_url or "").strip())),
)


def registration_config_problems(
    settings: Settings, policy: RegistrationPolicy | None = None
) -> list[str]:
    """Noms des reglages manquants qui interdisent d'ouvrir les inscriptions.

    Seuls des NOMS de variables sont rendus, jamais de valeur : la liste est
    destinee a un diagnostic d'exploitation et peut transiter par `/ready`. Un
    cutoff illisible est donc signalé par son nom, sans que son contenu brut
    n'apparaisse nulle part.

    S'applique à PUBLIC et, depuis AUTH-04B, à PILOT — avec des exigences
    distinctes : voir `_PILOT_REQUIREMENTS`. CLOSED n'exige rien, puisqu'il
    n'ouvre rien.
    """
    resolved = policy or resolve_registration_policy(settings)
    if resolved.mode is RegistrationMode.PUBLIC:
        exigences = _PUBLIC_REQUIREMENTS
    elif resolved.mode is RegistrationMode.PILOT:
        exigences = _PILOT_REQUIREMENTS
    else:
        return []
    return [nom for nom, present in exigences if not present(settings)]
