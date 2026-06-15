"""Reims signed partners seed (WEB-PARTNERS-01)."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.organization_constants import (
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.partner_assets import (
    partner_seed_banner_url,
    partner_seed_logo_url,
)
from app.core.partner_constants import PartnershipType, PartnerStatus
from app.db.seeds.reims_pilot_partner_public_data import (
    PILOT_PARTNER_SLUGS,
    merge_pilot_public_fields,
)
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile

logger = logging.getLogger(__name__)

REIMS_CITY = "Reims"

_SYNC_ORG_FIELDS = (
    "name",
    "description",
    "type",
    "category",
    "city",
    "address",
    "postal_code",
    "latitude",
    "longitude",
    "phone",
    "website",
    "social_links",
    "logo_url",
    "banner_url",
    "verification_status",
    "visibility",
)

_SYNC_PROFILE_FIELDS = (
    "partner_status",
    "partnership_type",
    "signed_at",
    "activated_at",
    "contract_reference",
    "contact_name",
    "contact_email",
    "contact_phone",
    "public_partner_label",
    "is_featured",
    "featured_priority",
    "notes_internal",
)

REIMS_SIGNED_PARTNERS_SEED: tuple[dict[str, Any], ...] = (
    {
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000001"),
        "profile_id": uuid.UUID("d6041000-0000-4000-8000-000000000001"),
        "slug": "ett-europe-top-team",
        "name": "ETT Europe Top Team",
        "description": "Club de basket local engagé dans le sport et la vie de quartier à Reims.",
        "org_type": OrganizationType.ASSOCIATION,
        "category": "sport",
        "partnership_type": PartnershipType.SPORTS_CLUB,
        "partner_status": PartnerStatus.SIGNED,
        "visibility": OrganizationVisibility.PRIVATE,
        "public_partner_label": "Partenaire sport",
    },
    {
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000002"),
        "profile_id": uuid.UUID("d6041000-0000-4000-8000-000000000002"),
        "slug": "face-a-face",
        "name": "Face à Face",
        "description": "Commerce de proximité et services au cœur de la vie locale rémoise.",
        "org_type": OrganizationType.COMMERCE,
        "category": "services",
        "partnership_type": PartnershipType.LOCAL_BUSINESS,
        "partner_status": PartnerStatus.SIGNED,
        "visibility": OrganizationVisibility.PRIVATE,
        "public_partner_label": "Commerce local",
    },
    {
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000003"),
        "profile_id": uuid.UUID("d6041000-0000-4000-8000-000000000003"),
        "slug": "rhinocereims",
        "name": "Rhinocéreims",
        "description": "Collectif et association rémoise autour du sport et de l’énergie locale.",
        "org_type": OrganizationType.ASSOCIATION,
        "category": "sport",
        "partnership_type": PartnershipType.ASSOCIATION,
        "partner_status": PartnerStatus.SIGNED,
        "visibility": OrganizationVisibility.PRIVATE,
        "public_partner_label": "Association locale",
    },
    {
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000004"),
        "profile_id": uuid.UUID("d6041000-0000-4000-8000-000000000004"),
        "slug": "daiboken",
        "name": "Daiboken",
        "description": "Restaurant et cuisine locale à découvrir sur Reims.",
        "org_type": OrganizationType.COMMERCE,
        "category": "food",
        "partnership_type": PartnershipType.RESTAURANT,
        "partner_status": PartnerStatus.SIGNED,
        "visibility": OrganizationVisibility.PRIVATE,
        "public_partner_label": "Restaurant",
    },
    {
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000005"),
        "profile_id": uuid.UUID("d6041000-0000-4000-8000-000000000005"),
        "slug": "marcel-et-jane",
        "name": "Marcel et Jane",
        "description": "Café-restaurant de quartier, convivialité et produits locaux.",
        "org_type": OrganizationType.COMMERCE,
        "category": "cafe",
        "partnership_type": PartnershipType.RESTAURANT,
        "partner_status": PartnerStatus.SIGNED,
        "visibility": OrganizationVisibility.PRIVATE,
        "public_partner_label": "Café-restaurant",
    },
    {
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000006"),
        "profile_id": uuid.UUID("d6041000-0000-4000-8000-000000000006"),
        "slug": "eat-night",
        "name": "Eat Night",
        "description": "Adresse food et soirée pour sortir à Reims.",
        "org_type": OrganizationType.COMMERCE,
        "category": "food",
        "partnership_type": PartnershipType.RESTAURANT,
        "partner_status": PartnerStatus.SIGNED,
        "visibility": OrganizationVisibility.PRIVATE,
        "public_partner_label": "Food & soirée",
    },
    {
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000007"),
        "profile_id": uuid.UUID("d6041000-0000-4000-8000-000000000007"),
        "slug": "imoria",
        "name": "Imoria",
        "description": "Projet créatif et partenaire interne de l’écosystème Yunicity à Reims.",
        "org_type": OrganizationType.CREATOR,
        "category": "creator",
        "partnership_type": PartnershipType.INTERNAL_PROJECT,
        "partner_status": PartnerStatus.SIGNED,
        "visibility": OrganizationVisibility.PRIVATE,
        "public_partner_label": "Projet créatif",
    },
    {
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000008"),
        "profile_id": uuid.UUID("d6041000-0000-4000-8000-000000000008"),
        "slug": "champagne-basket-masculin",
        "name": "Champagne Basket Masculin",
        "description": "Club de basket masculin champenois, ancré dans le territoire rémois.",
        "org_type": OrganizationType.ASSOCIATION,
        "category": "sport",
        "partnership_type": PartnershipType.SPORTS_CLUB,
        "partner_status": PartnerStatus.SIGNED,
        "visibility": OrganizationVisibility.PRIVATE,
        "public_partner_label": "Club sportif",
    },
    {
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000009"),
        "profile_id": uuid.UUID("d6041000-0000-4000-8000-000000000009"),
        "slug": "belga-queen",
        "name": "Belga Queen",
        "description": "Brasserie et bar, cuisine belge et ambiance conviviale en centre-ville.",
        "org_type": OrganizationType.COMMERCE,
        "category": "nightlife",
        "partnership_type": PartnershipType.NIGHTLIFE,
        "partner_status": PartnerStatus.ACTIVE,
        "visibility": OrganizationVisibility.PUBLIC,
        "public_partner_label": "Brasserie & bar",
        "is_featured": True,
        "featured_priority": 30,
        "activated_at": datetime(2025, 11, 1, tzinfo=UTC),
    },
    {
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000010"),
        "profile_id": uuid.UUID("d6041000-0000-4000-8000-000000000010"),
        "slug": "kebab-tacos-gourmand",
        "name": "Kebab Tacos Gourmand",
        "description": "Restauration rapide et gourmande, adresse locale à Reims.",
        "org_type": OrganizationType.COMMERCE,
        "category": "fast_food",
        "partnership_type": PartnershipType.RESTAURANT,
        "partner_status": PartnerStatus.SIGNED,
        "visibility": OrganizationVisibility.PRIVATE,
        "public_partner_label": "Fast food",
    },
    {
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000011"),
        "profile_id": uuid.UUID("d6041000-0000-4000-8000-000000000011"),
        "slug": "pittaya",
        "name": "Pittaya",
        "description": "Cuisine asiatique et traiteur, partenaire food actif sur Reims.",
        "org_type": OrganizationType.COMMERCE,
        "category": "asian_food",
        "partnership_type": PartnershipType.RESTAURANT,
        "partner_status": PartnerStatus.ACTIVE,
        "visibility": OrganizationVisibility.PUBLIC,
        "public_partner_label": "Cuisine asiatique",
        "is_featured": True,
        "featured_priority": 20,
        "activated_at": datetime(2025, 10, 15, tzinfo=UTC),
    },
    {
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000012"),
        "profile_id": uuid.UUID("d6041000-0000-4000-8000-000000000012"),
        "slug": "centre-des-ressources",
        "name": "Centre des Ressources",
        "description": "Structure d’accompagnement et de ressources pour les habitants de Reims.",
        "org_type": OrganizationType.PUBLIC_AGENCY,
        "category": "institutional",
        "partnership_type": PartnershipType.INSTITUTIONAL,
        "partner_status": PartnerStatus.ACTIVE,
        "visibility": OrganizationVisibility.PUBLIC,
        "public_partner_label": "Ressources locales",
        "activated_at": datetime(2025, 9, 1, tzinfo=UTC),
    },
    {
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000013"),
        "profile_id": uuid.UUID("d6041000-0000-4000-8000-000000000013"),
        "slug": "yurpass",
        "name": "Yurpass",
        "description": "Projet partenaire interne lié à l’expérience locale Yunicity.",
        "org_type": OrganizationType.CREATOR,
        "category": "creator",
        "partnership_type": PartnershipType.CREATOR_PARTNER,
        "partner_status": PartnerStatus.SIGNED,
        "visibility": OrganizationVisibility.PRIVATE,
        "public_partner_label": "Créateur partenaire",
    },
    {
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000014"),
        "profile_id": uuid.UUID("d6041000-0000-4000-8000-000000000014"),
        "slug": "garcon-barbiers",
        "name": "Garçon Barbiers",
        "description": "Salon de coiffure barbier, soin et style masculin à Reims.",
        "org_type": OrganizationType.COMMERCE,
        "category": "barber",
        "partnership_type": PartnershipType.LOCAL_BUSINESS,
        "partner_status": PartnerStatus.ACTIVE,
        "visibility": OrganizationVisibility.PUBLIC,
        "public_partner_label": "Barbier",
        "activated_at": datetime(2025, 12, 1, tzinfo=UTC),
    },
)

REIMS_SIGNED_PARTNER_SLUGS: tuple[str, ...] = tuple(
    str(entry["slug"]) for entry in REIMS_SIGNED_PARTNERS_SEED
)


def _apply_catalog_media(entry: dict[str, Any], settings: Settings) -> dict[str, Any]:
    slug = entry.get("slug")
    if not isinstance(slug, str) or slug not in PILOT_PARTNER_SLUGS:
        return entry
    merged = dict(entry)
    merged["logo_url"] = partner_seed_logo_url(
        slug,
        app_env=settings.app_env,
        web_frontend_url=settings.web_frontend_url,
    )
    merged["banner_url"] = partner_seed_banner_url(
        slug,
        app_env=settings.app_env,
        web_frontend_url=settings.web_frontend_url,
    )
    return merged


def _prepare_seed_entry(
    raw_entry: dict[str, Any],
    *,
    settings: Settings | None,
) -> dict[str, Any]:
    entry = merge_pilot_public_fields(dict(raw_entry))
    if settings is not None and settings.app_env in ("prod", "preprod"):
        return _apply_catalog_media(entry, settings)
    return entry


def _build_organization(entry: dict[str, Any]) -> Organization:
    signed_at = entry.get("signed_at") or datetime(2025, 6, 1, tzinfo=UTC)
    return Organization(
        id=entry["organization_id"],
        slug=entry["slug"],
        name=entry["name"],
        description=entry["description"],
        type=entry["org_type"],
        category=entry["category"],
        city=REIMS_CITY,
        address=entry.get("address"),
        postal_code=entry.get("postal_code"),
        latitude=entry.get("latitude"),
        longitude=entry.get("longitude"),
        phone=entry.get("phone"),
        website=entry.get("website"),
        social_links=entry.get("social_links") or {},
        logo_url=entry.get("logo_url"),
        banner_url=entry.get("banner_url"),
        verification_status=VerificationStatus.VERIFIED,
        visibility=entry["visibility"],
        verified_at=signed_at,
    )


def _build_partner_profile(entry: dict[str, Any]) -> PartnerProfile:
    signed_at = entry.get("signed_at") or datetime(2025, 6, 1, tzinfo=UTC)
    return PartnerProfile(
        id=entry["profile_id"],
        organization_id=entry["organization_id"],
        partner_status=entry["partner_status"],
        partnership_type=entry["partnership_type"],
        signed_at=signed_at,
        activated_at=entry.get("activated_at"),
        contract_reference=entry.get("contract_reference"),
        contact_name=entry.get("contact_name"),
        contact_email=entry.get("contact_email"),
        contact_phone=entry.get("contact_phone"),
        public_partner_label=entry.get("public_partner_label"),
        is_featured=bool(entry.get("is_featured", False)),
        featured_priority=int(entry.get("featured_priority", 0)),
        notes_internal=entry.get(
            "notes_internal",
            "Seed WEB-PARTNERS-01 — données catalogue interne.",
        ),
    )


async def _upsert_organization(session: AsyncSession, row: Organization) -> bool:
    """Return True when a new organization row is inserted."""
    existing = await session.get(Organization, row.id)
    if existing is None:
        by_slug = await session.execute(
            select(Organization).where(Organization.slug == row.slug)
        )
        found = by_slug.scalar_one_or_none()
        if found is None:
            session.add(row)
            return True
        for field in _SYNC_ORG_FIELDS:
            setattr(found, field, getattr(row, field))
        return False
    for field in _SYNC_ORG_FIELDS:
        setattr(existing, field, getattr(row, field))
    return False


async def _upsert_partner_profile(session: AsyncSession, row: PartnerProfile) -> None:
    existing = await session.get(PartnerProfile, row.id)
    if existing is None:
        by_org = await session.execute(
            select(PartnerProfile).where(PartnerProfile.organization_id == row.organization_id)
        )
        found = by_org.scalar_one_or_none()
        if found is None:
            session.add(row)
            return
        for field in _SYNC_PROFILE_FIELDS:
            setattr(found, field, getattr(row, field))
        return
    for field in _SYNC_PROFILE_FIELDS:
        setattr(existing, field, getattr(row, field))


async def seed_reims_signed_partners(
    session: AsyncSession,
    *,
    settings: Settings | None = None,
) -> tuple[int, int]:
    partners_created = 0
    partners_updated = 0

    for raw_entry in REIMS_SIGNED_PARTNERS_SEED:
        entry = _prepare_seed_entry(raw_entry, settings=settings)
        org = _build_organization(entry)
        profile = _build_partner_profile(entry)
        created = await _upsert_organization(session, org)
        await _upsert_partner_profile(session, profile)
        if created:
            partners_created += 1
        else:
            partners_updated += 1

    await session.flush()
    logger.info(
        "reims_signed_partners_seed_completed",
        extra={
            "partners_created": partners_created,
            "partners_updated": partners_updated,
            "partners_total": len(REIMS_SIGNED_PARTNERS_SEED),
        },
    )
    return partners_created, partners_updated
