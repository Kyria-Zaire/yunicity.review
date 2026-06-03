"""Reims activation waves seed (ADMIN-02C-A) — idempotent, read-only on partners."""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.activation_wave_constants import (
    REIMS_CITY_DEFAULT,
    ActivationWaveItemStatus,
    ActivationWaveStatus,
    default_activation_checklist,
)
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES
from app.models.activation_wave import ActivationWave, ActivationWaveItem
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile

logger = logging.getLogger(__name__)

WAVE_1_ID = uuid.UUID("d6042000-0000-4000-8000-000000000001")
WAVE_2_ID = uuid.UUID("d6042000-0000-4000-8000-000000000002")

_SYNC_WAVE_FIELDS = ("name", "description", "status", "sort_order", "city")
_SYNC_ITEM_FIELDS = (
    "organization_id",
    "partner_profile_id",
    "partner_slug_snapshot",
    "status",
    "checklist",
    "notes",
    "sort_order",
)


@dataclass(frozen=True, slots=True)
class _WavePartnerSeed:
    item_id: uuid.UUID
    slug: str
    name: str
    sort_order: int


WAVE_1_PARTNERS: tuple[_WavePartnerSeed, ...] = (
    _WavePartnerSeed(
        uuid.UUID("d6042100-0000-4000-8000-000000000001"),
        "belga-queen",
        "Belga Queen",
        10,
    ),
    _WavePartnerSeed(
        uuid.UUID("d6042100-0000-4000-8000-000000000002"),
        "pittaya",
        "Pittaya",
        20,
    ),
    _WavePartnerSeed(
        uuid.UUID("d6042100-0000-4000-8000-000000000003"),
        "centre-des-ressources",
        "Centre des Ressources",
        30,
    ),
    _WavePartnerSeed(
        uuid.UUID("d6042100-0000-4000-8000-000000000004"),
        "garcon-barbiers",
        "Garçon Barbiers",
        40,
    ),
)

WAVE_2_PARTNERS: tuple[_WavePartnerSeed, ...] = (
    _WavePartnerSeed(
        uuid.UUID("d6042100-0000-4000-8000-000000000005"),
        "marcel-et-jane",
        "Marcel et Jane",
        10,
    ),
    _WavePartnerSeed(
        uuid.UUID("d6042100-0000-4000-8000-000000000006"),
        "daiboken",
        "Daiboken",
        20,
    ),
    _WavePartnerSeed(
        uuid.UUID("d6042100-0000-4000-8000-000000000007"),
        "eat-night",
        "Eat Night",
        30,
    ),
    _WavePartnerSeed(
        uuid.UUID("d6042100-0000-4000-8000-000000000008"),
        "kebab-tacos-gourmand",
        "Kebab Tacos Gourmand",
        40,
    ),
    _WavePartnerSeed(
        uuid.UUID("d6042100-0000-4000-8000-000000000009"),
        "face-a-face",
        "Face à Face",
        50,
    ),
)

REIMS_ACTIVATION_WAVES_SEED: tuple[dict[str, Any], ...] = (
    {
        "id": WAVE_1_ID,
        "city": REIMS_CITY_DEFAULT,
        "code": "reims-wave-1",
        "name": "Reims Wave 1 — Pilote actif",
        "description": "Quatre partenaires pilotes actifs sur le territoire Reims.",
        "status": ActivationWaveStatus.COMPLETED,
        "sort_order": 10,
        "partners": WAVE_1_PARTNERS,
        "default_item_status": None,
    },
    {
        "id": WAVE_2_ID,
        "city": REIMS_CITY_DEFAULT,
        "code": "reims-wave-2",
        "name": "Reims Wave 2 — Candidats commerces/restauration",
        "description": "Candidats signés en préparation d'activation catalogue.",
        "status": ActivationWaveStatus.ACTIVE,
        "sort_order": 20,
        "partners": WAVE_2_PARTNERS,
        "default_item_status": ActivationWaveItemStatus.CANDIDATE,
    },
)


