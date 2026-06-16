"""Production signed partners catalog seed tests (FEATURE-PROD-DATA-05 / 05D)."""

from __future__ import annotations

import logging
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.core.config import Settings
from app.core.partner_assets import (
    DEMO_PARTNER_SLUGS,
    partner_seed_banner_url,
    partner_seed_logo_url,
)
from app.core.partner_constants import PartnerStatus
from app.core.passport_stamp_qr import STAMP_QR_TOKEN_TYPE, decode_stamp_qr_token
from app.db.seeds.reims_partner_offers import REIMS_PARTNER_OFFERS_SEED
from app.db.seeds.reims_partners_catalog import (
    REIMS_PARTNER_OFFERS_COUNT,
    REIMS_SIGNED_PARTNER_COUNT,
    seed_reims_partners_catalog,
)
from app.db.seeds.reims_pilot_partner_public_data import PILOT_PARTNER_SLUGS
from app.db.seeds.reims_signed_partners import (
    REIMS_SIGNED_PARTNER_SLUGS,
    REIMS_SIGNED_PARTNERS_SEED,
    seed_reims_signed_partners,
)
from app.db.session import get_engine
from app.main import create_app
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile
from app.models.passport import PartnerOffer
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker


def _prod_settings() -> Settings:
    return Settings(
        APP_ENV="prod",
        DATABASE_URL="postgresql+asyncpg://yunicity:yunicity@localhost:5434/yunicity_test",
        REDIS_URL="redis://localhost:6379/0",
        DEBUG=False,
        JWT_SECRET_KEY="x" * 48,
        REFRESH_TOKEN_PEPPER="y" * 32,
        REFRESH_COOKIE_SECURE=True,
        WEB_FRONTEND_URL="https://yunicity.city",
        CORS_ORIGINS=["https://yunicity.city"],
        MEDIA_PUBLIC_BASE_URL="https://api.yunicity.city",
        EMAIL_PROVIDER="console",
    )


def test_partner_seed_logo_url_prod() -> None:
    url = partner_seed_logo_url(
        "belga-queen",
        app_env="prod",
        web_frontend_url="https://yunicity.city",
    )
    assert url == "https://yunicity.city/partners/reims/belga-queen/logo.svg"
    assert "localhost" not in url
    assert "/seed/" not in url


def test_partner_seed_banner_url_prod() -> None:
    url = partner_seed_banner_url(
        "pittaya",
        app_env="prod",
        web_frontend_url="https://yunicity.city",
    )
    assert url == "https://yunicity.city/partners/reims/pittaya/banner.svg"


def test_signed_partner_slugs_match_seed_entries() -> None:
    seed_slugs = {entry["slug"] for entry in REIMS_SIGNED_PARTNERS_SEED}
    assert set(REIMS_SIGNED_PARTNER_SLUGS) == seed_slugs
    assert len(REIMS_SIGNED_PARTNER_SLUGS) == REIMS_SIGNED_PARTNER_COUNT == 14
    assert not seed_slugs.intersection(DEMO_PARTNER_SLUGS)


def test_partner_offers_reference_signed_orgs_only() -> None:
    signed_org_ids = {entry["organization_id"] for entry in REIMS_SIGNED_PARTNERS_SEED}
    signed_slugs = set(REIMS_SIGNED_PARTNER_SLUGS)
    for offer in REIMS_PARTNER_OFFERS_SEED:
        assert offer["organization_id"] in signed_org_ids
        assert offer["org_slug"] in signed_slugs
    assert len(REIMS_PARTNER_OFFERS_SEED) == REIMS_PARTNER_OFFERS_COUNT == 4


@pytest.mark.asyncio
async def test_reims_signed_partners_seed_logging_does_not_crash() -> None:
    logging.basicConfig(level=logging.INFO, force=True)
    settings = _prod_settings()

    async def mock_execute(_stmt: object) -> MagicMock:
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        result.all.return_value = []
        return result

    session = AsyncMock()
    session.execute = mock_execute
    session.get = AsyncMock(return_value=None)
    session.add = MagicMock()
    session.flush = AsyncMock()

    created, updated = await seed_reims_signed_partners(session, settings=settings)

    assert created == REIMS_SIGNED_PARTNER_COUNT
    assert updated == 0


async def _delete_catalog_partners(session: AsyncSession) -> None:
    org_ids = (
        await session.execute(
            select(Organization.id).where(Organization.slug.in_(REIMS_SIGNED_PARTNER_SLUGS))
        )
    ).scalars().all()
    if org_ids:
        await session.execute(
            delete(PartnerOffer).where(PartnerOffer.organization_id.in_(org_ids))
        )
        await session.execute(
            delete(PartnerProfile).where(PartnerProfile.organization_id.in_(org_ids))
        )
        await session.execute(delete(Organization).where(Organization.id.in_(org_ids)))
    await session.flush()


@pytest.mark.asyncio
@pytest.mark.integration
async def test_prod_partners_catalog_seed_creates_fourteen() -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip partners catalog integration tests")
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = _prod_settings()
    async with factory() as session:
        await _delete_catalog_partners(session)
        result = await seed_reims_partners_catalog(session, settings)
        await session.commit()

        profile_count = (
            await session.execute(
                select(func.count())
                .select_from(PartnerProfile)
                .join(Organization, PartnerProfile.organization_id == Organization.id)
                .where(Organization.slug.in_(REIMS_SIGNED_PARTNER_SLUGS))
            )
        ).scalar_one()
        offer_count = (
            await session.execute(
                select(func.count())
                .select_from(PartnerOffer)
                .join(Organization, PartnerOffer.organization_id == Organization.id)
                .where(Organization.slug.in_(REIMS_SIGNED_PARTNER_SLUGS))
            )
        ).scalar_one()

    assert result.partners_signed == REIMS_SIGNED_PARTNER_COUNT == 14
    assert profile_count == 14
    assert result.offers_total == REIMS_PARTNER_OFFERS_COUNT == 4
    assert offer_count == 4
    assert result.partners_created == 14


