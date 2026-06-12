"""Passport V2 badge catalog constants (PASSPORT-03A/03B)."""

from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

# MVP pioneer cutoff — users registered on or before this instant qualify.
PASSPORT_PIONEER_CUTOFF = datetime(2026, 6, 1, 0, 0, 0, tzinfo=UTC)

EXPLORATEUR_REIMS_STAMP_THRESHOLD = 5
SOUTIEN_LOCAL_REDEMPTION_THRESHOLD = 3

PASSPORT_BADGE_FAMILIES: frozenset[str] = frozenset(
    {
        "explorer",
        "culture",
        "citizen",
        "prestige",
        "creator",
        "secret",
    }
)
PASSPORT_BADGE_VISIBILITIES: frozenset[str] = frozenset({"visible", "secret"})
PASSPORT_BADGE_RARITIES: frozenset[str] = frozenset(
    {"common", "rare", "epic", "legendary"}
)


class PassportBadgeFamily(StrEnum):
    EXPLORER = "explorer"
    CULTURE = "culture"
    CITIZEN = "citizen"
    PRESTIGE = "prestige"
    CREATOR = "creator"
    SECRET = "secret"


class PassportBadgeVisibility(StrEnum):
    VISIBLE = "visible"
    SECRET = "secret"


class PassportBadgeRarity(StrEnum):
    COMMON = "common"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class PassportBadgeSourceType(StrEnum):
    PASSPORT_STAMPS = "passport_stamps"
    PARTNER_OFFER_REDEMPTION = "partner_offer_redemption"
    USER_REGISTRATION = "user_registration"
    MANUAL = "manual"


class PassportBadgeCode(StrEnum):
    EXPLORATEUR_REIMS = "explorateur_reims"
    SOUTIEN_LOCAL = "soutien_local"
    AMATEUR_SPECTACLES = "amateur_spectacles"
    PIONNIER_YUNICITY = "pionnier_yunicity"
    FANTOME_DES_HALLES = "fantome_des_halles"
    TOUJOURS_PRESENT = "toujours_present"


MVP_PASSPORT_BADGE_CODES: frozenset[str] = frozenset(
    member.value for member in PassportBadgeCode
)
MVP_VISIBLE_BADGE_CODES: frozenset[str] = frozenset(
    {
        PassportBadgeCode.EXPLORATEUR_REIMS.value,
        PassportBadgeCode.SOUTIEN_LOCAL.value,
        PassportBadgeCode.AMATEUR_SPECTACLES.value,
        PassportBadgeCode.PIONNIER_YUNICITY.value,
    }
)
MVP_SECRET_BADGE_CODES: frozenset[str] = frozenset(
    {
        PassportBadgeCode.FANTOME_DES_HALLES.value,
        PassportBadgeCode.TOUJOURS_PRESENT.value,
    }
)

MVP_PASSPORT_BADGE_SEED: tuple[dict[str, Any], ...] = (
    {
        "code": PassportBadgeCode.EXPLORATEUR_REIMS.value,
        "name": "Explorateur de Reims",
        "description": (
            "Décerné aux habitants qui commencent à explorer Reims à travers "
            "ses commerces, quartiers et événements."
        ),
        "family": PassportBadgeFamily.EXPLORER.value,
        "visibility": PassportBadgeVisibility.VISIBLE.value,
        "rarity": PassportBadgeRarity.COMMON.value,
        "reputation_reward": 0,
        "ym_reward": 0,
        "display_order": 10,
    },
    {
        "code": PassportBadgeCode.SOUTIEN_LOCAL.value,
        "name": "Soutien local",
        "description": (
            "Décerné aux habitants qui soutiennent régulièrement "
            "les partenaires locaux Yunicity."
        ),
        "family": PassportBadgeFamily.CITIZEN.value,
        "visibility": PassportBadgeVisibility.VISIBLE.value,
        "rarity": PassportBadgeRarity.COMMON.value,
        "reputation_reward": 0,
        "ym_reward": 0,
        "display_order": 20,
    },
    {
        "code": PassportBadgeCode.AMATEUR_SPECTACLES.value,
        "name": "Amateur de spectacles",
        "description": (
            "Décerné aux habitants qui participent activement "
            "à la vie culturelle locale."
        ),
        "family": PassportBadgeFamily.CULTURE.value,
        "visibility": PassportBadgeVisibility.VISIBLE.value,
        "rarity": PassportBadgeRarity.RARE.value,
        "reputation_reward": 0,
        "ym_reward": 0,
        "display_order": 30,
    },
    {
        "code": PassportBadgeCode.PIONNIER_YUNICITY.value,
        "name": "Pionnier Yunicity",
        "description": (
            "Réservé aux premiers habitants ayant participé "
            "au lancement pilote de Yunicity."
        ),
        "family": PassportBadgeFamily.PRESTIGE.value,
        "visibility": PassportBadgeVisibility.VISIBLE.value,
        "rarity": PassportBadgeRarity.EPIC.value,
        "reputation_reward": 0,
        "ym_reward": 0,
        "display_order": 40,
    },
    {
        "code": PassportBadgeCode.FANTOME_DES_HALLES.value,
        "name": "Fantôme des Halles",
        "description": "Badge secret lié à une exploration particulière des Halles.",
        "family": PassportBadgeFamily.SECRET.value,
        "visibility": PassportBadgeVisibility.SECRET.value,
        "rarity": PassportBadgeRarity.RARE.value,
        "reputation_reward": 0,
        "ym_reward": 0,
        "display_order": 100,
    },
    {
        "code": PassportBadgeCode.TOUJOURS_PRESENT.value,
        "name": "Toujours Présent",
        "description": "Badge secret lié à une présence régulière dans la durée.",
        "family": PassportBadgeFamily.SECRET.value,
        "visibility": PassportBadgeVisibility.SECRET.value,
        "rarity": PassportBadgeRarity.EPIC.value,
        "reputation_reward": 0,
        "ym_reward": 0,
        "display_order": 110,
    },
)
