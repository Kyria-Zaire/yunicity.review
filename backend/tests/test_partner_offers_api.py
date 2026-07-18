"""Public partner offers API tests (WEB-PARTNERS-03)."""

from __future__ import annotations

import asyncio
import os
import uuid
from collections.abc import AsyncGenerator, Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from app.core.config import get_settings
from app.core.passport_constants import PartnerOfferStatus, PartnerOfferType
from app.db.seeds.reims_partner_offers import REIMS_PARTNER_OFFERS_SEED, seed_reims_partner_offers
from app.db.seeds.reims_signed_partners import seed_reims_signed_partners
from app.db.session import dispose_db, get_session_factory, init_db
from app.main import create_app
from app.models.passport import PartnerOffer
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select, text

_INTERNAL_KEYS = frozenset(
    {
        "max_redemptions_total",
        "max_redemptions_per_passport",
        "redemption_count",
        "created_by_user_id",
        "moderated_by_user_id",
        "rejection_reason",
        "metadata",
    }
)


BACKEND_ROOT = Path(__file__).resolve().parents[1]


def _database_url() -> str | None:
    return os.environ.get("DATABASE_URL")


def _upgrade_db_for_partner_offers() -> None:
    cfg = Config(str(BACKEND_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    try:
        command.upgrade(cfg, "20260606_0027")
    except Exception:
        pass


async def _ensure_partner_offer_catalog_columns() -> None:
    """Idempotent — recette DB may be stamped past 0027 without catalog columns."""
    session_factory = get_session_factory()
    if session_factory is None:
        return
    statements = (
        "ALTER TABLE partner_offers ADD COLUMN IF NOT EXISTS slug VARCHAR(120)",
        "ALTER TABLE partner_offers ADD COLUMN IF NOT EXISTS value_label VARCHAR(120)",
        "ALTER TABLE partner_offers ADD COLUMN IF NOT EXISTS conditions TEXT",
        (
            "ALTER TABLE partner_offers ADD COLUMN IF NOT EXISTS "
            "is_featured BOOLEAN NOT NULL DEFAULT false"
        ),
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_partner_offers_slug ON partner_offers (slug)",
    )
    async with session_factory() as session:
        for stmt in statements:
            await session.execute(text(stmt))
        await session.commit()


@pytest.fixture
def offers_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    database_url = _database_url()
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip partner offers integration tests")
    monkeypatch.setenv("DATABASE_URL", database_url)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
async def offers_client(offers_env: None) -> AsyncGenerator[AsyncClient, None]:
    await asyncio.to_thread(_upgrade_db_for_partner_offers)
    settings = get_settings()
    init_db(settings)
    await _ensure_partner_offer_catalog_columns()
    application = create_app()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    await dispose_db()


@pytest.fixture
async def offers_ready(offers_client: AsyncClient) -> AsyncGenerator[None, None]:
    session_factory = get_session_factory()
    if session_factory is None:
        pytest.skip("Database session factory not configured")
    async with session_factory() as session:
        await seed_reims_signed_partners(session)
        await seed_reims_partner_offers(session)
        await session.commit()
    yield


@pytest.mark.integration
async def test_seed_offers_idempotent(offers_env: None) -> None:
    await asyncio.to_thread(_upgrade_db_for_partner_offers)
    settings = get_settings()
    init_db(settings)
    await _ensure_partner_offer_catalog_columns()
    session_factory = get_session_factory()
    if session_factory is None:
        pytest.skip("Database session factory not configured")
    async with session_factory() as session:
        await seed_reims_signed_partners(session)
        await seed_reims_partner_offers(session)
        await session.commit()
        count_first = await session.scalar(
            select(func.count()).select_from(PartnerOffer).where(PartnerOffer.slug.is_not(None))
        )
    async with session_factory() as session:
        await seed_reims_partner_offers(session)
        await session.commit()
        count_second = await session.scalar(
            select(func.count()).select_from(PartnerOffer).where(PartnerOffer.slug.is_not(None))
        )
    assert count_first == count_second
    assert count_second is not None
    assert count_second >= len(REIMS_PARTNER_OFFERS_SEED)


@pytest.mark.integration
async def test_public_catalog_lists_active_offers(
    offers_client: AsyncClient,
    offers_ready: None,
) -> None:
    response = await offers_client.get(
        "/api/v1/partner-offers",
        params={"city": "Reims", "limit": 50},
    )
    assert response.status_code == 200
    body = response.json()
    slugs = {item["slug"] for item in body["items"]}
    assert "belga-queen-premiere-biere" in slugs
    assert "pittaya-entree-offerte" in slugs
    assert "centre-des-ressources-atelier-silver" in slugs
    assert "garcon-barbiers-coupe-soin-gold" in slugs
    for item in body["items"]:
        assert "partner" in item
        assert item["partner"]["slug"]
        assert item["value_label"]
        for key in _INTERNAL_KEYS:
            assert key not in item


@pytest.mark.integration
async def test_partner_slug_offers_endpoint(
    offers_client: AsyncClient,
    offers_ready: None,
) -> None:
    response = await offers_client.get(
        "/api/v1/partners/pittaya/offers",
        params={"city": "Reims"},
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) >= 1
    assert all(item["partner"]["slug"] == "pittaya" for item in items)


@pytest.mark.integration
async def test_signed_only_partner_has_no_public_offers(
    offers_client: AsyncClient,
    offers_ready: None,
) -> None:
    response = await offers_client.get(
        "/api/v1/partners/daiboken/offers",
        params={"city": "Reims"},
    )
    assert response.status_code == 404


@pytest.mark.integration
async def test_expired_offer_not_visible(
    offers_client: AsyncClient,
    offers_ready: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None
    offer_id = uuid.UUID("d6043000-0000-4000-8000-000000000001")
    async with session_factory() as session:
        offer = await session.get(PartnerOffer, offer_id)
        assert offer is not None
        offer.valid_until = datetime.now(UTC) - timedelta(days=1)
        await session.commit()

    response = await offers_client.get(
        "/api/v1/partner-offers",
        params={"city": "Reims", "partner_slug": "belga-queen", "limit": 50},
    )
    assert response.status_code == 200
    assert response.json()["items"] == []


@pytest.mark.integration
async def test_inactive_offer_not_visible(
    offers_client: AsyncClient,
    offers_ready: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None
    offer_id = uuid.UUID("d6043000-0000-4000-8000-000000000002")
    async with session_factory() as session:
        offer = await session.get(PartnerOffer, offer_id)
        assert offer is not None
        offer.is_active = False
        offer.status = PartnerOfferStatus.DRAFT
        await session.commit()

    response = await offers_client.get(
        "/api/v1/partner-offers",
        params={"city": "Reims", "partner_slug": "pittaya", "limit": 50},
    )
    assert response.status_code == 200
    assert response.json()["items"] == []


@pytest.mark.integration
async def test_featured_filter(
    offers_client: AsyncClient,
    offers_ready: None,
) -> None:
    response = await offers_client.get(
        "/api/v1/partner-offers",
        params={"city": "Reims", "featured": True, "limit": 50},
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) >= 2
    assert all(item["is_featured"] for item in items)


@pytest.mark.integration
async def test_offer_type_filter(
    offers_client: AsyncClient,
    offers_ready: None,
) -> None:
    # REIMS_PARTNER_OFFERS_SEED carries one offer per type (VIP, GIFT, EVENT_ACCESS,
    # DISCOUNT) and none of type CUSTOM, so filter on a type the seed actually has and
    # assert the filter is honoured, rather than a count the seed cannot satisfy.
    response = await offers_client.get(
        "/api/v1/partner-offers",
        params={"city": "Reims", "type": PartnerOfferType.DISCOUNT.value, "limit": 50},
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert items
    assert all(item["offer_type"] == PartnerOfferType.DISCOUNT.value for item in items)
