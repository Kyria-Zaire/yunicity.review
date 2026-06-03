"""Reims pilot partner offers seed (WEB-PARTNERS-08B) — idempotent."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.passport_constants import PartnerOfferStatus, PartnerOfferType
from app.models.organization import Organization
from app.models.passport import PartnerOffer

logger = logging.getLogger(__name__)

_PILOT_CONDITIONS = "Offre pilote, modalités confirmées sur place."

REIMS_PARTNER_OFFERS_SEED: tuple[dict[str, Any], ...] = (
    {
        "id": uuid.UUID("d6043000-0000-4000-8000-000000000001"),
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000009"),
        "org_slug": "belga-queen",
        "slug": "belga-queen-accueil-passport",
        "title": "Accueil Passport",
        "value_label": "Avantage membre",
        "description": (
            "Présentez votre Passport Yunicity pour découvrir les avantages "
            "proposés par ce partenaire."
        ),
        "conditions": _PILOT_CONDITIONS,
        "offer_type": PartnerOfferType.CUSTOM.value,
        "is_featured": True,
    },
    {
        "id": uuid.UUID("d6043000-0000-4000-8000-000000000002"),
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000011"),
        "org_slug": "pittaya",
        "slug": "pittaya-avantage-passport",
        "title": "Avantage Passport",
        "value_label": "Offre pilote",
        "description": (
            "Présentez votre Passport Yunicity pour découvrir les avantages "
            "proposés par ce partenaire."
        ),
        "conditions": _PILOT_CONDITIONS,
        "offer_type": PartnerOfferType.CUSTOM.value,
        "is_featured": True,
    },
    {
        "id": uuid.UUID("d6043000-0000-4000-8000-000000000003"),
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000012"),
        "org_slug": "centre-des-ressources",
        "slug": "centre-des-ressources-acces-decouverte",
        "title": "Accès découverte",
        "value_label": "Découverte",
        "description": (
            "Présentez votre Passport Yunicity pour découvrir les avantages "
            "proposés par ce partenaire."
        ),
        "conditions": _PILOT_CONDITIONS,
        "offer_type": PartnerOfferType.CUSTOM.value,
        "is_featured": False,
    },
    {
        "id": uuid.UUID("d6043000-0000-4000-8000-000000000004"),
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000014"),
        "org_slug": "garcon-barbiers",
        "slug": "garcon-barbiers-avantage-membre",
        "title": "Avantage membre Yunicity",
        "value_label": "Offre partenaire",
        "description": (
            "Présentez votre Passport Yunicity pour découvrir les avantages "
            "proposés par ce partenaire."
        ),
        "conditions": _PILOT_CONDITIONS,
        "offer_type": PartnerOfferType.CUSTOM.value,
        "is_featured": False,
    },
)

_SYNC_FIELDS = (
    "organization_id",
    "title",
    "slug",
    "description",
    "value_label",
    "conditions",
    "offer_type",
    "status",
    "is_active",
    "is_featured",
    "valid_from",
    "valid_until",
)


async def _resolve_organization_id(
    session: AsyncSession, entry: dict[str, Any]
) -> uuid.UUID | None:
    org = await session.get(Organization, entry["organization_id"])
    if org is not None:
        return org.id
    result = await session.execute(
        select(Organization).where(Organization.slug == entry["org_slug"])
    )
    found = result.scalar_one_or_none()
    return found.id if found is not None else None


def _build_offer(entry: dict[str, Any], *, organization_id: uuid.UUID) -> PartnerOffer:
    now = datetime.now(UTC)
    return PartnerOffer(
        id=entry["id"],
        organization_id=organization_id,
        title=entry["title"],
        slug=entry["slug"],
        description=entry["description"],
        value_label=entry["value_label"],
        conditions=entry["conditions"],
        offer_type=entry["offer_type"],
        status=PartnerOfferStatus.PUBLISHED.value,
        is_active=True,
        is_featured=entry["is_featured"],
        valid_from=now - timedelta(days=1),
        valid_until=now + timedelta(days=365),
    )


async def _upsert_offer(
    session: AsyncSession, entry: dict[str, Any], organization_id: uuid.UUID
) -> None:
    existing = await session.get(PartnerOffer, entry["id"])
    built = _build_offer(entry, organization_id=organization_id)
    if existing is not None:
        for field in _SYNC_FIELDS:
            setattr(existing, field, getattr(built, field))
        return
    by_slug = await session.execute(
        select(PartnerOffer).where(PartnerOffer.slug == entry["slug"])
    )
    found = by_slug.scalar_one_or_none()
    if found is not None:
        for field in _SYNC_FIELDS:
            setattr(found, field, getattr(built, field))
        return
    session.add(built)


async def seed_reims_partner_offers(session: AsyncSession) -> None:
    for entry in REIMS_PARTNER_OFFERS_SEED:
        organization_id = await _resolve_organization_id(session, entry)
        if organization_id is None:
            logger.warning(
                "partner_offer_seed_skip org_not_found slug=%s",
                entry["org_slug"],
            )
            continue
        await _upsert_offer(session, entry, organization_id)

    logger.info("reims_partner_offers_seed_completed count=%s", len(REIMS_PARTNER_OFFERS_SEED))