async def _resolve_org_and_profile(
    session: AsyncSession,
    slug: str,
) -> tuple[Organization | None, PartnerProfile | None]:
    result = await session.execute(select(Organization).where(Organization.slug == slug))
    org = result.scalar_one_or_none()
    if org is None:
        return None, None
    profile_result = await session.execute(
        select(PartnerProfile).where(PartnerProfile.organization_id == org.id)
    )
    profile = profile_result.scalar_one_or_none()
    return org, profile


def _item_status_for_wave1(profile: PartnerProfile | None) -> ActivationWaveItemStatus:
    if profile is not None and profile.partner_status in PUBLIC_PARTNER_STATUSES:
        return ActivationWaveItemStatus.ACTIVATED
    if profile is not None:
        return ActivationWaveItemStatus.READY
    return ActivationWaveItemStatus.CANDIDATE


def _build_item_status(
    *,
    wave_entry: dict[str, Any],
    profile: PartnerProfile | None,
) -> ActivationWaveItemStatus:
    default_status = wave_entry.get("default_item_status")
    if isinstance(default_status, ActivationWaveItemStatus):
        return default_status
    return _item_status_for_wave1(profile)


async def _upsert_wave(session: AsyncSession, entry: dict[str, Any]) -> ActivationWave:
    existing = await session.get(ActivationWave, entry["id"])
    built = ActivationWave(
        id=entry["id"],
        city=entry["city"],
        code=entry["code"],
        name=entry["name"],
        description=entry.get("description"),
        status=entry["status"],
        sort_order=entry["sort_order"],
    )
    if existing is None:
        by_code = await session.execute(
            select(ActivationWave).where(
                ActivationWave.city == entry["city"],
                ActivationWave.code == entry["code"],
            )
        )
        found = by_code.scalar_one_or_none()
        if found is None:
            session.add(built)
            await session.flush()
            return built
        existing = found
    for field in _SYNC_WAVE_FIELDS:
        setattr(existing, field, getattr(built, field))
    await session.flush()
    return existing


async def _upsert_item(
    session: AsyncSession,
    *,
    wave: ActivationWave,
    wave_entry: dict[str, Any],
    partner: _WavePartnerSeed,
) -> None:
    org, profile = await _resolve_org_and_profile(session, partner.slug)
    status = _build_item_status(wave_entry=wave_entry, profile=profile)
    notes = None
    if org is None:
        notes = "Organisation absente en base — snapshot conservé pour suivi ops."

    built = ActivationWaveItem(
        id=partner.item_id,
        wave_id=wave.id,
        organization_id=org.id if org else None,
        partner_profile_id=profile.id if profile else None,
        partner_name_snapshot=partner.name,
        partner_slug_snapshot=partner.slug,
        status=status,
        checklist=default_activation_checklist(),
        notes=notes,
        sort_order=partner.sort_order,
    )

    existing = await session.get(ActivationWaveItem, partner.item_id)
    if existing is None:
        by_name = await session.execute(
            select(ActivationWaveItem).where(
                ActivationWaveItem.wave_id == wave.id,
                ActivationWaveItem.partner_name_snapshot == partner.name,
            )
        )
        found = by_name.scalar_one_or_none()
        if found is None:
            session.add(built)
            return
        existing = found

    for field in _SYNC_ITEM_FIELDS:
        setattr(existing, field, getattr(built, field))
    existing.partner_name_snapshot = partner.name


async def seed_reims_activation_waves(session: AsyncSession) -> None:
    for wave_entry in REIMS_ACTIVATION_WAVES_SEED:
        wave = await _upsert_wave(session, wave_entry)
        for partner in wave_entry["partners"]:
            await _upsert_item(
                session,
                wave=wave,
                wave_entry=wave_entry,
                partner=partner,
            )
    logger.info(
        "reims_activation_waves_seed_completed waves=%s",
        len(REIMS_ACTIVATION_WAVES_SEED),
    )
