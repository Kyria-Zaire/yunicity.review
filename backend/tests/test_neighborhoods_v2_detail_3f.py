"""QUARTIER-01 phase 3f — detail API : 6 colonnes 3a + landmarks (image+crédit) + tags→tribus.

Le seed ne pose pas l'image/crédit des cultural_places (rempli par l'upload R2 en prod) : le
test les simule sur porte-de-paris pour prouver que l'attribution CC BY-SA circule bien jusqu'à
la réponse détail (jamais l'image sans son crédit). La résolution tag→tribus est vérifiée avec
une tribu publique de catégorie `sport` ; les tags sans tribu restent honnêtement vides.
"""

from __future__ import annotations

import uuid

import pytest
from app.core.tribe_constants import TribeVisibility
from app.db.seeds.reims_cultural_places import seed_reims_cultural_places
from app.db.seeds.reims_neighborhood_community_tags import seed_reims_neighborhood_community_tags
from app.db.seeds.reims_neighborhood_landmarks import seed_reims_neighborhood_landmarks
from app.db.session import get_engine
from app.models.cultural_place import CulturalPlace
from app.models.tribe import Tribe
from app.models.user import User
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

_LIFE_COLUMNS = (
    "audience",
    "neighborhood_type",
    "local_life",
    "green_spaces",
    "mobility",
    "daily_life",
)
_PORTE_IMAGE = "https://media.yunicity.city/places/reims/porte-de-paris/cover.jpg"
_PORTE_CREDIT = "Mathieu Kappler / CC BY-SA 4.0 via Wikimedia Commons"
_PORTE_LICENSE = "CC BY-SA 4.0"


async def _factory() -> async_sessionmaker[AsyncSession]:
    engine = get_engine()
    assert engine is not None
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def _seed_3f(session: AsyncSession) -> None:
    # Lieux culturels d'abord (les landmarks les referencent), puis tags + landmarks des 3 crees.
    await seed_reims_cultural_places(session)
    await seed_reims_neighborhood_community_tags(session)
    await seed_reims_neighborhood_landmarks(session)
    # Simule l'image + attribution que l'upload R2 pose en prod, pour verifier qu'elles circulent.
    await session.execute(
        update(CulturalPlace)
        .where(CulturalPlace.slug == "porte-de-paris")
        .values(
            hero_image_url=_PORTE_IMAGE,
            photo_credit=_PORTE_CREDIT,
            image_license=_PORTE_LICENSE,
        )
    )
    author = User(
        email=f"tribe-owner-{uuid.uuid4().hex[:8]}@example.com",
        hashed_password="hashed",
        full_name="Tribe Owner",
        city="Reims",
    )
    session.add(author)
    await session.flush()
    session.add(
        Tribe(
            slug="reims-runners",
            name="Reims Runners",
            description="Club de course à pied rémois.",
            city="Reims",
            category="sport",
            visibility=TribeVisibility.PUBLIC.value,
            created_by_user_id=author.id,
        )
    )


@pytest.fixture
async def seeded_3f(auth_client: AsyncClient) -> AsyncClient:
    factory = await _factory()
    async with factory() as session:
        await _seed_3f(session)
        await session.commit()
    return auth_client


async def test_detail_exposes_life_landmarks_and_tags(seeded_3f: AsyncClient) -> None:
    response = await seeded_3f.get("/api/v1/neighborhoods/courlancy", params={"city": "Reims"})
    assert response.status_code == 200, response.text
    body = response.json()

    # Les 6 colonnes 3a (courlancy les a via 3e), exposees au top-level.
    for column in _LIFE_COLUMNS:
        assert body[column], f"{column} vide"

    # Landmarks ordonnes + attribution qui circule jusqu'a la reponse.
    landmarks = body["landmarks"]
    assert [lm["slug"] for lm in landmarks] == ["porte-de-paris", "stade-auguste-delaune"]
    porte = landmarks[0]
    assert porte["hero_image_url"] == _PORTE_IMAGE
    assert porte["photo_credit"] == _PORTE_CREDIT
    assert porte["image_license"] == _PORTE_LICENSE

    # Tags communautes ordonnes ; sport resout la tribu publique, sante reste honnetement vide.
    community_tags = body["community_tags"]
    assert [t["slug"] for t in community_tags] == ["sport", "sante", "famille"]
    by_slug = {t["slug"]: t for t in community_tags}
    assert [tr["slug"] for tr in by_slug["sport"]["tribes"]] == ["reims-runners"]
    assert by_slug["sante"]["tribes"] == []
    assert by_slug["famille"]["tribes"] == []


async def test_detail_chatillons_no_landmarks_but_tags(seeded_3f: AsyncClient) -> None:
    response = await seeded_3f.get("/api/v1/neighborhoods/chatillons", params={"city": "Reims"})
    assert response.status_code == 200, response.text
    body = response.json()
    # chatillons : aucun cultural_place source -> aucun landmark, mais tags + editorial presents.
    assert body["landmarks"] == []
    assert [t["slug"] for t in body["community_tags"]] == ["association", "sport", "famille"]
    assert body["audience"]


async def test_list_stays_lightweight_without_tags_or_landmarks(seeded_3f: AsyncClient) -> None:
    # La liste ne resout PAS les tribus (couteux) et n'eager-load pas tags/landmarks : tout vide,
    # 6 colonnes None (include_editorial=False). Garde-fou contre une regression de perf.
    response = await seeded_3f.get(
        "/api/v1/neighborhoods", params={"city": "Reims", "page_size": 50}
    )
    assert response.status_code == 200
    item = next(i for i in response.json()["items"] if i["slug"] == "courlancy")
    assert item["community_tags"] == []
    assert item["landmarks"] == []
    assert item["audience"] is None
