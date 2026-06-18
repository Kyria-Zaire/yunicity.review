"""Partner offer value categories — RF-02A real offer taxonomy."""

from __future__ import annotations

from enum import StrEnum

from app.core.passport_constants import PartnerOfferType


class PartnerOfferValueCategory(StrEnum):
    PERCENT_DISCOUNT = "percent_discount"
    FREE_ITEM = "free_item"
    LOYALTY_REWARD = "loyalty_reward"
    EXCLUSIVE_ACCESS = "exclusive_access"
    EVENT_BENEFIT = "event_benefit"
    WELCOME_BONUS = "welcome_bonus"


PARTNER_OFFER_VALUE_CATEGORY_LABELS: dict[PartnerOfferValueCategory, str] = {
    PartnerOfferValueCategory.PERCENT_DISCOUNT: "Réduction",
    PartnerOfferValueCategory.FREE_ITEM: "Produit offert",
    PartnerOfferValueCategory.LOYALTY_REWARD: "Récompense fidélité",
    PartnerOfferValueCategory.EXCLUSIVE_ACCESS: "Accès exclusif",
    PartnerOfferValueCategory.EVENT_BENEFIT: "Avantage événement",
    PartnerOfferValueCategory.WELCOME_BONUS: "Bonus bienvenue",
}

_DEFAULT_CATEGORY_BY_OFFER_TYPE: dict[PartnerOfferType, PartnerOfferValueCategory] = {
    PartnerOfferType.DISCOUNT: PartnerOfferValueCategory.PERCENT_DISCOUNT,
    PartnerOfferType.DRINK: PartnerOfferValueCategory.FREE_ITEM,
    PartnerOfferType.GIFT: PartnerOfferValueCategory.FREE_ITEM,
    PartnerOfferType.VIP: PartnerOfferValueCategory.EXCLUSIVE_ACCESS,
    PartnerOfferType.EVENT_ACCESS: PartnerOfferValueCategory.EVENT_BENEFIT,
    PartnerOfferType.CUSTOM: PartnerOfferValueCategory.EXCLUSIVE_ACCESS,
}


def partner_offer_value_category_label(category: PartnerOfferValueCategory | str) -> str:
    if isinstance(category, str):
        try:
            category = PartnerOfferValueCategory(category)
        except ValueError:
            return "Avantage"
    return PARTNER_OFFER_VALUE_CATEGORY_LABELS.get(category, "Avantage")


def infer_partner_offer_value_category(
    *,
    offer_type: PartnerOfferType | str,
    value_label: str | None = None,
    title: str | None = None,
    metadata: dict[str, object] | None = None,
) -> PartnerOfferValueCategory:
    if metadata:
        raw = metadata.get("value_category")
        if isinstance(raw, str):
            try:
                return PartnerOfferValueCategory(raw)
            except ValueError:
                pass

    normalized_type = (
        offer_type if isinstance(offer_type, PartnerOfferType) else PartnerOfferType(offer_type)
    )
    haystack = " ".join(
        part.strip().lower()
        for part in (value_label or "", title or "")
        if part and part.strip()
    )
    if any(token in haystack for token in ("bienvenue", "welcome", "première visite")):
        return PartnerOfferValueCategory.WELCOME_BONUS
    if any(token in haystack for token in ("fidélité", "fidelite", "loyalty")):
        return PartnerOfferValueCategory.LOYALTY_REWARD
    if "%" in haystack or "réduction" in haystack or "reduction" in haystack:
        return PartnerOfferValueCategory.PERCENT_DISCOUNT

    return _DEFAULT_CATEGORY_BY_OFFER_TYPE.get(
        normalized_type,
        PartnerOfferValueCategory.EXCLUSIVE_ACCESS,
    )
