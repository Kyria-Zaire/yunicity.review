"""Verrou de caracterisation : hierarchie d'acces aux offres par tier passport.

`tier_can_access` (passport_level_rules) est la source UNIQUE partagee par les 4 call sites
d'offres : liste publique, liste passport, redeem bouton, redeem scan. Ces tests verrouillent
(1) la regle metier et (2) l'unicite de la source — aucune copie residuelle de la regle.

Test PUR, sans DB.
"""

from __future__ import annotations

import pytest
from app.core.passport_level_rules import tier_can_access
from app.services import (
    passport_service,
    public_partner_offer_service,
    scan_redemption_service,
)
from app.services.passport_service import PassportService
from app.services.public_partner_offer_service import PublicPartnerOfferService
from app.services.scan_redemption_service import ScanRedemptionService

BASIC, SILVER, GOLD = "basic", "silver", "gold"
NEO, PRESS, BUSINESS = "neo_arrivant", "press_creator", "business"
SPECIALS = [NEO, PRESS, BUSINESS]
ALL_TIERS = [BASIC, SILVER, GOLD, *SPECIALS]


class TestEngagementLadder:
    def test_gold_sees_silver_and_basic(self) -> None:
        assert tier_can_access(GOLD, GOLD) is True
        assert tier_can_access(SILVER, GOLD) is True
        assert tier_can_access(BASIC, GOLD) is True

    def test_silver_sees_basic_but_not_gold(self) -> None:
        assert tier_can_access(BASIC, SILVER) is True
        assert tier_can_access(GOLD, SILVER) is False

    def test_basic_sees_only_basic(self) -> None:
        assert tier_can_access(BASIC, BASIC) is True
        assert tier_can_access(SILVER, BASIC) is False
        assert tier_can_access(GOLD, BASIC) is False


class TestPublicOffers:
    @pytest.mark.parametrize("holder", ALL_TIERS)
    def test_none_required_is_visible_to_everyone(self, holder: str) -> None:
        assert tier_can_access(None, holder) is True


class TestSpecialTiersAreParallel:
    @pytest.mark.parametrize("special", SPECIALS)
    def test_special_holder_gets_exact_and_public_only(self, special: str) -> None:
        assert tier_can_access(special, special) is True  # exact
        assert tier_can_access(None, special) is True  # public
        # Aucun cumul vers l'echelle engagement.
        assert tier_can_access(BASIC, special) is False
        assert tier_can_access(SILVER, special) is False
        assert tier_can_access(GOLD, special) is False

    @pytest.mark.parametrize("special", SPECIALS)
    def test_engagement_holder_never_reaches_special_offers(self, special: str) -> None:
        # Meme gold (sommet de l'echelle) n'atteint pas une offre ciblee sur un tier special.
        assert tier_can_access(special, GOLD) is False
        assert tier_can_access(special, BASIC) is False

    def test_no_cross_leak_between_special_tiers(self) -> None:
        assert tier_can_access(NEO, PRESS) is False
        assert tier_can_access(BUSINESS, NEO) is False
        assert tier_can_access(PRESS, BUSINESS) is False


class TestSingleSourceOfTruth:
    """La regle vit a UN seul endroit : les 3 services referencent la meme fonction,
    et aucune copie locale (_offer_accessible / _tier_allows_offer) ne subsiste."""

    def test_all_three_services_reference_the_shared_rule(self) -> None:
        assert public_partner_offer_service.tier_can_access is tier_can_access
        assert passport_service.tier_can_access is tier_can_access
        assert scan_redemption_service.tier_can_access is tier_can_access

    def test_no_local_copy_of_the_rule_remains(self) -> None:
        assert not hasattr(PublicPartnerOfferService, "_tier_allows_offer")
        assert not hasattr(PassportService, "_offer_accessible")
        assert not hasattr(ScanRedemptionService, "_offer_accessible")
