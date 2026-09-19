"""Politique de duree Local Video — source unique (VIDEO-04D).

Toute limite de duree servie a un client ou appliquee par le worker doit sortir
d'ici. La duplication d'une valeur ailleurs est exactement ce qui avait produit
la divergence 60/90 corrigee par VIDEO-04A-CONTRACT-FIX-01.

Modele de tier (arbitrage CTO VIDEO-04D-VERIFIED-CREATOR-TIER-03) :

    role RBAC `VERIFIED_CREATOR`  ->  verified  ->  180 s
    tout le reste                 ->  pilot     ->   90 s

Regles de surete, volontairement fermees :

- le tier se deduit EXCLUSIVEMENT de roles persistes cote serveur ; aucun champ
  fourni par le client n'entre dans ce calcul ;
- `User.is_verified` n'est PAS un signal de createur verifie : aucun parcours
  utilisateur ne le renseigne, il n'est ecrit que par le bootstrap admin ;
- `Organization.verification_status` et `LocalVideo.organization_id` ne sont PAS
  utilises : `organization_id` provient du payload client sans preuve
  d'appartenance (dette LOCAL-VIDEO-ORG-AUTHZ-P1) ;
- roles absents, inconnus, ou identite indeterminee -> pilot (90 s) ;
- le palier staff 300 s n'est PAS active (VIDEO-04D-STAFF-300-CAPACITY).
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from enum import StrEnum

from app.core.local_video_constants import (
    LOCAL_VIDEO_MAX_BYTES,
    LOCAL_VIDEO_MAX_DURATION_SECONDS,
    LOCAL_VIDEO_VERIFIED_MAX_DURATION_SECONDS,
)

#: Cle de role RBAC accordant le palier `verified`. Attribuee par le staff via
#: ADMIN-08B uniquement, sans aucune permission administrative associee.
VERIFIED_CREATOR_ROLE_KEY = "VERIFIED_CREATOR"


class LocalVideoDurationTier(StrEnum):
    PILOT = "pilot"
    VERIFIED = "verified"


#: Duree maximale par tier — l'unique table de correspondance du domaine.
TIER_MAX_DURATION_SECONDS: dict[LocalVideoDurationTier, int] = {
    LocalVideoDurationTier.PILOT: LOCAL_VIDEO_MAX_DURATION_SECONDS,
    LocalVideoDurationTier.VERIFIED: LOCAL_VIDEO_VERIFIED_MAX_DURATION_SECONDS,
}

TIER_LABELS: dict[LocalVideoDurationTier, str] = {
    LocalVideoDurationTier.PILOT: "Pilote citoyen",
    LocalVideoDurationTier.VERIFIED: "Créateur vérifié",
}


@dataclass(frozen=True)
class LocalVideoDurationPolicy:
    tier: LocalVideoDurationTier
    max_duration_seconds: int
    max_bytes: int
    label: str


def resolve_duration_tier(role_keys: Iterable[str] | None) -> LocalVideoDurationTier:
    """Tier effectif deduit des roles persistes. Retombee sure : `pilot`."""
    if not role_keys:
        return LocalVideoDurationTier.PILOT
    if VERIFIED_CREATOR_ROLE_KEY in set(role_keys):
        return LocalVideoDurationTier.VERIFIED
    return LocalVideoDurationTier.PILOT


def resolve_duration_policy(role_keys: Iterable[str] | None) -> LocalVideoDurationPolicy:
    """Politique complete servie au client et appliquee au traitement."""
    tier = resolve_duration_tier(role_keys)
    return LocalVideoDurationPolicy(
        tier=tier,
        max_duration_seconds=TIER_MAX_DURATION_SECONDS[tier],
        max_bytes=LOCAL_VIDEO_MAX_BYTES,
        label=TIER_LABELS[tier],
    )


def max_duration_for_roles(role_keys: Iterable[str] | None) -> int:
    """Raccourci pour le chemin de publication."""
    return resolve_duration_policy(role_keys).max_duration_seconds
