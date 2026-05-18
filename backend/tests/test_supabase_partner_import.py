"""Tests Supabase → partner_leads recovery (TICKET-250)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from app.core.partner_lead_constants import PartnerLeadSource, PartnerLeadStatus
from app.core.partner_lead_normalize import normalize_instagram
from app.db.session import get_session_factory
from app.models.partner_lead import PartnerLead
from app.services.partner_lead_import import count_organizations, count_partner_leads
from app.services.supabase_recovery.discovery import discover_from_sql_dump
from app.services.supabase_recovery.import_service import SupabasePartnerImportService
from app.services.supabase_recovery.mapping import map_status, map_supabase_row
from app.services.supabase_recovery.sql_dump import parse_sql_dump
from sqlalchemy import select

FIXTURES = Path(__file__).resolve().parent / "fixtures"
SQL_DUMP = FIXTURES / "supabase_sample_dump.sql"

SUPABASE_ROWS: list[dict[str, Any]] = [
    {
        "id": "11111111-1111-4111-8111-111111111101",
        "company_name": "Café Supabase Test",
        "city": "Reims",
        "phone": "03 26 00 00 01",
        "email": "cafe-supabase@example.com",
        "instagram_handle": "@cafetest",
        "notes": "Lead landing historique",
        "signed": True,
        "created_at": "2025-01-15T10:00:00+00:00",
    },
    {
        "id": "11111111-1111-4111-8111-111111111102",
        "company_name": "Café Supabase Test",
        "city": "Reims",
        "phone": "03 26 00 00 01",
        "email": "duplicate@example.com",
        "signed": False,
    },
    {
        "company_name": "",
        "city": "Reims",
    },
]


def test_normalize_instagram() -> None:
    assert normalize_instagram("@CafeTest") == "cafetest"
    assert normalize_instagram("https://instagram.com/cafetest/") == "cafetest"


def test_map_status_signed_and_interested() -> None:
    assert map_status(status_raw=None, signed_flag=True) == PartnerLeadStatus.SIGNED
    assert map_status(status_raw="signed", signed_flag=None) == PartnerLeadStatus.SIGNED
    assert map_status(status_raw="pending", signed_flag=False) == PartnerLeadStatus.INTERESTED


def test_map_supabase_row_landing_page_defaults() -> None:
    payload, errors = map_supabase_row(
        "landing_partners",
        SUPABASE_ROWS[0],
        row_index=0,
    )
    assert errors == []
    assert payload is not None
    assert payload["source"] == PartnerLeadSource.LANDING_PAGE.value
    assert payload["status"] == PartnerLeadStatus.SIGNED.value
    assert payload["name"] == "Café Supabase Test"
    assert "supabase-import" in payload["tags"]


def test_map_supabase_row_missing_name() -> None:
    payload, errors = map_supabase_row(
        "landing_partners",
        SUPABASE_ROWS[2],
        row_index=2,
    )
    assert payload is None
    assert "missing_name" in errors


def test_parse_sql_dump_fixture() -> None:
    tables = parse_sql_dump(SQL_DUMP)
    names = [t.name for t in tables]
    assert "landing_partners" in names
    assert "auth_users" in names


def test_discover_from_sql_dump_scores_partners() -> None:
    discoveries = discover_from_sql_dump(SQL_DUMP)
    landing = next(d for d in discoveries if d.name == "landing_partners")
    assert landing.relevance_score >= 3
    col_names = {c.name for c in landing.columns}
    assert "company_name" in col_names


@pytest.mark.integration
@pytest.mark.asyncio
async def test_supabase_import_dry_run_creates_nothing(auth_client: object) -> None:
    _ = auth_client
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        before = await count_partner_leads(session)
        service = SupabasePartnerImportService(session)
        summary = await service.run_rows("landing_partners", SUPABASE_ROWS, apply=False)
        after = await count_partner_leads(session)

    assert summary.dry_run is True
    assert summary.total_scanned == 3
    assert summary.imported == 1
    assert summary.skipped_duplicates == 1
    assert summary.invalid == 1
    assert before == after


@pytest.mark.integration
@pytest.mark.asyncio
async def test_supabase_import_apply_no_organization(auth_client: object) -> None:
    _ = auth_client
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        org_before = await count_organizations(session)
        service = SupabasePartnerImportService(session)
        summary = await service.run_rows(
            "landing_partners",
            [SUPABASE_ROWS[0]],
            apply=True,
        )
        org_after = await count_organizations(session)
        result = await session.execute(
            select(PartnerLead).where(PartnerLead.name == "Café Supabase Test")
        )
        lead = result.scalar_one_or_none()

    assert summary.imported == 1
    assert org_before == org_after
    assert lead is not None
    assert lead.source == PartnerLeadSource.LANDING_PAGE.value
    assert lead.converted_organization_id is None
    assert lead.metadata_.get("imported_via") == "supabase_partner_import"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_supabase_import_idempotent(auth_client: object) -> None:
    _ = auth_client
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        service = SupabasePartnerImportService(session)
        first = await service.run_rows("landing_partners", [SUPABASE_ROWS[0]], apply=True)
        count_after_first = await count_partner_leads(session)
        second = await service.run_rows("landing_partners", [SUPABASE_ROWS[0]], apply=True)
        count_after_second = await count_partner_leads(session)

    assert first.imported == 1
    assert second.imported == 0
    assert second.skipped_duplicates == 1
    assert count_after_first == count_after_second


@pytest.mark.integration
@pytest.mark.asyncio
async def test_supabase_import_duplicate_instagram_skip(auth_client: object) -> None:
    _ = auth_client
    factory = get_session_factory()
    assert factory is not None
    row_other_name = {
        **SUPABASE_ROWS[0],
        "company_name": "Autre Nom Café",
        "phone": "03 26 00 00 99",
    }
    async with factory() as session:
        service = SupabasePartnerImportService(session)
        await service.run_rows("landing_partners", [SUPABASE_ROWS[0]], apply=True)
        second = await service.run_rows("landing_partners", [row_other_name], apply=True)

    assert second.imported == 0
    assert second.skipped_duplicates == 1
    assert any(
        r.reason == "duplicate_instagram_in_crm" for r in second.duplicate_rows
    )
