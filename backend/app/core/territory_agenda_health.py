"""Santé de l'agenda territorial — RF-03B.

Règle roadmap (FEATURE-ROADMAP-POST-RC §3, RF-03) : « Alerte admin si
`events_upcoming < 3` (cockpit + activity) », critère d'acceptation
« Cockpit `events_upcoming ≥ 3` ».

    0 événement à venir   -> critical  (agenda vide)
    1 ou 2                -> warning   (agenda insuffisant)
    3 ou plus             -> healthy   (aucune alerte bloquante)

Source unique et testable : toute surface annonçant l'état de l'agenda doit
passer par `territory_agenda_health`. Le seuil est une constante nommée, jamais
un littéral dispersé — c'est exactement la duplication qui avait produit la
divergence 60/90 corrigée par VIDEO-04A-CONTRACT-FIX-01.

Les libellés reprennent ceux de `territory_event_health.py` du commit historique
`dcd3a28`, lu comme SPÉCIFICATION uniquement (aucun merge, aucun cherry-pick).
Attention toutefois : ce fichier historique retenait un seuil « healthy » de 5,
qui correspond à un AUTRE critère RF-03 — « `GET /map/events` ≥ 5 events à venir
Reims », côté public. Le seuil de l'alerte admin est bien 3. Les deux vivront
côte à côte quand RF-03-READINESS-CODE arrivera ; ils ne doivent pas être
confondus.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

#: Nombre minimal d'événements à venir en deçà duquel l'agenda déclenche une alerte.
AGENDA_HEALTHY_MIN_EVENTS = 3


class AgendaHealthStatus(StrEnum):
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"


AGENDA_HEALTH_LABELS: dict[AgendaHealthStatus, str] = {
    AgendaHealthStatus.HEALTHY: "Agenda vivant",
    AgendaHealthStatus.WARNING: "Agenda faible",
    AgendaHealthStatus.CRITICAL: "Aucun événement à venir",
}


@dataclass(frozen=True)
class AgendaHealth:
    status: AgendaHealthStatus
    upcoming_count: int
    threshold: int
    label: str

    @property
    def is_alerting(self) -> bool:
        return self.status is not AgendaHealthStatus.HEALTHY


def territory_agenda_health(upcoming_count: int) -> AgendaHealth:
    """État de l'agenda à partir du nombre d'événements à venir publiés.

    Le comptage lui-même reste la responsabilité du dépôt cockpit
    (`_count_events_upcoming`), qui filtre déjà ville, annulation, modération
    APPROVED et `starts_at >= now` en UTC. Cette fonction ne fait que classer :
    aucune requête, aucun accès base, donc aucun risque de N+1.

    Un compte négatif — impossible en pratique, `Field(ge=0)` le garantit — est
    ramené à 0 plutôt que de produire un état incohérent.
    """
    count = max(upcoming_count, 0)
    if count >= AGENDA_HEALTHY_MIN_EVENTS:
        status = AgendaHealthStatus.HEALTHY
    elif count >= 1:
        status = AgendaHealthStatus.WARNING
    else:
        status = AgendaHealthStatus.CRITICAL

    return AgendaHealth(
        status=status,
        upcoming_count=count,
        threshold=AGENDA_HEALTHY_MIN_EVENTS,
        label=AGENDA_HEALTH_LABELS[status],
    )
