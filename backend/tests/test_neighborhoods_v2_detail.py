"""Quartiers V2 living detail tests (FEATURE-QUARTIERS-V2 / Q2-S1-03)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from app.core.local_event_constants import (
    LocalEventModerationStatus,
    LocalEventVisibility,
)
from app.core.local_video_constants import LocalVideoStatus, LocalVideoType
from app.core.neighborhood_v2_constants import NeighborhoodContributionStatus
from app.core.organization_constants import (
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.passport_constants import PartnerOfferStatus, PartnerOfferType
from app.db.seeds.reims_cultural_places import seed_reims_cultural_places
from app.db.session import get_engine
from app.models.cultural_place import CulturalPlace
from app.models.local_event import LocalEvent
from app.models.local_video import LocalVideo
from app.models.neighborhood import Neighborhood
from app.models.neighborhood_editorial import NeighborhoodContribution
from app.models.organization import Organization
from app.models.passport import PartnerOffer
from app.models.user import User
from app.services.neighborhood_v2_presenter import slugify_alias_name
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


async def _session_factory() -> async_sessionmaker[AsyncSession]:
    engine = get_engine()
    assert engine is not None
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def _hood_id(session: AsyncSession, slug: str) -> uuid.UUID:
    hood = (
        await session.execute(
            select(Neighborhood).where(
                Neighborhood.city == "Reims",
                Neighborhood.slug == slug,
            )
        )
    ).scalar_one()
    return hood.id


async def _create_author(session: AsyncSession) -> uuid.UUID:
    user = User(
        email=f"hood-detail-{uuid.uuid4().hex[:8]}@example.com",
        hashed_password="hashed",
        full_name="Detail Author",
        city="Reims",
    )
    session.add(user)
    await session.flush()
    return user.id


@pytest.fixture
async def boulingrin_detail_data(auth_client: AsyncClient) -> None:
    _ = auth_client
    factory = await _session_factory()
    async with factory() as session:
        author_id = await _create_author(session)
        await _seed_boulingrin_detail_fixtures(session, author_id)
        await session.commit()


async def _seed_boulingrin_detail_fixtures(session: AsyncSession, author_id: uuid.UUID) -> None:
    hood_id = await _hood_id(session, "boulingrin")
    await seed_reims_cultural_places(session)

    session.add(
        CulturalPlace(
            slug="marche-boulingrin-detail-test",
            name="Marché Boulingrin",
            short_description="Lieu emblématique du quartier.",
            city="Reims",
            neighborhood_id=hood_id,
            address="34 Rue de Mars",
            latitude=49.2598,
            longitude=4.0275,
            category="market",
            image_url="https://cdn.test/halles-boulingrin.jpg",
            source_name="test",
            is_active=True,
        )
    )

    now = datetime.now(UTC)
    for index in range(4):
        session.add(
            LocalVideo(
                author_user_id=author_id,
                city="Reims",
                neighborhood_id=hood_id,
                video_type=LocalVideoType.QUARTIER.value,
                title=f"Vidéo Boulingrin {index + 1}",
                storage_key=f"local-video/test/reims/{author_id}/v{index}/source.mp4",
                media_url=f"https://cdn.test/v{index}.mp4",
                thumbnail_url=f"https://cdn.test/v{index}.jpg",
                duration_seconds=10.0 + index,
                file_size_bytes=4096,
                mime_type="video/mp4",
                status=LocalVideoStatus.PUBLISHED.value,
                published_at=now - timedelta(hours=index),
            )
        )

    org = Organization(
        slug="boulingrin-detail-org",
        name="Org Boulingrin",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PUBLIC,
        neighborhood_id=hood_id,
    )
    session.add(org)
    await session.flush()

    session.add(
        LocalEvent(
            organization_id=org.id,
            created_by_user_id=author_id,
            title="Marché du samedi",
            city="Reims",
            starts_at=now + timedelta(days=2),
            location_name="Halles du Boulingrin",
            moderation_status=LocalEventModerationStatus.APPROVED.value,
            visibility=LocalEventVisibility.PUBLIC.value,
            neighborhood_id=hood_id,
        )
    )
    session.add(
        LocalEvent(
            organization_id=org.id,
            created_by_user_id=author_id,
            title="Événement passé",
            city="Reims",
            starts_at=now - timedelta(days=1),
            location_name="Boulingrin",
            moderation_status=LocalEventModerationStatus.APPROVED.value,
            visibility=LocalEventVisibility.PUBLIC.value,
            neighborhood_id=hood_id,
        )
    )

    session.add(
        PartnerOffer(
            organization_id=org.id,
            title="Café offert",
            description="Une pause gourmande.",
            offer_type=PartnerOfferType.DISCOUNT.value,
            status=PartnerOfferStatus.PUBLISHED.value,
            is_active=True,
            neighborhood_id=hood_id,
        )
    )

    session.add(
        NeighborhoodContribution(
            neighborhood_id=hood_id,
            author_user_id=author_id,
            body=(
                "Les halles du samedi matin, c'est notre rendez-vous "
                "en famille depuis des années."
            ),
            title="Notre rituel",
            status=NeighborhoodContributionStatus.APPROVED.value,
            display_identity_label="Camille R.",
            passport_verified_snapshot=False,
            approved_at=datetime.now(UTC),
        )
    )
    session.add(
        NeighborhoodContribution(
            neighborhood_id=hood_id,
            author_user_id=author_id,
            body="En attente de modération — ne doit pas apparaître dans le détail public.",
            status=NeighborhoodContributionStatus.PENDING.value,
        )
    )


@pytest.mark.asyncio
async def test_neighborhood_detail_hero_aliases_moods(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods/boulingrin",
        params={"city": "Reims"},
    )
    assert response.status_code == 200, response.text
    body = response.json()

    assert body["slug"] == "boulingrin"
    assert body["hero"]["display_name"] == "Boulingrin"
    assert body["hero"]["official_label"] == "Quartier officiel"
    assert body["hero"]["aliases"][0]["name"] == "Halles du Boulingrin"
    assert body["hero"]["aliases"][0]["slug"] == slugify_alias_name("Halles du Boulingrin")
    assert "gourmet" in body["hero"]["moods"]
    assert body["aliases"]
    assert body["moods"]


@pytest.mark.asyncio
async def test_neighborhood_detail_history_and_timeline(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods/boulingrin",
        params={"city": "Reims"},
    )
    assert response.status_code == 200
    body = response.json()

    assert body["history"]["long_story"]
    assert body["history"]["featured_quote"] == "Le cœur gourmand de Reims."
    assert len(body["timeline"]) >= 3
    pairs = [(entry["display_order"], entry["year"]) for entry in body["timeline"]]
    assert pairs == sorted(pairs)


@pytest.mark.asyncio
async def test_neighborhood_detail_max_three_videos(
    auth_client: AsyncClient,
    boulingrin_detail_data: None,
) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods/boulingrin",
        params={"city": "Reims"},
    )
    assert response.status_code == 200
    videos = response.json()["videos"]
    assert len(videos) == 3
    assert all(v["thumbnail_url"] for v in videos)
    assert all(v["neighborhood_slug"] == "boulingrin" for v in videos)
    assert all("author" in v for v in videos)
    assert "media_url" not in videos[0]


@pytest.mark.asyncio
async def test_neighborhood_detail_places_linked(
    auth_client: AsyncClient,
    boulingrin_detail_data: None,
) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods/boulingrin",
        params={"city": "Reims"},
    )
    assert response.status_code == 200
    places = response.json()["places"]
    assert places
    assert any(p["slug"] == "marche-boulingrin-detail-test" for p in places)
    assert all({"id", "slug", "name", "category", "is_partner"} <= set(p) for p in places)


@pytest.mark.asyncio
async def test_neighborhood_detail_upcoming_events_only(
    auth_client: AsyncClient,
    boulingrin_detail_data: None,
) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods/boulingrin",
        params={"city": "Reims"},
    )
    assert response.status_code == 200
    events = response.json()["events"]
    assert len(events) == 1
    assert events[0]["title"] == "Marché du samedi"


@pytest.mark.asyncio
async def test_neighborhood_detail_excludes_pending_contributions(
    auth_client: AsyncClient,
    boulingrin_detail_data: None,
) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods/boulingrin",
        params={"city": "Reims"},
    )
    assert response.status_code == 200
    body = response.json()
    contributions = body["contributions"]
    assert len(contributions) == 1
    assert contributions[0]["title"] == "Notre rituel"
    assert contributions[0]["author_label"] == "Camille R."
    assert contributions[0]["approved_at"] is not None
    assert contributions[0]["passport_verified_snapshot"] is False
    assert "modération" not in contributions[0]["body"].lower()


@pytest.mark.asyncio
async def test_neighborhood_detail_stats_coherent(
    auth_client: AsyncClient,
    boulingrin_detail_data: None,
) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods/boulingrin",
        params={"city": "Reims"},
    )
    assert response.status_code == 200
    body = response.json()
    stats = body["stats"]

    assert stats["videos_count"] >= 4
    assert stats["places_count"] >= len(body["places"])
    assert stats["events_count"] >= len(body["events"])
    assert stats["contributions_count"] == 1
    assert stats["tribes_count"] == 0
    assert stats["creators_count"] == 0
    assert len(body["videos"]) <= 3
    assert len(body["passport_offers"]) >= 1


@pytest.mark.asyncio
async def test_neighborhood_detail_unknown_slug_404(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods/quartier-inexistant",
        params={"city": "Reims"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_neighborhoods_stays_lightweight(auth_client: AsyncClient) -> None:
    response = await auth_client.get(
        "/api/v1/neighborhoods",
        params={"city": "Reims", "page_size": 50},
    )
    assert response.status_code == 200
    item = next(i for i in response.json()["items"] if i["slug"] == "boulingrin")
    assert item["aliases"] == []
    assert item["moods"] == []
    assert item["timeline"] == []
    assert item["long_story"] is None
    assert "hero" not in item
    assert "stats" not in item
