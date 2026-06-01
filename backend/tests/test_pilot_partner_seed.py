"""Pilot partner seed tests (WEB-PARTNERS-08A)."""

from __future__ import annotations

import os
import uuid
from collections.abc import Iterator

import pytest
from app.core.config import get_settings
from app.core.feed_constants import PostType
from app.core.organization_constants import OrganizationMemberRole, OrganizationMemberStatus
from app.db.seeds.reims_partner_events import REIMS_PARTNER_EVENTS_SEED, seed_reims_partner_events
from app.db.seeds.reims_pilot_partner_memberships import (
    REIMS_PILOT_PARTNER_ACCOUNTS_SEED,
    seed_reims_pilot_partner_memberships,
)
from app.db.seeds.reims_pilot_partner_public_data import REIMS_PILOT_PARTNER_PUBLIC_DATA
from app.db.seeds.reims_signed_partners import seed_reims_signed_partners
from app.db.session import get_session_factory, init_db
from app.models.organization import Organization, OrganizationMember
from app.repositories.post_repository import PostRepository
from app.services.partner_service import PartnerService
from sqlalchemy import select

BELGA_ORG_ID = uuid.UUID("d6040000-0000-4000-8000-000000000009")
BELGA_EVENT_ID = uuid.UUID("d6050000-0000-4000-8000-000000000001")


def _database_url() -> str | None:
    return os.environ.get("DATABASE_URL")


@pytest.fixture
def pilot_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    database_url = _database_url()
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip pilot partner seed tests")
    monkeypatch.setenv("DATABASE_URL", database_url)
    get_settings.cache_clear()
    init_db(get_settings())
    yield
    get_settings.cache_clear()


@pytest.mark.integration
@pytest.mark.anyio
async def test_pilot_public_data_has_coordinates_for_all_pilots() -> None:
    for slug, fields in REIMS_PILOT_PARTNER_PUBLIC_DATA.items():
        assert fields.get("address"), slug
        assert fields.get("latitude") is not None, slug
        assert fields.get("longitude") is not None, slug
        assert fields.get("website"), slug


@pytest.mark.integration
@pytest.mark.anyio
async def test_signed_partners_seed_enriches_belga_location(pilot_env: None) -> None:
    session_factory = get_session_factory()
    if session_factory is None:
        pytest.skip("Database session factory not configured")
    async with session_factory() as session:
        await seed_reims_signed_partners(session)
        await session.commit()
    async with session_factory() as session:
        org = await session.get(Organization, BELGA_ORG_ID)
        assert org is not None
        assert org.latitude is not None
        assert org.longitude is not None
        assert org.address is not None
        assert "Erlon" in org.address


@pytest.mark.integration
@pytest.mark.anyio
async def test_pilot_memberships_idempotent(pilot_env: None) -> None:
    session_factory = get_session_factory()
    if session_factory is None:
        pytest.skip("Database session factory not configured")
    pilot_user_ids = [entry["user_id"] for entry in REIMS_PILOT_PARTNER_ACCOUNTS_SEED]
    async with session_factory() as session:
        await seed_reims_signed_partners(session)
        await seed_reims_pilot_partner_memberships(session)
        await session.commit()
    async with session_factory() as session:
        await seed_reims_pilot_partner_memberships(session)
        await session.commit()
        members = (
            await session.execute(
                select(OrganizationMember).where(
                    OrganizationMember.user_id.in_(pilot_user_ids),
                    OrganizationMember.role == OrganizationMemberRole.OWNER,
                    OrganizationMember.status == OrganizationMemberStatus.ACTIVE,
                )
            )
        ).scalars().all()
    assert len(members) == len(REIMS_PILOT_PARTNER_ACCOUNTS_SEED)


@pytest.mark.integration
@pytest.mark.anyio
async def test_partner_events_seed_syncs_feed_posts(pilot_env: None) -> None:
    session_factory = get_session_factory()
    if session_factory is None:
        pytest.skip("Database session factory not configured")
    async with session_factory() as session:
        await seed_reims_signed_partners(session)
        await seed_reims_partner_events(session)
        await session.commit()
    async with session_factory() as session:
        posts = PostRepository(session)
        for entry in REIMS_PARTNER_EVENTS_SEED:
            post = await posts.get_by_local_event_id(entry["id"])
            assert post is not None, entry["id"]
            assert post.type == PostType.EVENT.value
            assert post.is_active is True


@pytest.mark.integration
@pytest.mark.anyio
async def test_partner_service_exposes_belga_coordinates(pilot_env: None) -> None:
    session_factory = get_session_factory()
    if session_factory is None:
        pytest.skip("Database session factory not configured")
    async with session_factory() as session:
        await seed_reims_signed_partners(session)
        await session.commit()
    async with session_factory() as session:
        detail = await PartnerService(session).get_public_by_slug(
            city="Reims",
            slug="belga-queen",
        )
    assert detail.latitude is not None
    assert detail.longitude is not None
    assert detail.address is not None
