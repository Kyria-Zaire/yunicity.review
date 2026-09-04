"""Link QA portrait video to a cultural place so « Découvrir ce lieu » → /places/{slug}."""

from __future__ import annotations

import asyncio
import uuid

from sqlalchemy import select

from app.core.config import get_settings
from app.db.seeds.qa_fixtures import CITY, _uid
from app.db.session import get_session_factory, init_db
from app.models.cultural_place import CulturalPlace
from app.models.local_video import LocalVideo
from app.models.neighborhood import Neighborhood

PLACE_ID = _uid("cultural-place-boulingrin")
PORTRAIT_VIDEO_ID = _uid("local-video-portrait")
PLACE_SLUG = "marche-du-boulingrin"
PLACE_COVER_URL = (
    "https://commons.wikimedia.org/wiki/Special:FilePath/"
    "Reims_-_halles_du_Boulingrin_(04).JPG?width=1400"
)


async def main() -> None:
    get_settings.cache_clear()
    init_db()
    sf = get_session_factory()
    assert sf is not None

    async with sf() as session:
        neighborhood_id = (
            await session.execute(
                select(Neighborhood.id)
                .where(Neighborhood.city.ilike(CITY))
                .order_by(Neighborhood.slug.asc())
                .limit(1)
            )
        ).scalar_one()

        place = await session.get(CulturalPlace, PLACE_ID)
        if place is None:
            place = CulturalPlace(
                id=PLACE_ID,
                slug=PLACE_SLUG,
                name="Marché du Boulingrin",
                short_description="Marché couvert historique au cœur de Reims.",
                description="Lieu QA pour valider le CTA Découvrir ce lieu depuis le feed vidéos.",
                city=CITY,
                neighborhood_id=neighborhood_id,
                address="50 Boulevard du Général Leclerc, 51100 Reims",
                latitude=49.2588,
                longitude=4.0325,
                category="market",
                source_name="qa-seed",
                image_url=PLACE_COVER_URL,
                hero_image_url=PLACE_COVER_URL,
                thumbnail_image_url=PLACE_COVER_URL,
                is_active=True,
                is_featured=True,
            )
            session.add(place)
            print(f"created place {PLACE_SLUG}")
        else:
            place.slug = PLACE_SLUG
            place.name = "Marché du Boulingrin"
            place.image_url = PLACE_COVER_URL
            place.hero_image_url = PLACE_COVER_URL
            place.thumbnail_image_url = PLACE_COVER_URL
            place.is_active = True
            print(f"updated place {PLACE_SLUG}")

        await session.flush()

        video = await session.get(LocalVideo, PORTRAIT_VIDEO_ID)
        if video is None:
            raise SystemExit(f"portrait video missing: {PORTRAIT_VIDEO_ID}")

        video.cultural_place_id = place.id
        video.video_type = "bon_plan"
        print(f"linked video {video.id} -> place {place.slug}")

        await session.commit()
        print(f"href=/places/{place.slug}")


if __name__ == "__main__":
    asyncio.run(main())
