"""Passport V2 challenge catalog constants (PASSPORT-04A)."""

from __future__ import annotations

from enum import StrEnum
from typing import Any

PASSPORT_CHALLENGE_FAMILIES: frozenset[str] = frozenset(
    {"explorer", "citizen", "culture", "prestige"}
)
PASSPORT_CHALLENGE_RARITIES: frozenset[str] = frozenset(
    {"common", "rare", "epic", "legendary"}
)
PASSPORT_CHALLENGE_TYPES: frozenset[str] = frozenset(
    {"stamps", "redemptions", "events", "manual"}
)


class PassportChallengeFamily(StrEnum):
    EXPLORER = "explorer"
    CITIZEN = "citizen"
    CULTURE = "culture"
    PRESTIGE = "prestige"


class PassportChallengeRarity(StrEnum):
    COMMON = "common"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class PassportChallengeType(StrEnum):
    STAMPS = "stamps"
    REDEMPTIONS = "redemptions"
    EVENTS = "events"
    MANUAL = "manual"


class PassportChallengeCode(StrEnum):
    EXPLORER_CENTRE_VILLE = "explorer_centre_ville"
    SOUTIEN_LOCAL_HEBDO = "soutien_local_hebdo"
    SORTIES_REMOISES = "sorties_remoises"
    PREMIER_CERCLE = "premier_cercle"


MVP_PASSPORT_CHALLENGE_CODES: frozenset[str] = frozenset(
    member.value for member in PassportChallengeCode
)
MVP_ACTIVE_CHALLENGE_CODES: frozenset[str] = frozenset(
    {
        PassportChallengeCode.EXPLORER_CENTRE_VILLE.value,
        PassportChallengeCode.SOUTIEN_LOCAL_HEBDO.value,
        PassportChallengeCode.PREMIER_CERCLE.value,
    }
)
MVP_INACTIVE_CHALLENGE_CODES: frozenset[str] = frozenset(
    {PassportChallengeCode.SORTIES_REMOISES.value}
)

MVP_AUTO_STAMP_CHALLENGE_CODES: frozenset[str] = frozenset(
    {PassportChallengeCode.EXPLORER_CENTRE_VILLE.value}
)
MVP_AUTO_REDEMPTION_CHALLENGE_CODES: frozenset[str] = frozenset(
    {PassportChallengeCode.SOUTIEN_LOCAL_HEBDO.value}
)


class PassportChallengeProgressSourceType(StrEnum):
    PASSPORT_STAMP = "passport_stamp"
    PARTNER_OFFER_REDEMPTION = "partner_offer_redemption"


MVP_PASSPORT_CHALLENGE_SEED: tuple[dict[str, Any], ...] = (
    {
        "code": PassportChallengeCode.EXPLORER_CENTRE_VILLE.value,
        "name": "Explorateur du centre-ville",
        "description": (
            "Découvrez le cœur de Reims en collectant des tampons "
            "dans les commerces et lieux du centre-ville."
        ),
        "family": PassportChallengeFamily.EXPLORER.value,
        "rarity": PassportChallengeRarity.COMMON.value,
        "challenge_type": PassportChallengeType.STAMPS.value,
        "target_value": 5,
        "ym_reward": 10,
        "badge_code": "explorateur_reims",
        "is_active": True,
        "display_order": 10,
    },
    {
        "code": PassportChallengeCode.SOUTIEN_LOCAL_HEBDO.value,
        "name": "Soutien local",
        "description": (
            "Soutenez les partenaires locaux Yunicity en utilisant "
            "leurs offres sur une période donnée."
        ),
        "family": PassportChallengeFamily.CITIZEN.value,
        "rarity": PassportChallengeRarity.COMMON.value,
        "challenge_type": PassportChallengeType.REDEMPTIONS.value,
        "target_value": 3,
        "ym_reward": 15,
        "badge_code": "soutien_local",
        "is_active": True,
        "display_order": 20,
    },
    {
        "code": PassportChallengeCode.SORTIES_REMOISES.value,
        "name": "Sorties rémoises",
        "description": (
            "Participez à la vie culturelle rémoise en assistant "
            "à des événements locaux."
        ),
        "family": PassportChallengeFamily.CULTURE.value,
        "rarity": PassportChallengeRarity.RARE.value,
        "challenge_type": PassportChallengeType.EVENTS.value,
        "target_value": 3,
        "ym_reward": 20,
        "badge_code": "amateur_spectacles",
        "is_active": False,
        "display_order": 30,
    },
    {
        "code": PassportChallengeCode.PREMIER_CERCLE.value,
        "name": "Premier Cercle",
        "description": (
            "Rejoignez le cercle des pionniers Yunicity lors du lancement pilote."
        ),
        "family": PassportChallengeFamily.PRESTIGE.value,
        "rarity": PassportChallengeRarity.EPIC.value,
        "challenge_type": PassportChallengeType.MANUAL.value,
        "target_value": 1,
        "ym_reward": 25,
        "badge_code": "pionnier_yunicity",
        "is_active": True,
        "display_order": 40,
    },
)
