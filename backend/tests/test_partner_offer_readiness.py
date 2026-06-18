"""Partner offer readiness unit tests — RF-02A."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from app.core.organization_constants import OrganizationVisibility
from app.core.partner_constants import PartnerStatus
from app.core.partner_offer_readiness import (
    PartnerOfferReadinessInput,
    PartnerOfferReadinessStatus,
    is_partner_offer_placeholder,
    partner_offer_readiness,
)
from app.core.passport_constants import PartnerOfferStatus, PartnerOfferType


def _base_input(**overrides: object) -> PartnerOfferReadinessInput:
    now = datetime.now(UTC)
    defaults = {
        "title": "Entrée offerte",
        "description": (
            "Découvrez la cuisine thaï avec une entrée offerte pour les porteurs Passport."
        ),
        "value_label": "Entrée au choix offerte",
        "conditions": "Sur présentation du Passport, une fois par personne.",
        "offer_type": PartnerOfferType.GIFT,
        "offer_status": PartnerOfferStatus.PUBLISHED,
        "is_active": True,
        "valid_from": now - timedelta(days=1),
        "valid_until": now + timedelta(days=30),
        "partner_status": PartnerStatus.ACTIVE.value,
        "org_visibility": OrganizationVisibility.PUBLIC.value,
        "org_verified": True,
        "metadata": None,
    }
    defaults.update(overrides)
    return PartnerOfferReadinessInput(**defaults)  # type: ignore[arg-type]


def test_complete_offer_is_ready() -> None:
    result = partner_offer_readiness(_base_input())
    assert result.status == PartnerOfferReadinessStatus.READY
    assert result.is_passport_eligible is True
    assert result.is_placeholder is False


def test_incomplete_offer_missing_conditions_is_partial() -> None:
    result = partner_offer_readiness(_base_input(conditions=None))
    assert result.status == PartnerOfferReadinessStatus.PARTIAL
    assert result.is_passport_eligible is False


def test_inactive_offer_is_not_ready() -> None:
    result = partner_offer_readiness(
        _base_input(
            offer_status=PartnerOfferStatus.DRAFT,
            is_active=False,
        )
    )
    assert result.status in {
        PartnerOfferReadinessStatus.PARTIAL,
        PartnerOfferReadinessStatus.NOT_READY,
    }
    assert result.is_passport_eligible is False


def test_offer_without_conditions_is_partial() -> None:
    result = partner_offer_readiness(_base_input(conditions=""))
    assert result.status == PartnerOfferReadinessStatus.PARTIAL
    assert any(check.key == "conditions_defined" and not check.passed for check in result.checks)


def test_placeholder_offer_is_not_ready() -> None:
    assert is_partner_offer_placeholder(
        title="Accueil Passport",
        description="Présentez votre Passport Yunicity pour découvrir les avantages proposés.",
        value_label="Avantage membre",
        conditions="Offre pilote, modalités confirmées sur place.",
    )
    result = partner_offer_readiness(
        _base_input(
            title="Accueil Passport",
            description="Présentez votre Passport Yunicity pour découvrir les avantages proposés.",
            value_label="Avantage membre",
            conditions="Offre pilote, modalités confirmées sur place.",
        )
    )
    assert result.status == PartnerOfferReadinessStatus.NOT_READY
    assert result.is_placeholder is True
    assert result.is_passport_eligible is False


def test_expired_dates_block_passport_eligibility() -> None:
    now = datetime.now(UTC)
    result = partner_offer_readiness(
        _base_input(valid_until=now - timedelta(days=1)),
        now=now,
    )
    assert result.is_passport_eligible is False
    assert any(check.key == "dates_valid" and not check.passed for check in result.checks)


@pytest.mark.parametrize(
    ("offer_type", "value_label", "expected_category"),
    [
        (PartnerOfferType.DISCOUNT, "-15 %", "percent_discount"),
        (PartnerOfferType.GIFT, "Entrée offerte", "free_item"),
        (PartnerOfferType.EVENT_ACCESS, "Atelier", "event_benefit"),
    ],
)
def test_value_category_inference(
    offer_type: PartnerOfferType,
    value_label: str,
    expected_category: str,
) -> None:
    result = partner_offer_readiness(_base_input(offer_type=offer_type, value_label=value_label))
    assert result.value_category.value == expected_category
