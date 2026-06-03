"""Activation waves seed tests (ADMIN-02C-A)."""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncGenerator

import pytest
from app.core.activation_wave_constants import CHECKLIST_V1_KEYS
from app.db.base import Base
from app.db.seeds.reims_activation_waves import (
    REIMS_ACTIVATION_WAVES_SEED,
    WAVE_1_ID,
    WAVE_1_PARTNERS,
    WAVE_2_ID,
    WAVE_2_PARTNERS,
    seed_reims_activation_waves,
)
from app.db.seeds.reims_signed_partners import seed_reims_signed_partners
from app.models.activation_wave import ActivationWave, ActivationWaveItem
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

pytestmark = pytest.mark.integration


def _database_url() -> str | None:
    return os.environ.get("DATABASE_URL")


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    database_url = _database_url()
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip activation waves seed tests")

    engine = create_async_engine(database_url, pool_pre_ping=True)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_seed_creates_two_waves(db_session: AsyncSession) -> None:
    await seed_reims_activation_waves(db_session)
    await db_session.commit()

    result = await db_session.execute(
        select(ActivationWave).order_by(ActivationWave.sort_order),
    )
    waves = result.scalars().all()
    assert len(waves) == 2
    assert {wave.id for wave in waves} == {WAVE_1_ID, WAVE_2_ID}


@pytest.mark.asyncio
async def test_seed_creates_wave1_items(db_session: AsyncSession) -> None:
    await seed_reims_activation_waves(db_session)
    await db_session.commit()

    count = await db_session.scalar(
        select(func.count())
        .select_from(ActivationWaveItem)
        .where(ActivationWaveItem.wave_id == WAVE_1_ID)
    )
    assert count == len(WAVE_1_PARTNERS)


@pytest.mark.asyncio
async def test_seed_creates_wave2_items(db_session: AsyncSession) -> None:
    await seed_reims_activation_waves(db_session)
    await db_session.commit()

    count = await db_session.scalar(
        select(func.count())
        .select_from(ActivationWaveItem)
        .where(ActivationWaveItem.wave_id == WAVE_2_ID)
    )
    assert count == len(WAVE_2_PARTNERS)


@pytest.mark.asyncio
async def test_seed_is_idempotent(db_session: AsyncSession) -> None:
    await seed_reims_activation_waves(db_session)
    await db_session.commit()
    wave_count_first = await db_session.scalar(select(func.count()).select_from(ActivationWave))
    item_count_first = await db_session.scalar(select(func.count()).select_from(ActivationWaveItem))

    await seed_reims_activation_waves(db_session)
    await db_session.commit()
    wave_count_second = await db_session.scalar(select(func.count()).select_from(ActivationWave))
    item_count_second = await db_session.scalar(
        select(func.count()).select_from(ActivationWaveItem),
    )

    assert wave_count_first == wave_count_second == 2
    assert item_count_first == item_count_second == 9


@pytest.mark.asyncio
async def test_seed_does_not_create_organizations(db_session: AsyncSession) -> None:
    org_count_before = await db_session.scalar(select(func.count()).select_from(Organization)) or 0
    await seed_reims_activation_waves(db_session)
    await db_session.commit()
    org_count_after = await db_session.scalar(select(func.count()).select_from(Organization)) or 0
    assert org_count_before == org_count_after


@pytest.mark.asyncio
async def test_seed_does_not_create_partner_profiles(db_session: AsyncSession) -> None:
    profile_count_before = (
        await db_session.scalar(select(func.count()).select_from(PartnerProfile)) or 0
    )
    await seed_reims_activation_waves(db_session)
    await db_session.commit()
    profile_count_after = (
        await db_session.scalar(select(func.count()).select_from(PartnerProfile)) or 0
    )
    assert profile_count_before == profile_count_after


@pytest.mark.asyncio
async def test_checklist_has_five_v1_keys(db_session: AsyncSession) -> None:
    await seed_reims_activation_waves(db_session)
    await db_session.commit()

    items = (await db_session.execute(select(ActivationWaveItem))).scalars().all()
    assert items
    for item in items:
        assert set(item.checklist.keys()) == set(CHECKLIST_V1_KEYS)
        assert all(item.checklist[key] is False for key in CHECKLIST_V1_KEYS)


@pytest.mark.asyncio
async def test_unique_city_code_enforced(db_session: AsyncSession) -> None:
    await seed_reims_activation_waves(db_session)
    await db_session.commit()

    duplicate = ActivationWave(
        id=uuid.uuid4(),
        city="Reims",
        code="reims-wave-1",
        name="Duplicate wave",
        status="draft",
        sort_order=99,
    )
    db_session.add(duplicate)
    with pytest.raises(IntegrityError):
        await db_session.flush()


@pytest.mark.asyncio
async def test_items_keep_snapshots_without_organizations(db_session: AsyncSession) -> None:
    await seed_reims_activation_waves(db_session)
    await db_session.commit()

    items = (await db_session.execute(select(ActivationWaveItem))).scalars().all()
    assert len(items) == 9
    for item in items:
        assert item.partner_name_snapshot
        assert item.partner_slug_snapshot
        assert item.organization_id is None
        assert item.partner_profile_id is None
        assert item.notes and "absente" in item.notes.lower()


@pytest.mark.asyncio
async def test_seed_links_existing_orgs_when_signed_partners_present(
    db_session: AsyncSession,
) -> None:
    await seed_reims_signed_partners(db_session)
    await seed_reims_activation_waves(db_session)
    await db_session.commit()

    belga_item = await db_session.scalar(
        select(ActivationWaveItem).where(
            ActivationWaveItem.partner_slug_snapshot == "belga-queen",
        )
    )
    assert belga_item is not None
    assert belga_item.organization_id is not None
    assert belga_item.partner_profile_id is not None
    assert belga_item.status == "activated"
    assert belga_item.notes is None

    marcel_item = await db_session.scalar(
        select(ActivationWaveItem).where(
            ActivationWaveItem.partner_slug_snapshot == "marcel-et-jane",
        )
    )
    assert marcel_item is not None
    assert marcel_item.status == "candidate"


@pytest.mark.asyncio
async def test_signed_partners_seed_does_not_change_partner_status(
    db_session: AsyncSession,
) -> None:
    await seed_reims_signed_partners(db_session)
    await db_session.commit()
    status_stmt = select(
        PartnerProfile.partner_status,
        PartnerProfile.organization_id,
    )
    statuses_before = (await db_session.execute(status_stmt)).all()

    await seed_reims_activation_waves(db_session)
    await db_session.commit()

    statuses_after = (await db_session.execute(status_stmt)).all()
    assert statuses_before == statuses_after


@pytest.mark.asyncio
async def test_wave_codes_match_seed_definition(db_session: AsyncSession) -> None:
    await seed_reims_activation_waves(db_session)
    await db_session.commit()

    codes = (
        await db_session.execute(select(ActivationWave.code).order_by(ActivationWave.sort_order))
    ).scalars().all()
    expected = [entry["code"] for entry in REIMS_ACTIVATION_WAVES_SEED]
    assert codes == expected
