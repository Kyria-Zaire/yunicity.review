"""Partner offer territorial readiness — RF-02A (no YM spend)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any, Literal

from app.core.organization_constants import OrganizationVisibility
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES, PartnerStatus
from app.core.partner_offer_value_categories import (
    PartnerOfferValueCategory,
    infer_partner_offer_value_category,
    partner_offer_value_category_label,
)
from app.core.passport_constants import PartnerOfferStatus, PartnerOfferType

PLACEHOLDER_DESCRIPTION_SNIPPET = "présentez votre passport yunicity pour découvrir"
PLACEHOLDER_CONDITIONS_SNIPPET = "offre pilote, modalités confirmées sur place"

VAGUE_VALUE_LABELS: frozenset[str] = frozenset(
    {
        "avantage membre",
        "offre pilote",
        "découverte",
        "offre partenaire",
        "avantage passport",
    }
)


class PartnerOfferReadinessStatus(StrEnum):
    READY = "ready"
    PARTIAL = "partial"
    NOT_READY = "not_ready"


CheckSeverity = Literal["ok", "warning", "error"]


@dataclass(frozen=True)
class PartnerOfferReadinessCheck:
    key: str
    label: str
    passed: bool
    severity: CheckSeverity


@dataclass(frozen=True)
class PartnerOfferReadinessResult:
    status: PartnerOfferReadinessStatus
    is_passport_eligible: bool
    is_placeholder: bool
    value_category: PartnerOfferValueCategory
    value_category_label: str
    checks: tuple[PartnerOfferReadinessCheck, ...]


@dataclass(frozen=True)
class PartnerOfferReadinessInput:
    title: str
    description: str | None
    value_label: str | None
    conditions: str | None
    offer_type: PartnerOfferType | str
    offer_status: PartnerOfferStatus | str
    is_active: bool
    valid_from: datetime | None
    valid_until: datetime | None
    partner_status: str | None
    org_visibility: str | None
    org_verified: bool
    metadata: dict[str, Any] | None = None


def _normalize_status(value: PartnerOfferStatus | str) -> PartnerOfferStatus:
    if isinstance(value, PartnerOfferStatus):
        return value
    return PartnerOfferStatus(value)


def _text(value: str | None) -> str:
    return (value or "").strip()


def is_partner_offer_placeholder(
    *,
    title: str,
    description: str | None,
    value_label: str | None,
    conditions: str | None,
) -> bool:
    description_lower = _text(description).lower()
    conditions_lower = _text(conditions).lower()
    value_lower = _text(value_label).lower()
    title_lower = _text(title).lower()

    if PLACEHOLDER_DESCRIPTION_SNIPPET in description_lower:
        return True
    if PLACEHOLDER_CONDITIONS_SNIPPET in conditions_lower:
        return True
    if value_lower in VAGUE_VALUE_LABELS and (
        PLACEHOLDER_DESCRIPTION_SNIPPET in description_lower
        or len(_text(description)) < 25
    ):
        return True
    if title_lower in {"accueil passport", "avantage passport", "avantage membre yunicity"}:
        return True
    return False


def _dates_valid(
    *,
    valid_from: datetime | None,
    valid_until: datetime | None,
    now: datetime,
) -> bool:
    if valid_from is not None and valid_from > now:
        return False
    if valid_until is not None and valid_until < now:
        return False
    return True


def _partner_is_active(partner_status: str | None) -> bool:
    if not partner_status:
        return False
    try:
        status = PartnerStatus(partner_status)
    except ValueError:
        return False
    return status in PUBLIC_PARTNER_STATUSES


def _benefit_defined(
    *,
    description: str | None,
    value_label: str | None,
    is_placeholder: bool,
) -> bool:
    if is_placeholder:
        return False
    value = _text(value_label)
    if len(value) >= 4 and value.lower() not in VAGUE_VALUE_LABELS:
        return True
    description_text = _text(description)
    return len(description_text) >= 20 and PLACEHOLDER_DESCRIPTION_SNIPPET not in (
        description_text.lower()
    )


def _conditions_defined(*, conditions: str | None, is_placeholder: bool) -> bool:
    if is_placeholder:
        return False
    text = _text(conditions)
    if len(text) < 10:
        return False
    return PLACEHOLDER_CONDITIONS_SNIPPET not in text.lower()


def partner_offer_human_description(
    *,
    title: str,
    value_label: str | None,
    description: str | None,
    conditions: str | None,
    value_category: PartnerOfferValueCategory | None = None,
    offer_type: PartnerOfferType | str | None = None,
    metadata: dict[str, Any] | None = None,
) -> str:
    category = value_category
    if category is None and offer_type is not None:
        category = infer_partner_offer_value_category(
            offer_type=offer_type,
            value_label=value_label,
            title=title,
            metadata=metadata,
        )
    benefit = _text(value_label) or _text(description) or _text(title)
    category_label = partner_offer_value_category_label(category) if category else "Avantage"
    base = f"{category_label} — {benefit}"
    cond = _text(conditions)
    if cond:
        return f"{base}. {cond}"
    return base


def partner_offer_readiness(
    data: PartnerOfferReadinessInput,
    *,
    now: datetime | None = None,
) -> PartnerOfferReadinessResult:
    moment = now or datetime.now(UTC)
    status = _normalize_status(data.offer_status)
    is_placeholder = is_partner_offer_placeholder(
        title=data.title,
        description=data.description,
        value_label=data.value_label,
        conditions=data.conditions,
    )
    value_category = infer_partner_offer_value_category(
        offer_type=data.offer_type,
        value_label=data.value_label,
        title=data.title,
        metadata=data.metadata,
    )

    title_ok = len(_text(data.title)) >= 3
    benefit_ok = _benefit_defined(
        description=data.description,
        value_label=data.value_label,
        is_placeholder=is_placeholder,
    )
    conditions_ok = _conditions_defined(
        conditions=data.conditions,
        is_placeholder=is_placeholder,
    )
    visibility_ok = status == PartnerOfferStatus.PUBLISHED and data.is_active
    partner_ok = _partner_is_active(data.partner_status)
    org_public = data.org_visibility == OrganizationVisibility.PUBLIC.value
    org_verified = data.org_verified
    dates_ok = _dates_valid(
        valid_from=data.valid_from,
        valid_until=data.valid_until,
        now=moment,
    )

    checks = (
        PartnerOfferReadinessCheck(
            key="title_defined",
            label="Titre défini",
            passed=title_ok,
            severity="ok" if title_ok else "error",
        ),
        PartnerOfferReadinessCheck(
            key="benefit_defined",
            label="Avantage défini",
            passed=benefit_ok,
            severity="ok" if benefit_ok else "error",
        ),
        PartnerOfferReadinessCheck(
            key="conditions_defined",
            label="Conditions définies",
            passed=conditions_ok,
            severity="ok" if conditions_ok else "warning",
        ),
        PartnerOfferReadinessCheck(
            key="visibility_enabled",
            label="Visibilité activée",
            passed=visibility_ok,
            severity="ok" if visibility_ok else "warning",
        ),
        PartnerOfferReadinessCheck(
            key="partner_active",
            label="Partenaire actif",
            passed=partner_ok and org_verified,
            severity="ok" if partner_ok and org_verified else "error",
        ),
        PartnerOfferReadinessCheck(
            key="dates_valid",
            label="Dates de validité",
            passed=dates_ok,
            severity="ok" if dates_ok else "warning",
        ),
        PartnerOfferReadinessCheck(
            key="not_placeholder",
            label="Contenu réel (non placeholder)",
            passed=not is_placeholder,
            severity="ok" if not is_placeholder else "error",
        ),
    )

    core_ready = (
        title_ok
        and benefit_ok
        and conditions_ok
        and not is_placeholder
        and partner_ok
        and org_verified
    )

    if core_ready and visibility_ok and dates_ok and org_public:
        readiness_status = PartnerOfferReadinessStatus.READY
    elif is_placeholder or not title_ok or not partner_ok:
        readiness_status = PartnerOfferReadinessStatus.NOT_READY
    elif core_ready or (title_ok and benefit_ok):
        readiness_status = PartnerOfferReadinessStatus.PARTIAL
    else:
        readiness_status = PartnerOfferReadinessStatus.NOT_READY

    is_passport_eligible = (
        readiness_status == PartnerOfferReadinessStatus.READY
        and visibility_ok
        and dates_ok
        and org_public
        and not is_placeholder
    )

    return PartnerOfferReadinessResult(
        status=readiness_status,
        is_passport_eligible=is_passport_eligible,
        is_placeholder=is_placeholder,
        value_category=value_category,
        value_category_label=partner_offer_value_category_label(value_category),
        checks=checks,
    )
