"""Classement territorial du feed vidéo — VIDEO-03.

Hiérarchie (FEATURE-ROADMAP-POST-RC §4) : quartier → ville → repli.

    Tier 1  NEIGHBORHOOD      la vidéo est dans le quartier du spectateur
    Tier 2  CITY              même ville, autre quartier
    Tier 3  TERRITORY_FALLBACK  le quartier du spectateur n'est pas établi

Deux décisions documentées, prises faute de source autoritaire plus précise :

1. `UserProfile` ne stocke aucun quartier — seulement une ville en texte libre.
   La roadmap dit « quartier préféré / géoloc » ; le préféré n'existant pas, le
   quartier du spectateur est résolu depuis les coordonnées déjà contractuelles
   de l'endpoint, contre les centroïdes des quartiers ACTIFS. Sans coordonnées,
   aucun quartier n'est deviné.

2. Aucun modèle « territoire » n'existe au-dessus de la ville, et la requête est
   déjà bornée à la ville : un tier 3 « autre territoire » serait inatteignable.
   Le tier 3 est donc le repli honnête — spectateur sans quartier établi. Il
   garantit qu'aucun motif « Parce que tu es à X » n'est émis à tort.

Les trois tiers partitionnent strictement le jeu de résultats : une vidéo
appartient à exactement un tier, ce qui rend l'ordre total et la pagination par
curseur stable.
"""

from __future__ import annotations

from enum import IntEnum, StrEnum

#: Rayon max entre les coordonnées du spectateur et le centroïde d'un quartier
#: pour considérer qu'il s'y trouve. La roadmap parle de « géoloc (~2 km) ».
#: Un quartier portant un `radius_meters` propre prime sur cette valeur.
FEED_NEIGHBORHOOD_MATCH_RADIUS_METERS = 2000


class LocalVideoFeedTier(IntEnum):
    """Ordre croissant = pertinence décroissante. Sérialisé dans le curseur."""

    NEIGHBORHOOD = 1
    CITY = 2
    TERRITORY_FALLBACK = 3


class LocalVideoFeedReason(StrEnum):
    """Code stable exposé par l'API. Ne jamais renommer sans version d'API."""

    NEIGHBORHOOD_MATCH = "neighborhood_match"
    SAME_CITY = "same_city"
    TERRITORY_FALLBACK = "territory_fallback"


TIER_REASONS: dict[LocalVideoFeedTier, LocalVideoFeedReason] = {
    LocalVideoFeedTier.NEIGHBORHOOD: LocalVideoFeedReason.NEIGHBORHOOD_MATCH,
    LocalVideoFeedTier.CITY: LocalVideoFeedReason.SAME_CITY,
    LocalVideoFeedTier.TERRITORY_FALLBACK: LocalVideoFeedReason.TERRITORY_FALLBACK,
}


def reason_for_tier(tier: LocalVideoFeedTier) -> LocalVideoFeedReason:
    return TIER_REASONS[tier]


def reason_label(
    reason: LocalVideoFeedReason,
    *,
    neighborhood_name: str | None,
    city: str,
) -> str:
    """Libellé lisible. « Parce que tu es à {quartier} » UNIQUEMENT si le
    quartier du spectateur est réellement établi — jamais déduit autrement."""
    if reason is LocalVideoFeedReason.NEIGHBORHOOD_MATCH and neighborhood_name:
        return f"Parce que tu es à {neighborhood_name}"
    if reason is LocalVideoFeedReason.SAME_CITY:
        return f"Autour de vous à {city}"
    return f"À découvrir à {city}"
