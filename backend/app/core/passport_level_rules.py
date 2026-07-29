"""Passport level & reputation rules — TICKET-502 (MVP, no XP grinding)."""

from __future__ import annotations

from app.core.passport_constants import PassportTierCode

# Reputation weights — reward real local participation only.
REPUTATION_PER_REDEMPTION = 10
REPUTATION_PER_STAMP = 5
REPUTATION_PER_POST = 5
REPUTATION_VERIFIED_ACCOUNT = 5
REPUTATION_TENURE_DAYS = 7
REPUTATION_TENURE_BONUS = 5

SILVER_REPUTATION_THRESHOLD = 25
GOLD_REPUTATION_THRESHOLD = 70

NEWCOMER_ACCOUNT_MAX_AGE_DAYS = 14

ENGAGEMENT_TIER_CODES: tuple[PassportTierCode, ...] = (
    PassportTierCode.BASIC,
    PassportTierCode.SILVER,
    PassportTierCode.GOLD,
)

SPECIAL_TIER_CODES: frozenset[PassportTierCode] = frozenset(
    {
        PassportTierCode.NEO_ARRIVANT,
        PassportTierCode.PRESS_CREATOR,
        PassportTierCode.BUSINESS,
    }
)

PASSPORT_LEVEL_FEED_ANNOUNCEMENTS = False


def tier_can_access(required: str | None, holder: str) -> bool:
    """Le detenteur du tier `holder` peut-il acceder a une offre exigeant `required` ?

    Regle UNIQUE partagee par tous les points de filtrage/redeem d'offres (liste publique,
    liste passport, redeem bouton, redeem scan) — source de verite anti-re-divergence.

    - `required is None`   -> offre publique, toujours accessible.
    - `required == holder`  -> exact, toujours accessible (comportement historique).
    - Echelle engagement (basic < silver < gold) : acces CUMULATIF vers le bas (gold voit
      silver + basic). Compare la position dans ENGAGEMENT_TIER_CODES.
    - Tiers speciaux (neo_arrivant / press_creator / business) : audiences PARALLELES,
      aucun cumul ni vers ni depuis l'echelle -> exact + public seulement. Une offre
      reellement universelle doit porter `tier_code_required = None`, pas `basic`.
    """
    if required is None:
        return True
    if required == holder:
        return True
    ladder = [tier.value for tier in ENGAGEMENT_TIER_CODES]
    if required in ladder and holder in ladder:
        return ladder.index(holder) >= ladder.index(required)
    return False


def engagement_tier_for_score(reputation_score: int) -> PassportTierCode:
    """Highest engagement tier earned by reputation (basic/silver/gold)."""
    if reputation_score >= GOLD_REPUTATION_THRESHOLD:
        return PassportTierCode.GOLD
    if reputation_score >= SILVER_REPUTATION_THRESHOLD:
        return PassportTierCode.SILVER
    return PassportTierCode.BASIC
