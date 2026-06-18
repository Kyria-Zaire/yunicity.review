"""DB-free unit guards for ADMIN-PERF-02A.

These do not require DATABASE_URL/Redis: they protect the fragile parts of the
performance work (the cockpit named count-dispatch used by asyncio.gather, and
the best-effort cache degradation when Redis is absent).
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import cast

import pytest
from app.integrations.cache import get_cached_model, set_cached_model
from app.repositories.admin_cockpit_repository import AdminCockpitRepository
from app.schemas.admin_cockpit import (
    AdminCockpitAttentionMetrics,
    AdminCockpitExecutiveMetrics,
    AdminCockpitPartnersMetrics,
    AdminCockpitPassportMetrics,
    AdminCockpitSignalsMetrics,
    AdminCockpitSummaryResponse,
    AdminCockpitTopStampPartner,
)
from app.schemas.event_readiness import TerritoryEventHealthFields
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

# Count-dispatch keys feeding asyncio.gather. "passports" is reused for both
# passports_total and passports_total_scoped; top_stamp_partner_* come from a
# dedicated task. Keep in sync with AdminCockpitRepository.fetch_counts.
EXPECTED_SPEC_KEYS = {
    "users_total",
    "users_active",
    "passports",
    "partners_total",
    "offers_total",
    "events_total",
    "creator_contents_total",
    "partner_leads_total",
    "offers_pending",
    "creator_contents_pending",
    "events_pending",
    "reports_pending",
    "partner_leads_open",
    "organizations_pending_review",
    "partner_status_active",
    "partner_status_signed",
    "partner_status_premium",
    "partner_status_founding_partner",
    "partner_status_paused",
    "org_public_with_partner",
    "org_private_with_partner",
    "org_verified_with_partner",
    "org_pending_review_with_partner",
    "stamps_total",
    "qr_stamps",
    "partner_stamps",
    "redemptions_total",
    "redemptions_completed",
    "offers_published",
    "stamps_today",
    "redemptions_today",
    "passports_last_7_days",
    "events_upcoming",
}


def test_cockpit_count_specs_match_expected_keys() -> None:
    repo = AdminCockpitRepository(cast(AsyncSession, None))
    specs = repo._build_count_specs(
        city="Reims",
        start_of_day=datetime.now(UTC),
        since_7d=datetime.now(UTC) - timedelta(days=7),
    )
    assert set(specs) == EXPECTED_SPEC_KEYS


class _Sample(BaseModel):
    value: int


@pytest.mark.asyncio
async def test_cache_degrades_gracefully_without_redis() -> None:
    # No Redis client configured in unit tests → cache must be a no-op miss.
    assert await get_cached_model("admin:test:key", _Sample) is None
    await set_cached_model("admin:test:key", _Sample(value=1), 30)
    assert await get_cached_model("admin:test:key", _Sample) is None


def _zeroed_cockpit_summary() -> AdminCockpitSummaryResponse:
    return AdminCockpitSummaryResponse(
        generated_at=datetime.now(UTC),
        city="Reims",
        executive=AdminCockpitExecutiveMetrics(
            users_total=1,
            users_active=2,
            passports_total=3,
            partners_total=4,
            offers_total=5,
            events_total=6,
            creator_contents_total=7,
            partner_leads_total=8,
        ),
        attention=AdminCockpitAttentionMetrics(
            offers_pending=1,
            creator_contents_pending=2,
            events_pending=3,
            reports_pending=4,
            partner_leads_open=5,
            organizations_pending_review=6,
        ),
        partners=AdminCockpitPartnersMetrics(
            active=1,
            signed=2,
            premium=3,
            founding_partner=4,
            paused=5,
            public=6,
            private=7,
            verified=8,
            pending_review=9,
        ),
        passport=AdminCockpitPassportMetrics(
            passports_total=3,
            stamps_total=10,
            qr_stamps=4,
            partner_stamps=6,
            redemptions_total=2,
            redemptions_completed=1,
        ),
        signals=AdminCockpitSignalsMetrics(
            offers_published=1,
            stamps_today=2,
            redemptions_today=3,
            passports_last_7_days=4,
            events_upcoming=5,
            territory_event_health=TerritoryEventHealthFields(
                status="healthy",
                upcoming_published_count=5,
                label="Agenda vivant",
                signal_emoji="🟢",
            ),
            top_stamp_partner=AdminCockpitTopStampPartner(
                organization_id=None,
                name=None,
                stamps_count=0,
            ),
        ),
    )


def test_cache_serialization_roundtrip_preserves_shape() -> None:
    # The Redis cache stores model_dump_json and rebuilds via model_validate_json.
    # This round-trip must reproduce the exact same JSON shape/values
    # (ADMIN-PERF-02A guarantee: caching never alters the response contract).
    original = _zeroed_cockpit_summary()
    restored = AdminCockpitSummaryResponse.model_validate_json(original.model_dump_json())
    assert restored == original
    assert restored.model_dump(mode="json") == original.model_dump(mode="json")
