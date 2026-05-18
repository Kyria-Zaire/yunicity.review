"""Controlled Supabase → partner_leads migration (dry-run default, no org creation)."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.partner_lead_constants import PartnerLeadSource
from app.core.partner_lead_normalize import normalize_instagram
from app.models.partner_lead import PartnerLead
from app.repositories.partner_lead_repository import PartnerLeadRepository
from app.schemas.partner_lead import PartnerLeadCreateRequest
from app.services.partner_lead_import import is_blocked_tribu_name
from app.services.supabase_recovery.mapping import map_supabase_row
from app.services.supabase_recovery.reader import fetch_table_rows

logger = logging.getLogger(__name__)


@dataclass
class ImportRowRecord:
    row_index: int
    name: str | None
    reason: str
    details: list[str] = field(default_factory=list)


@dataclass
class SupabasePartnerImportSummary:
    source_table: str
    total_scanned: int = 0
    imported: int = 0
    skipped_duplicates: int = 0
    invalid: int = 0
    suspicious: int = 0
    dry_run: bool = True
    duplicate_rows: list[ImportRowRecord] = field(default_factory=list)
    invalid_rows: list[ImportRowRecord] = field(default_factory=list)
    suspicious_rows: list[ImportRowRecord] = field(default_factory=list)
    imported_names: list[str] = field(default_factory=list)
    missing_fields_summary: dict[str, int] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "source_table": self.source_table,
            "total_scanned": self.total_scanned,
            "imported": self.imported,
            "skipped_duplicates": self.skipped_duplicates,
            "invalid": self.invalid,
            "suspicious": self.suspicious,
            "dry_run": self.dry_run,
            "imported_names": self.imported_names,
            "missing_fields_summary": self.missing_fields_summary,
            "duplicate_rows": [r.__dict__ for r in self.duplicate_rows[:50]],
            "invalid_rows": [r.__dict__ for r in self.invalid_rows[:50]],
            "suspicious_rows": [r.__dict__ for r in self.suspicious_rows[:50]],
        }


class SupabasePartnerImportError(Exception):
    """Fatal migration error."""


class SupabasePartnerImportService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._leads = PartnerLeadRepository(session)

    async def run_from_database(
        self,
        database_url: str,
        *,
        schema: str,
        source_table: str,
        limit: int | None,
        apply: bool,
    ) -> SupabasePartnerImportSummary:
        rows = await fetch_table_rows(
            database_url,
            schema=schema,
            table=source_table,
            limit=limit,
        )
        logger.info(
            "Fetched %s rows from %s.%s",
            len(rows),
            schema,
            source_table,
        )
        return await self.run_rows(
            source_table,
            rows,
            apply=apply,
        )

    async def run_rows(
        self,
        source_table: str,
        rows: list[dict[str, Any]],
        *,
        apply: bool,
    ) -> SupabasePartnerImportSummary:
        summary = SupabasePartnerImportSummary(
            source_table=source_table,
            total_scanned=len(rows),
            dry_run=not apply,
        )
        seen_identity: set[tuple[str, str, str]] = set()
        seen_instagram: set[str] = set()

        for index, row in enumerate(rows):
            if not isinstance(row, dict):
                summary.invalid += 1
                summary.invalid_rows.append(ImportRowRecord(index, None, "invalid_row_type"))
                continue

            mapped, map_errors = map_supabase_row(source_table, row, row_index=index)
            if mapped is None:
                summary.invalid += 1
                summary.invalid_rows.append(
                    ImportRowRecord(
                        index,
                        str(row.get("name") or row.get("company_name")),
                        "mapping_failed",
                        map_errors,
                    )
                )
                self._bump_missing(summary, map_errors)
                continue

            name = str(mapped["name"])
            if is_blocked_tribu_name(name):
                summary.invalid += 1
                summary.invalid_rows.append(ImportRowRecord(index, name, "blocked_tribu_name"))
                continue

            suspicious_flags = mapped.get("metadata", {}).get("suspicious_flags", [])
            if suspicious_flags:
                summary.suspicious += 1
                summary.suspicious_rows.append(
                    ImportRowRecord(index, name, "suspicious", list(suspicious_flags))
                )
                for flag in suspicious_flags:
                    self._bump_missing(summary, [flag])

            try:
                payload = PartnerLeadCreateRequest.model_validate(mapped)
            except ValidationError as exc:
                summary.invalid += 1
                summary.invalid_rows.append(
                    ImportRowRecord(
                        index,
                        name,
                        "validation_error",
                        [e["type"] for e in exc.errors()],
                    )
                )
                continue

            if payload.source != PartnerLeadSource.LANDING_PAGE:
                summary.invalid += 1
                summary.invalid_rows.append(ImportRowRecord(index, name, "invalid_source"))
                continue

            identity = PartnerLead.normalize_identity_key(
                name=payload.name,
                city=payload.city,
                phone=payload.phone,
            )
            if identity in seen_identity:
                summary.skipped_duplicates += 1
                summary.duplicate_rows.append(ImportRowRecord(index, name, "duplicate_in_batch"))
                continue
            seen_identity.add(identity)

            instagram_key = normalize_instagram(payload.instagram)
            if instagram_key:
                if instagram_key in seen_instagram:
                    summary.skipped_duplicates += 1
                    summary.duplicate_rows.append(
                        ImportRowRecord(index, name, "duplicate_instagram_in_batch")
                    )
                    continue
                seen_instagram.add(instagram_key)
                existing_ig = await self._leads.find_by_instagram(payload.instagram)
                if existing_ig is not None:
                    summary.skipped_duplicates += 1
                    summary.duplicate_rows.append(
                        ImportRowRecord(index, name, "duplicate_instagram_in_crm")
                    )
                    continue

            existing = await self._leads.find_duplicate(
                name=payload.name,
                city=payload.city,
                phone=payload.phone,
            )
            if existing is not None:
                summary.skipped_duplicates += 1
                summary.duplicate_rows.append(ImportRowRecord(index, name, "duplicate_in_crm"))
                continue

            if not apply:
                summary.imported += 1
                summary.imported_names.append(name)
                continue

            lead = self._build_lead(payload)
            await self._leads.create(lead)
            summary.imported += 1
            summary.imported_names.append(name)

        if apply and summary.imported > 0:
            await self._session.commit()
            logger.info("Committed %s partner leads from Supabase", summary.imported)
        elif not apply:
            logger.info(
                "Dry-run: %s would import, %s duplicates, %s invalid",
                summary.imported,
                summary.skipped_duplicates,
                summary.invalid,
            )

        return summary

    @staticmethod
    def _bump_missing(summary: SupabasePartnerImportSummary, codes: list[str]) -> None:
        for code in codes:
            summary.missing_fields_summary[code] = summary.missing_fields_summary.get(code, 0) + 1

    @staticmethod
    def _build_lead(payload: PartnerLeadCreateRequest) -> PartnerLead:
        name_key, city_key, phone_key = PartnerLead.normalize_identity_key(
            name=payload.name,
            city=payload.city,
            phone=payload.phone,
        )
        org_type_value = payload.organization_type.value if payload.organization_type else None
        metadata = {
            **payload.metadata,
            "imported_via": "supabase_partner_import",
        }
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
            source=PartnerLeadSource.LANDING_PAGE.value,
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
            metadata_=metadata,
            name_normalized=name_key,
            city_normalized=city_key,
            phone_normalized=phone_key,
            created_by_user_id=None,
            updated_by_user_id=None,
            converted_organization_id=None,
            converted_at=None,
        )
