"""Reims pilot partner offers seed (WEB-PARTNERS-08B / RF-02A) — idempotent."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.passport_constants import PartnerOfferStatus, PartnerOfferType, PassportTierCode
from app.models.organization import Organization
from app.models.passport import PartnerOffer

logger = logging.getLogger(__name__)

REIMS_PARTNER_OFFERS_SEED: tuple[dict[str, Any], ...] = (
    {
        "id": uuid.UUID("d6043000-0000-4000-8000-000000000001"),
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000009"),
        "org_slug": "belga-queen",
        "slug": "belga-queen-premiere-biere",
        "title": "Première bière artisanale offerte",
        "value_label": "-15 % ou 1ère bière offerte",
        "description": (
            "Profitez d'une bière artisanale belge à l'ouverture de votre visite au Belga Queen."
        ),
        "conditions": (
            "Sur présentation du Passport Yunicity, un seul usage par personne. "
            "Hors happy hour et soirées privées."
        ),
        "offer_type": PartnerOfferType.DISCOUNT.value,
        "tier_code_required": None,
        "is_featured": True,
        "metadata": {"value_category": "percent_discount"},
    },
    {
        "id": uuid.UUID("d6043000-0000-4000-8000-000000000002"),
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000011"),
        "org_slug": "pittaya",
        "slug": "pittaya-entree-offerte",
        "title": "Entrée offerte",
        "value_label": "Entrée au choix offerte",
        "description": (
            "Découvrez la cuisine thaï du Pittaya avec une entrée offerte "
            "pour les porteurs Passport."
        ),
        "conditions": (
            "Pour toute commande d'un plat principal, sur présentation du Passport. "
            "Valable midi et soir, une fois par personne."
        ),
        "offer_type": PartnerOfferType.GIFT.value,
        "tier_code_required": None,
        "is_featured": True,
        "metadata": {"value_category": "free_item"},
    },
    {
        "id": uuid.UUID("d6043000-0000-4000-8000-000000000003"),
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000012"),
        "org_slug": "centre-des-ressources",
        "slug": "centre-des-ressources-atelier-silver",
        "title": "Accès atelier découverte",
        "value_label": "Accès Silver — atelier découverte",
        "description": (
            "Participez à un atelier découverte des ressources locales du Centre des Ressources."
        ),
        "conditions": (
            "Réservé aux membres Passport Silver et Gold. Inscription sur place selon places "
            "disponibles."
        ),
        "offer_type": PartnerOfferType.EVENT_ACCESS.value,
        "tier_code_required": PassportTierCode.SILVER.value,
        "is_featured": False,
        "metadata": {"value_category": "exclusive_access"},
    },
    {
        "id": uuid.UUID("d6043000-0000-4000-8000-000000000004"),
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000014"),
        "org_slug": "garcon-barbiers",
        "slug": "garcon-barbiers-coupe-soin-gold",
        "title": "Coupe + soin barbe",
        "value_label": "Offre Gold — coupe & soin",
        "description": (
            "Une coupe et un soin barbe offerts pour les ambassadeurs Passport Gold "
            "chez Garçon Barbiers."
        ),
        "conditions": (
            "Sur rendez-vous, présentation du Passport Gold. Une utilisation par trimestre et par "
            "personne."
        ),
        "offer_type": PartnerOfferType.VIP.value,
        "tier_code_required": PassportTierCode.GOLD.value,
        "is_featured": False,
        "metadata": {"value_category": "exclusive_access"},
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
    "tier_code_required",
    "status",
    "is_active",
    "is_featured",
    "valid_from",
    "valid_until",
    "metadata_",
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
    metadata = entry.get("metadata") or {}
    return PartnerOffer(
        id=entry["id"],
        organization_id=organization_id,
        title=entry["title"],
        slug=entry["slug"],
        description=entry["description"],
        value_label=entry["value_label"],
        conditions=entry["conditions"],
        offer_type=entry["offer_type"],
        tier_code_required=entry.get("tier_code_required"),
        status=PartnerOfferStatus.PUBLISHED.value,
        is_active=True,
        is_featured=entry["is_featured"],
        valid_from=now - timedelta(days=1),
        valid_until=now + timedelta(days=365),
        metadata_=metadata,
    )


async def _upsert_offer(
    session: AsyncSession, entry: dict[str, Any], organization_id: uuid.UUID
) -> bool:
    """Return True when a new offer row is inserted."""
    existing = await session.get(PartnerOffer, entry["id"])
    built = _build_offer(entry, organization_id=organization_id)
    if existing is not None:
        for field in _SYNC_FIELDS:
            setattr(existing, field, getattr(built, field))
        return False
    by_slug = await session.execute(
        select(PartnerOffer).where(PartnerOffer.slug == entry["slug"])
    )
    found = by_slug.scalar_one_or_none()
    if found is not None:
        for field in _SYNC_FIELDS:
            setattr(found, field, getattr(built, field))
        return False
    session.add(built)
    return True


async def seed_reims_partner_offers(session: AsyncSession) -> tuple[int, int]:
    offers_created = 0
    offers_updated = 0

    for entry in REIMS_PARTNER_OFFERS_SEED:
        organization_id = await _resolve_organization_id(session, entry)
        if organization_id is None:
            logger.warning(
                "partner_offer_seed_skip org_not_found slug=%s",
                entry["org_slug"],
            )
            continue
        created = await _upsert_offer(session, entry, organization_id)
        if created:
            offers_created += 1
        else:
            offers_updated += 1

    await session.flush()
    logger.info(
        "reims_partner_offers_seed_completed",
        extra={
            "offers_created": offers_created,
            "offers_updated": offers_updated,
            "offers_total": len(REIMS_PARTNER_OFFERS_SEED),
        },
    )
    return offers_created, offers_updated