@pytest.mark.asyncio
@pytest.mark.integration
async def test_prod_partners_catalog_seed_idempotent() -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip partners catalog integration tests")
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = _prod_settings()
    async with factory() as session:
        await _delete_catalog_partners(session)
        first = await seed_reims_partners_catalog(session, settings)
        await session.commit()
        second = await seed_reims_partners_catalog(session, settings)
        await session.commit()

    assert first.partners_created == 14
    assert second.partners_created == 0
    assert second.partners_updated == 14
    assert second.offers_created == 0
    assert second.offers_updated == 4


@pytest.mark.asyncio
@pytest.mark.integration
async def test_prod_partners_catalog_no_duplicate_slugs() -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip partners catalog integration tests")
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = _prod_settings()
    async with factory() as session:
        await _delete_catalog_partners(session)
        await seed_reims_partners_catalog(session, settings)
        await session.commit()
        rows = (
            await session.execute(
                select(Organization.slug, func.count())
                .where(Organization.slug.in_(REIMS_SIGNED_PARTNER_SLUGS))
                .group_by(Organization.slug)
            )
        ).all()

    assert len(rows) == REIMS_SIGNED_PARTNER_COUNT
    assert all(count == 1 for _, count in rows)


@pytest.mark.asyncio
@pytest.mark.integration
async def test_prod_partners_catalog_excludes_demo_partners() -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip partners catalog integration tests")
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = _prod_settings()
    async with factory() as session:
        await _delete_catalog_partners(session)
        await seed_reims_partners_catalog(session, settings)
        await session.commit()
        demo_count = (
            await session.execute(
                select(func.count())
                .select_from(Organization)
                .where(Organization.slug.in_(DEMO_PARTNER_SLUGS))
            )
        ).scalar_one()

    assert demo_count == 0


@pytest.mark.asyncio
@pytest.mark.integration
async def test_prod_partners_catalog_prod_media_urls() -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip partners catalog integration tests")
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = _prod_settings()
    async with factory() as session:
        await _delete_catalog_partners(session)
        await seed_reims_partners_catalog(session, settings)
        await session.commit()
        rows = (
            await session.execute(
                select(Organization).where(Organization.slug.in_(PILOT_PARTNER_SLUGS))
            )
        ).scalars().all()

    assert len(rows) == len(PILOT_PARTNER_SLUGS)
    for org in rows:
        expected_logo = partner_seed_logo_url(
            org.slug,
            app_env="prod",
            web_frontend_url="https://yunicity.city",
        )
        expected_banner = partner_seed_banner_url(
            org.slug,
            app_env="prod",
            web_frontend_url="https://yunicity.city",
        )
        assert org.logo_url == expected_logo
        assert org.banner_url == expected_banner
        assert "localhost" not in (org.logo_url or "")
        assert "/seed/" not in (org.logo_url or "")


@pytest.mark.asyncio
@pytest.mark.integration
async def test_prod_partners_catalog_stamp_qr_coherent() -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip partners catalog integration tests")
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = _prod_settings()
    async with factory() as session:
        await _delete_catalog_partners(session)
        await seed_reims_partners_catalog(session, settings)
        await session.commit()
        row = (
            await session.execute(
                select(PartnerProfile, Organization)
                .join(Organization, PartnerProfile.organization_id == Organization.id)
                .where(Organization.slug == "belga-queen")
            )
        ).one()
        profile, org = row

    assert profile.partner_status == PartnerStatus.ACTIVE
    from app.core.passport_stamp_qr import generate_stamp_qr_token

    token, _ = generate_stamp_qr_token(
        organization_id=str(org.id),
        partner_profile_id=str(profile.id),
        settings=settings,
    )
    payload = decode_stamp_qr_token(token, settings=settings)
    assert payload["typ"] == STAMP_QR_TOKEN_TYPE
    assert payload["organization_id"] == str(org.id)
    assert payload["partner_profile_id"] == str(profile.id)


@pytest.mark.asyncio
@pytest.mark.integration
async def test_api_lists_public_partners_after_catalog_seed() -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip partners catalog integration tests")
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = _prod_settings()
    async with factory() as session:
        await _delete_catalog_partners(session)
        await seed_reims_partners_catalog(session, settings)
        await session.commit()

    application = create_app()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/partners",
            params={"city": "Reims", "limit": 50},
        )
    assert response.status_code == 200, response.text
    slugs = {item["slug"] for item in response.json()["items"]}
    assert slugs == set(PILOT_PARTNER_SLUGS)
    assert "daiboken" not in slugs
    assert "cafe-du-centre-reims" not in slugs


@pytest.mark.asyncio
@pytest.mark.integration
async def test_api_partner_offers_after_catalog_seed() -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip partners catalog integration tests")
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = _prod_settings()
    async with factory() as session:
        await _delete_catalog_partners(session)
        await seed_reims_partners_catalog(session, settings)
        await session.commit()

    application = create_app()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/partners/belga-queen/offers",
            params={"city": "Reims"},
        )
    assert response.status_code == 200, response.text
    offers = response.json()["items"]
    assert len(offers) == 1
    assert offers[0]["slug"] == "belga-queen-accueil-passport"
    assert offers[0]["is_active"] is True
