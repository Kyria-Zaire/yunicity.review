"""Local territorial memory stamps (TICKET-504)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest
from app.core.local_stamp_constants import LocalStampSlug
from app.core.passport_constants import PartnerOfferType
from app.db.session import get_engine
from app.models.local_stamp import CitizenLocalStamp, StampDefinition
from app.models.passport import PartnerOffer
from app.repositories.local_stamp_repository import LocalStampRepository
from app.services.local_stamp_service import LocalStampService
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_passport import (
    activate_passport,
    auth_header,
    create_verified_org_with_offer,
    register_user,
)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_stamp_definitions_seeded(auth_client: AsyncClient) -> None:
    del auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        repo = LocalStampRepository(session)
        definition = await repo.get_definition_by_slug(LocalStampSlug.FIRST_SCAN_VALIDATED)
        assert definition is not None
        assert definition.slug == LocalStampSlug.FIRST_SCAN_VALIDATED.value


@pytest.mark.integration
@pytest.mark.asyncio
async def test_redeem_awards_memory_stamp(auth_client: AsyncClient, auth_env: None) -> None:
    del auth_env
    data = await register_user(auth_client, suffix="-stamp-memory")
    await activate_passport(auth_client, data["access_token"])

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        _, offer = await create_verified_org_with_offer(
            session, slug_suffix="stamp-mem", offer_title="Café découverte"
        )
        offer_id = offer.id
        await session.commit()

    redeem = await auth_client.post(
        f"/api/v1/passport/offers/{offer_id}/redeem",
        headers=auth_header(data["access_token"]),
    )
    assert redeem.status_code == 200

    stamps = await auth_client.get(
        "/api/v1/passport/stamps",
        headers=auth_header(data["access_token"]),
    )
    assert stamps.status_code == 200
    body = stamps.json()
    assert body["total"] >= 1
    kinds = {item["kind"] for item in body["items"]}
    assert "memory" in kinds
    memory = next(i for i in body["items"] if i["kind"] == "memory")
    assert memory["human_line"]
    assert memory["city"] == "Reims"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_redeem_does_not_duplicate_memory_stamps(
    auth_client: AsyncClient, auth_env: None
) -> None:
    del auth_env
    """Second redemption at same org must not duplicate per-org memory stamp."""
    data = await register_user(auth_client, suffix="-stamp-dedup")
    passport = await activate_passport(auth_client, data["access_token"])
    user_id = passport["user_id"]

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org, offer_a = await create_verified_org_with_offer(
            session, slug_suffix="dedup", offer_title="Offre A"
        )
        offer_b = PartnerOffer(
            organization_id=org.id,
            title="Offre B",
            description="Autre offre",
            offer_type=PartnerOfferType.DRINK,
            status=offer_a.status,
            is_active=offer_a.is_active,
        )
        session.add(offer_b)
        await session.flush()
        offer_a_id = offer_a.id
        offer_b_id = offer_b.id
        await session.commit()

    headers = auth_header(data["access_token"])
    redeem_a = await auth_client.post(
        f"/api/v1/passport/offers/{offer_a_id}/redeem",
        headers=headers,
    )
    assert redeem_a.status_code == 200
    redeem_b = await auth_client.post(
        f"/api/v1/passport/offers/{offer_b_id}/redeem",
        headers=headers,
    )
    assert redeem_b.status_code == 200

    async with factory() as session:
        result = await session.execute(
            select(CitizenLocalStamp).where(CitizenLocalStamp.user_id == uuid.UUID(user_id))
        )
        rows = list(result.scalars().all())
        repo = LocalStampRepository(session)
        place_def = await repo.get_definition_by_slug(LocalStampSlug.FIRST_LOCAL_PLACE)
        assert place_def is not None
        place_rows = [r for r in rows if r.stamp_definition_id == place_def.id]
        assert len(place_rows) == 1


def test_human_line_includes_city() -> None:
    definition = StampDefinition(
        id=uuid.uuid4(),
        slug=LocalStampSlug.FIRST_FLASH_MEMORY.value,
        title="Souvenir flash",
        description="Test",
        icon="flash",
        trigger_type="test",
    )
    stamp = CitizenLocalStamp(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        stamp_definition_id=definition.id,
        city="Reims",
        earned_at=datetime.now(UTC),
        metadata_={},
    )
    line = LocalStampService.human_line(stamp, definition)
    assert "Reims" in line
