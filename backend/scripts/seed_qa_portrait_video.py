"""One-shot: ensure QA has landscape + portrait local videos for desktop mockup check."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
from pathlib import Path

from app.core.config import get_settings
from app.core.local_video_constants import LocalVideoType
from app.db.seeds.qa_fixtures import CITY, QA_MEDIA_PUBLIC_PREFIX, _png_16_9, _uid
from app.db.session import get_session_factory, init_db
from app.models.local_video import LocalVideo
from app.models.neighborhood import Neighborhood
from app.models.user_profile import UserProfile
from sqlalchemy import select


def _write_media(filename_stem: str, *, width: int, height: int) -> tuple[str, str, Path, Path]:
    settings = get_settings()
    base_url = (settings.local_video_public_base_url or "http://localhost:8010").rstrip("/")
    media_url = f"{base_url}{QA_MEDIA_PUBLIC_PREFIX}/{filename_stem}.mp4"
    thumbnail_url = f"{base_url}{QA_MEDIA_PUBLIC_PREFIX}/{filename_stem}.png"
    media_dir = Path(settings.media_upload_dir) / "qa"
    media_dir.mkdir(parents=True, exist_ok=True)
    mp4_path = media_dir / f"{filename_stem}.mp4"
    png_path = media_dir / f"{filename_stem}.png"
    mp4_path.write_bytes(bytes([0, 0, 0, 24]) + b"ftypmp42")
    png_path.write_bytes(_png_16_9(width, height))
    return media_url, thumbnail_url, mp4_path, png_path


async def main() -> None:
    init_db()
    sf = get_session_factory()
    assert sf is not None
    now = datetime.now(UTC)

    async with sf() as session:
        profile = (
            await session.execute(
                select(UserProfile).where(UserProfile.username == "qa_citizen_a")
            )
        ).scalar_one()
        neighborhood_id = (
            await session.execute(
                select(Neighborhood.id)
                .where(Neighborhood.city.ilike(CITY))
                .order_by(Neighborhood.slug.asc())
                .limit(1)
            )
        ).scalar_one()

        landscape_id = _uid("local-video")
        portrait_id = _uid("local-video-portrait")

        landscape_media, landscape_thumb, landscape_mp4, landscape_png = _write_media(
            "qa-sample-video", width=320, height=180
        )
        portrait_media, portrait_thumb, portrait_mp4, portrait_png = _write_media(
            "qa-sample-video-portrait", width=180, height=320
        )
        print("media_files", landscape_mp4, landscape_png, portrait_mp4, portrait_png)

        landscape = await session.get(LocalVideo, landscape_id)
        if landscape is None:
            session.add(
                LocalVideo(
                    id=landscape_id,
                    author_user_id=profile.user_id,
                    city=CITY,
                    neighborhood_id=neighborhood_id,
                    video_type=LocalVideoType.LIEU.value,
                    title="QA Vidéo locale",
                    description="Vidéo locale QA paysage (placeholder filesystem).",
                    storage_key="qa/qa-sample-video.mp4",
                    media_url=landscape_media,
                    thumbnail_url=landscape_thumb,
                    duration_seconds=12.0,
                    media_width=1920,
                    media_height=1080,
                    file_size_bytes=8,
                    mime_type="video/mp4",
                    status="published",
                    published_at=now - timedelta(days=1),
                )
            )
            print(f"created landscape {landscape_id}")
        else:
            landscape.media_width = 1920
            landscape.media_height = 1080
            landscape.media_url = landscape_media
            landscape.thumbnail_url = landscape_thumb
            landscape.status = "published"
            print(f"updated landscape {landscape_id} -> 1920x1080")

        portrait = await session.get(LocalVideo, portrait_id)
        if portrait is None:
            session.add(
                LocalVideo(
                    id=portrait_id,
                    author_user_id=profile.user_id,
                    city=CITY,
                    neighborhood_id=neighborhood_id,
                    video_type=LocalVideoType.BON_PLAN.value,
                    title="3 adresses à tester ce week-end à Reims",
                    description="Parcours QA portrait pour valider la carte split desktop.",
                    storage_key="qa/qa-sample-video-portrait.mp4",
                    media_url=portrait_media,
                    thumbnail_url=portrait_thumb,
                    duration_seconds=18.0,
                    media_width=1080,
                    media_height=1920,
                    file_size_bytes=8,
                    mime_type="video/mp4",
                    status="published",
                    published_at=now - timedelta(hours=3),
                    latitude=49.2583,
                    longitude=4.0317,
                )
            )
            print(f"created portrait {portrait_id}")
        else:
            portrait.media_width = 1080
            portrait.media_height = 1920
            portrait.media_url = portrait_media
            portrait.thumbnail_url = portrait_thumb
            portrait.title = "3 adresses à tester ce week-end à Reims"
            portrait.description = (
                "Parcours QA portrait pour valider la carte split desktop."
            )
            portrait.status = "published"
            portrait.published_at = now - timedelta(hours=3)
            print(f"updated portrait {portrait_id} -> 1080x1920")

        await session.commit()

        rows = (
            await session.execute(
                select(
                    LocalVideo.id,
                    LocalVideo.title,
                    LocalVideo.media_width,
                    LocalVideo.media_height,
                    LocalVideo.status,
                ).order_by(LocalVideo.published_at.desc())
            )
        ).all()
        for row in rows:
            print(row)


if __name__ == "__main__":
    asyncio.run(main())
