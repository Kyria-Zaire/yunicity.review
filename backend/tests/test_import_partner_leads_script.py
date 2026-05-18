"""Tests for controlled partner lead import script."""

from __future__ import annotations

from pathlib import Path

import pytest
from app.db.session import get_session_factory
from app.services.partner_lead_import import (
    BLOCKED_TRIBU_NAMES,
    PartnerLeadImportError,
    PartnerLeadImportService,
    count_organizations,
    count_partner_leads,
    load_import_file,
)

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

FIXTURES = Path(__file__).resolve().parent / "fixtures"
SAMPLE_FILE = FIXTURES / "partner_leads_import_sample.json"
PHYSICAL_FILE = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "partner_leads"
    / "physical_partners_reims_2026.json"
)


@pytest.mark.asyncio
async def test_physical_partners_file_has_no_tribus() -> None:
    rows = load_import_file(PHYSICAL_FILE)
    names = [str(row["name"]).strip().lower() for row in rows]
    for blocked in BLOCKED_TRIBU_NAMES:
        assert blocked not in names
    for name in names:
        assert not name.startswith("tribu ")


@pytest.mark.asyncio
async def test_load_import_file_invalid_json(tmp_path: Path) -> None:
    bad = tmp_path / "bad.json"
    bad.write_text("{ not json", encoding="utf-8")
    with pytest.raises(PartnerLeadImportError, match="JSON invalide"):
        load_import_file(bad)


@pytest.mark.asyncio
async def test_import_dry_run_creates_nothing(auth_client: object) -> None:
    _ = auth_client
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        before = await count_partner_leads(session)
        service = PartnerLeadImportService(session)
        summary = await service.run_from_file(SAMPLE_FILE, apply=False)
        after = await count_partner_leads(session)

    assert summary.dry_run is True
    assert summary.valid == 2
    assert summary.created == 0
    assert before == after


@pytest.mark.asyncio
async def test_import_apply_creates_leads(auth_client: object) -> None:
    _ = auth_client
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        org_before = await count_organizations(session)
        service = PartnerLeadImportService(session)
        summary = await service.run_from_file(SAMPLE_FILE, apply=True)
        lead_count = await count_partner_leads(session)
        org_after = await count_organizations(session)

    assert summary.created == 2
    assert summary.valid == 2
    assert lead_count >= 2
    assert org_before == org_after


@pytest.mark.asyncio
async def test_import_apply_is_idempotent(auth_client: object) -> None:
    _ = auth_client
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        service = PartnerLeadImportService(session)
        first = await service.run_from_file(SAMPLE_FILE, apply=True)
        count_after_first = await count_partner_leads(session)
        second = await service.run_from_file(SAMPLE_FILE, apply=True)
        count_after_second = await count_partner_leads(session)

    assert first.created == 2
    assert second.created == 0
    assert second.skipped_duplicates == 2
    assert count_after_first == count_after_second


@pytest.mark.asyncio
async def test_import_status_and_source_defaults(auth_client: object) -> None:
    from app.models.partner_lead import PartnerLead
    from sqlalchemy import select

    _ = auth_client
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        service = PartnerLeadImportService(session)
        await service.run_from_file(SAMPLE_FILE, apply=True)
        result = await session.execute(
            select(PartnerLead).where(PartnerLead.name == "Import Test Café")
        )
        lead = result.scalar_one()

    assert lead.source == "physical_prospecting"
    assert lead.status == "signed"
    assert lead.city == "Reims"
    assert lead.converted_organization_id is None


@pytest.mark.asyncio
async def test_import_blocks_tribu_row(auth_client: object) -> None:
    _ = auth_client
    rows = [
        {
            "name": "Tribu Sport",
            "city": "Reims",
            "source": "physical_prospecting",
            "status": "signed",
        }
    ]
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        service = PartnerLeadImportService(session)
        summary = await service.run_rows(rows, apply=True)
        count = await count_partner_leads(session)

    assert summary.invalid == 1
    assert summary.created == 0
    assert "blocked_tribu_name" in summary.issues[0].errors
    assert count == 0


@pytest.mark.asyncio
async def test_physical_file_row_count_and_signed_status(auth_env: None) -> None:
    rows = load_import_file(PHYSICAL_FILE)
    assert len(rows) == 14
    for row in rows:
        assert row["status"] == "signed"
        assert row["source"] == "physical_prospecting"


@pytest.mark.asyncio
async def test_physical_import_apply_all_partners(auth_client: object) -> None:
    _ = auth_client
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        org_before = await count_organizations(session)
        service = PartnerLeadImportService(session)
        summary = await service.run_from_file(PHYSICAL_FILE, apply=True)
        org_after = await count_organizations(session)

    assert summary.created == 14
    assert summary.invalid == 0
    assert org_before == org_after
