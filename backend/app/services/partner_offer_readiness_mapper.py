"""Map PartnerOffer ORM rows to readiness API fields — RF-02A."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.core.organization_constants import VerificationStatus
from app.core.partner_offer_readiness import (
    PartnerOfferReadinessInput,
    partner_offer_human_description,
    partner_offer_readiness,
)
from app.core.passport_constants import PartnerOfferType
from app.models.organization import Organization
from app.models.passport import PartnerOffer
from app.repositories.partner_repository import PartnerRepository
from app.schemas.partner_offer_readiness import (
    PartnerOfferReadinessCheckItem,
    PartnerOfferReadinessFields,
)


def build_partner_offer_readiness_fields(
    offer: PartnerOffer,
    *,
    org: Organization | None = None,
    now: datetime | None = None,
) -> PartnerOfferReadinessFields:
    organization = org or offer.organization
    partner_status: str | None = None
    org_visibility: str | None = None
    org_verified = False
    if organization is not None:
        org_visibility = organization.visibility
        org_verified = organization.verification_status == VerificationStatus.VERIFIED.value
        profile = organization.partner_profile
        if profile is not None:
            partner_status = (
                profile.partner_status.value
                if hasattr(profile.partner_status, "value")
                else str(profile.partner_status)
            )

    metadata: dict[str, Any] | None = None
    raw_metadata = getattr(offer, "metadata_", None)
    if isinstance(raw_metadata, dict):
        metadata = raw_metadata

    offer_type = (
        offer.offer_type
        if isinstance(offer.offer_type, PartnerOfferType)
        else PartnerOfferType(offer.offer_type)
    )

    result = partner_offer_readiness(
        PartnerOfferReadinessInput(
            title=offer.title,
            description=offer.description,
            value_label=offer.value_label,
            conditions=offer.conditions,
            offer_type=offer_type,
            offer_status=offer.status,
            is_active=offer.is_active,
            valid_from=offer.valid_from,
            valid_until=offer.valid_until,
            partner_status=partner_status,
            org_visibility=org_visibility,
            org_verified=org_verified
            or (
                organization is not None
                and PartnerRepository.is_verified_organization(organization)
            ),
            metadata=metadata,
        ),
        now=now or datetime.now(UTC),
    )

    human_description = partner_offer_human_description(
        title=offer.title,
        value_label=offer.value_label,
        description=offer.description,
        conditions=offer.conditions,
        value_category=result.value_category,
        offer_type=offer_type,
        metadata=metadata,
    )

    return PartnerOfferReadinessFields(
        readiness=result.status.value,
        is_passport_eligible=result.is_passport_eligible,
        is_placeholder=result.is_placeholder,
        value_category=result.value_category.value,
        value_category_label=result.value_category_label,
        human_description=human_description,
        checks=[
            PartnerOfferReadinessCheckItem(
                key=check.key,
                label=check.label,
                passed=check.passed,
                severity=check.severity,
            )
            for check in result.checks
        ],
    )
