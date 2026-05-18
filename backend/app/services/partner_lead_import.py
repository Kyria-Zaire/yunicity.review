"""Controlled partner lead file import — dry-run or apply, idempotent."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.partner_lead_constants import (
    PARTNER_LEAD_SOURCES,
    PARTNER_LEAD_STATUSES,
    PartnerLeadSource,
    PartnerLeadStatus,
)
from app.models.organization import Organization
from app.models.partner_lead import PartnerLead
from app.repositories.partner_lead_repository import PartnerLeadRepository
from app.schemas.partner_lead import PartnerLeadCreateRequest

BLOCKED_TRIBU_NAMES: frozenset[str] = frozenset(
    {
        "tribu sport",
        "tribu business",
        "tribu culture",
        "tribu event",
        "tribu gourmand",
        "tribu rencontre",
        "tribu social club",
    }
)

DEFAULT_SIGNED_NOTES = (
    "Partenaire signé physiquement par l'équipe terrain Yunicity."
)


@dataclass
class ImportRowIssue:
    row_index: int
    name: str | None
    errors: list[str]


@dataclass
class PartnerLeadImportSummary:
    total_rows: int = 0
    valid: int = 0
    created: int = 0
    skipped_duplicates: int = 0
    invalid: int = 0
    dry_run: bool = True
    issues: list[ImportRowIssue] = field(default_factory=list)
    duplicate_names: list[str] = field(default_factory=list)
    created_names: list[str] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return {
            "total_rows": self.total_rows,
            "valid": self.valid,
            "created": self.created,
            "skipped_duplicates": self.skipped_duplicates,
            "invalid": self.invalid,
            "dry_run": self.dry_run,
            "duplicate_names": self.duplicate_names,
            "created_names": self.created_names,
            "issues": [
                {"row_index": i.row_index, "name": i.name, "errors": i.errors}
                for i in self.issues
            ],
        }


class PartnerLeadImportError(Exception):
    """Fatal import error (invalid JSON, schema)."""


def load_import_file(path: Path) -> list[dict[str, Any]]:
    if not path.is_file():
        raise PartnerLeadImportError(f"Fichier introuvable : {path}")

    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise PartnerLeadImportError(f"JSON invalide : {exc}") from exc

    if isinstance(raw, list):
        items: list[object] = raw
    elif isinstance(raw, dict) and isinstance(raw.get("leads"), list):
        items = raw["leads"]
    else:
        raise PartnerLeadImportError(
            "Format attendu : liste JSON ou objet {\"leads\": [...]}."
        )

    leads: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            raise PartnerLeadImportError("Chaque entrée doit être un objet JSON.")
        leads.append(item)
    return leads


def is_blocked_tribu_name(name: str) -> bool:
    normalized = name.strip().lower()
    if normalized.startswith("tribu "):
        return True
    return normalized in BLOCKED_TRIBU_NAMES


def _row_to_create_request(row: dict[str, Any]) -> PartnerLeadCreateRequest:
    payload = dict(row)
    if not payload.get("notes"):
        payload["notes"] = DEFAULT_SIGNED_NOTES
    if not payload.get("source"):
        payload["source"] = PartnerLeadSource.PHYSICAL_PROSPECTING.value
    if not payload.get("status"):
        payload["status"] = PartnerLeadStatus.SIGNED.value
    if not payload.get("city"):
        payload["city"] = "Reims"
    return PartnerLeadCreateRequest.model_validate(payload)


class PartnerLeadImportService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._leads = PartnerLeadRepository(session)

    async def run_from_file(
        self,
        path: Path,
        *,
        apply: bool,
    ) -> PartnerLeadImportSummary:
        rows = load_import_file(path)
        return await self.run_rows(rows, apply=apply)

    async def run_rows(
        self,
        rows: list[dict[str, Any]],
        *,
        apply: bool,
    ) -> PartnerLeadImportSummary:
        summary = PartnerLeadImportSummary(
            total_rows=len(rows),
            dry_run=not apply,
        )
        seen_keys: set[tuple[str, str, str]] = set()

        for index, row in enumerate(rows):
            if not isinstance(row, dict):
                summary.invalid += 1
                summary.issues.append(
                    ImportRowIssue(row_index=index, name=None, errors=["invalid_row_type"])
                )
                continue

            name_raw = str(row.get("name") or "").strip()
            if is_blocked_tribu_name(name_raw):
                summary.invalid += 1
                summary.issues.append(
                    ImportRowIssue(
                        row_index=index,
                        name=name_raw or None,
                        errors=["blocked_tribu_name"],
                    )
                )
                continue

            try:
                payload = _row_to_create_request(row)
            except ValidationError as exc:
                summary.invalid += 1
                summary.issues.append(
                    ImportRowIssue(
                        row_index=index,
                        name=name_raw or None,
                        errors=[e["type"] for e in exc.errors()],
                    )
                )
                continue

            if payload.source.value not in PARTNER_LEAD_SOURCES:
                summary.invalid += 1
                summary.issues.append(
                    ImportRowIssue(
                        row_index=index,
                        name=payload.name,
                        errors=["invalid_source"],
                    )
                )
                continue
            if payload.status.value not in PARTNER_LEAD_STATUSES:
                summary.invalid += 1
                summary.issues.append(
                    ImportRowIssue(
                        row_index=index,
                        name=payload.name,
                        errors=["invalid_status"],
                    )
                )
                continue

            identity = PartnerLead.normalize_identity_key(
                name=payload.name,
                city=payload.city,
                phone=payload.phone,
            )
            if identity in seen_keys:
                summary.skipped_duplicates += 1
                summary.duplicate_names.append(payload.name)
                continue
            seen_keys.add(identity)

            existing = await self._leads.find_duplicate(
                name=payload.name,
                city=payload.city,
                phone=payload.phone,
            )
            if existing is not None:
                summary.skipped_duplicates += 1
                summary.duplicate_names.append(payload.name)
                continue

            summary.valid += 1
            if not apply:
                continue

            lead = self._build_lead(payload)
            await self._leads.create(lead)
            summary.created += 1
            summary.created_names.append(payload.name)

        if apply and summary.created > 0:
            await self._session.commit()

        return summary

    @staticmethod
    def _build_lead(payload: PartnerLeadCreateRequest) -> PartnerLead:
        name_key, city_key, phone_key = PartnerLead.normalize_identity_key(
            name=payload.name,
            city=payload.city,
            phone=payload.phone,
        )
        org_type_value = (
            payload.organization_type.value if payload.organization_type else None
        )
        return PartnerLead(
            name=payload.name.strip(),
            organization_type=org_type_value,
            contact_name=payload.contact_name,
            email=str(payload.email) if payload.email else None,
            phone=payload.phone,
            website=payload.website,
            instagram=payload.instagram,
            city=payload.city,
            address=payload.address,
            source=payload.source.value,
            status=payload.status.value,
            interested_passport=payload.interested_passport,
            interested_events=payload.interested_events,
            interested_creator_program=payload.interested_creator_program,
            interested_offers=payload.interested_offers,
            interested_business_passport=payload.interested_business_passport,
            tags=payload.tags,
            notes=payload.notes,
            internal_rating=payload.internal_rating,
            last_contacted_at=payload.last_contacted_at,
            next_followup_at=payload.next_followup_at,
            metadata_={
                **payload.metadata,
                "imported_via": "partner_lead_import_script",
            },
            name_normalized=name_key,
            city_normalized=city_key,
            phone_normalized=phone_key,
            created_by_user_id=None,
            updated_by_user_id=None,
        )


async def count_partner_leads(session: AsyncSession) -> int:
    result = await session.execute(select(func.count()).select_from(PartnerLead))
    return int(result.scalar_one())


async def count_organizations(session: AsyncSession) -> int:
    result = await session.execute(select(func.count()).select_from(Organization))
    return int(result.scalar_one())
