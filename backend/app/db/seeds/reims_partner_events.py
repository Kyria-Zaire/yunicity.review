"""Reims pilot partner events seed (WEB-PARTNERS-05A) — idempotent."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.local_event_constants import LocalEventModerationStatus, LocalEventType
from app.models.local_event import LocalEvent
from app.models.organization import Organization
from app.models.user import User

logger = logging.getLogger(__name__)

_PILOT_DESCRIPTION = (
    "Un moment pilote proposé dans le cadre du réseau partenaire Yunicity."
)

# UUID stable pour le compte système seed — jamais un vrai utilisateur
_SEED_SYSTEM_USER_ID = uuid.UUID("d6000000-0000-4000-8000-000000000001")

# UUIDs déterministes pour idempotence — organisation IDs issus de reims_signed_partners.py
REIMS_PARTNER_EVENTS_SEED: tuple[dict[str, Any], ...] = (
    {
        "id": uuid.UUID("d6050000-0000-4000-8000-000000000001"),
        # Belga Queen (ACTIVE)
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000009"),
        "title": "Afterwork découverte",
        "location_name_fallback": "Belga Queen, Reims",
    },
    {
        "id": uuid.UUID("d6050000-0000-4000-8000-000000000002"),
        # Pittaya (ACTIVE)
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000011"),
        "title": "Découverte culinaire",
        "location_name_fallback": "Pittaya, Reims",
    },
    {
        "id": uuid.UUID("d6050000-0000-4000-8000-000000000003"),
        # Centre des Ressources (ACTIVE)
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000012"),
        "title": "Atelier ressources locales",
        "location_name_fallback": "Centre des Ressources, Reims",
    },
    {
        "id": uuid.UUID("d6050000-0000-4000-8000-000000000004"),
        # Garçon Barbiers (ACTIVE)
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000014"),
        "title": "Conseils style & entretien",
        "location_name_fallback": "Garçon Barbiers, Reims",
    },
)

_SYNC_FIELDS = ("title", "description", "event_type", "moderation_status")


async def _ensure_seed_system_user(session: AsyncSession) -> uuid.UUID:
    """Crée un compte système interne pour les seeds si absent. Jamais exposé en prod."""
    existing = await session.get(User, _SEED_SYSTEM_USER_ID)
    if existing is not None:
        return _SEED_SYSTEM_USER_ID
    result = await session.execute(
        select(User).where(User.email == "seed-system@yunicity.internal")
    )
    found = result.scalar_one_or_none()
    if found is not None:
        return found.id
    system_user = User(
        id=_SEED_SYSTEM_USER_ID,
        email="seed-system@yunicity.internal",
        full_name="Yunicity System",
        city="Reims",
        is_active=False,
        hashed_password="!locked",
    )
    session.add(system_user)
    await session.flush()
    return _SEED_SYSTEM_USER_ID


def _build_event(entry: dict[str, Any], org: Organization, system_user_id: uuid.UUID) -> LocalEvent:
    starts_at = datetime.now(UTC) + timedelta(days=14)
    location_name = org.address or entry["location_name_fallback"]
    return LocalEvent(
        id=entry["id"],
        organization_id=entry["organization_id"],
        created_by_user_id=system_user_id,
        title=entry["title"],
        description=_PILOT_DESCRIPTION,
        event_type=LocalEventType.PARTNER_EVENT.value,
        city="Reims",
        starts_at=starts_at,
        timezone="Europe/Paris",
        location_name=location_name,
        address=org.address,
        latitude=float(org.latitude) if org.latitude is not None else None,
        longitude=float(org.longitude) if org.longitude is not None else None,
        moderation_status=LocalEventModerationStatus.APPROVED.value,
        moderated_at=datetime.now(UTC),
        visibility="public",
    )


async def seed_reims_partner_events(session: AsyncSession) -> None:
    system_user_id = await _ensure_seed_system_user(session)

    for entry in REIMS_PARTNER_EVENTS_SEED:
        org = await session.get(Organization, entry["organization_id"])
        if org is None:
            logger.warning(
                "partner_event_seed_skip org_not_found org_id=%s", entry["organization_id"]
            )
            continue

        existing = await session.get(LocalEvent, entry["id"])
        if existing is not None:
            built = _build_event(entry, org, system_user_id)
            for field in _SYNC_FIELDS:
                setattr(existing, field, getattr(built, field))
        else:
            by_title = await session.execute(
                select(LocalEvent).where(
                    LocalEvent.title == entry["title"],
                    LocalEvent.organization_id == entry["organization_id"],
                )
            )
            found = by_title.scalar_one_or_none()
            if found is not None:
                built = _build_event(entry, org, system_user_id)
                for field in _SYNC_FIELDS:
                    setattr(found, field, getattr(built, field))
            else:
                session.add(_build_event(entry, org, system_user_id))

    logger.info(
        "reims_partner_events_seed_completed count=%s",
        len(REIMS_PARTNER_EVENTS_SEED),
    )
