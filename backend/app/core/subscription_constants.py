"""Citizen membership plans (WEB-SUBSCRIPTIONS-01) — catalog source of truth."""

from __future__ import annotations

from enum import StrEnum
from typing import TypedDict


class MembershipPlanCode(StrEnum):
    FREE = "free"
    PLUS = "plus"
    PREMIUM = "premium"


class MembershipBillingInterval(StrEnum):
    MONTHLY = "monthly"
    ANNUAL = "annual"


class MembershipStatus(StrEnum):
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"
    INCOMPLETE = "incomplete"


class PlanFeature(TypedDict):
    key: str
    label: str
    included: bool


class PlanDefinition(TypedDict):
    code: MembershipPlanCode
    name: str
    tagline: str
    monthly_price_cents: int
    annual_discount_percent: int
    display_order: int
    is_highlighted: bool
    features: list[PlanFeature]
    inherits_from: MembershipPlanCode | None


ANNUAL_DISCOUNT_PERCENT = 20

PLAN_DEFINITIONS: tuple[PlanDefinition, ...] = (
    {
        "code": MembershipPlanCode.FREE,
        "name": "Gratuit",
        "tagline": "Pour découvrir Yunicity",
        "monthly_price_cents": 0,
        "annual_discount_percent": 0,
        "display_order": 0,
        "is_highlighted": False,
        "inherits_from": None,
        "features": [
            {"key": "feed", "label": "Accès au fil local", "included": True},
            {"key": "neighborhoods", "label": "Explorer les quartiers & lieux", "included": True},
            {"key": "tribes", "label": "Rejoindre des tribus", "included": True},
            {"key": "discussions", "label": "Participer aux discussions", "included": True},
            {"key": "events", "label": "Événements publics", "included": True},
            {"key": "messages", "label": "Messages illimités", "included": False},
            {"key": "tonight", "label": "Voir qui sort ce soir", "included": False},
            {"key": "filters", "label": "Filtres & recherches avancées", "included": False},
            {"key": "badge", "label": "Badge exclusif", "included": False},
            {"key": "support", "label": "Soutenir la communauté", "included": False},
        ],
    },
    {
        "code": MembershipPlanCode.PLUS,
        "name": "Yunicity Plus",
        "tagline": "Pour vivre plus intensément",
        "monthly_price_cents": 599,
        "annual_discount_percent": ANNUAL_DISCOUNT_PERCENT,
        "display_order": 1,
        "is_highlighted": True,
        "inherits_from": MembershipPlanCode.FREE,
        "features": [
            {"key": "inherit_free", "label": "Tout dans l'offre gratuite", "included": True},
            {"key": "messages", "label": "Messages illimités", "included": True},
            {"key": "tonight", "label": "Voir qui sort ce soir", "included": True},
            {"key": "filters", "label": "Filtres & recherches avancées", "included": True},
            {"key": "early_access", "label": "Accès anticipé aux événements", "included": True},
            {"key": "badge", "label": "Badge exclusif", "included": True},
            {"key": "support", "label": "Vous soutenez la communauté", "included": True},
        ],
    },
    {
        "code": MembershipPlanCode.PREMIUM,
        "name": "Yunicity Premium",
        "tagline": "Pour les passionnés de leur ville",
        "monthly_price_cents": 999,
        "annual_discount_percent": ANNUAL_DISCOUNT_PERCENT,
        "display_order": 2,
        "is_highlighted": False,
        "inherits_from": MembershipPlanCode.PLUS,
        "features": [
            {"key": "inherit_plus", "label": "Tout dans Plus", "included": True},
            {"key": "recommendations", "label": "Recommandations personnalisées", "included": True},
            {"key": "vip", "label": "Accès VIP à certains événements", "included": True},
            {"key": "invites", "label": "Invitations exclusives", "included": True},
            {"key": "profile_boost", "label": "Mise en avant de votre profil", "included": True},
            {"key": "badge_premium", "label": "Badge Premium", "included": True},
            {"key": "support", "label": "Vous soutenez la communauté", "included": True},
        ],
    },
)

PAID_PLAN_CODES = frozenset({MembershipPlanCode.PLUS, MembershipPlanCode.PREMIUM})


def annual_price_cents(monthly_price_cents: int, discount_percent: int) -> int:
    yearly = monthly_price_cents * 12
    return int(yearly * (100 - discount_percent) / 100)


def monthly_equivalent_from_annual_cents(annual_cents: int) -> int:
    return int(annual_cents / 12)
