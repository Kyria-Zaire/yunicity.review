"""Reims pilot tribes seed (TICKET-A.2)."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.feed_constants import PostAuthorType, PostType
from app.core.tribe_constants import TribeCategory, TribeMemberRole, TribeVisibility
from app.db.seeds.reims_demo_content import DEMO_CITIZEN_2_ID, DEMO_CITIZEN_ID
from app.models.post import Post
from app.models.tribe import Tribe, TribeMember
from app.models.user import User

logger = logging.getLogger(__name__)

REIMS_CITY = "Reims"

TRIBE_SEED: tuple[dict[str, object], ...] = (
    {
        "id": uuid.UUID("e6010000-0000-4000-8000-000000000001"),
        "slug": "running-reims",
        "name": "Running Reims",
        "description": (
            "Sorties douces le dimanche — parcours accessibles, rythme convivial, sans compétition."
        ),
        "category": TribeCategory.SPORT_LOCAL.value,
        "visibility": TribeVisibility.PUBLIC.value,
        "is_featured": True,
    },
    {
        "id": uuid.UUID("e6010000-0000-4000-8000-000000000002"),
        "slug": "photographes-urbains",
        "name": "Photographes urbains",
        "description": (
            "Lumières de Reims, balades photo et partage calme — pas de likes compulsifs."
        ),
        "category": TribeCategory.PHOTOGRAPHY.value,
        "visibility": TribeVisibility.PUBLIC.value,
        "is_featured": True,
    },
    {
        "id": uuid.UUID("e6010000-0000-4000-8000-000000000003"),
        "slug": "cafes-lecture",
        "name": "Cafés & lecture",
        "description": "Rencontres autour d'un café et d'un livre — un coin tranquille à Reims.",
        "category": TribeCategory.CAFE_CULTURE.value,
        "visibility": TribeVisibility.PUBLIC.value,
        "is_featured": True,
    },
    {
        "id": uuid.UUID("e6010000-0000-4000-8000-000000000004"),
        "slug": "benevoles-associatifs",
        "name": "Bénévoles associatifs",
        "description": (
            "Coordination légère pour les actions solidaires locales — "
            "sur invitation des associations partenaires."
        ),
        "category": TribeCategory.VOLUNTEERING.value,
        "visibility": TribeVisibility.PRIVATE_INVITE.value,
        "is_featured": False,
    },
    {
        "id": uuid.UUID("e6010000-0000-4000-8000-000000000005"),
        "slug": "musique-locale",
        "name": "Musique locale",
        "description": "Jam acoustique, concerts de quartier et entraide entre musicien·ne·s.",
        "category": TribeCategory.MUSIC.value,
        "visibility": TribeVisibility.PUBLIC.value,
        "is_featured": False,
    },
)

DEMO_POST_TRIBE_1 = uuid.UUID("e6020000-0000-4000-8000-000000000001")
DEMO_POST_TRIBE_2 = uuid.UUID("e6020000-0000-4000-8000-000000000002")


async def _user_exists(session: AsyncSession, user_id: uuid.UUID) -> bool:
    result = await session.execute(select(User.id).where(User.id == user_id).limit(1))
    return result.scalar_one_or_none() is not None


async def seed_reims_tribes(session: AsyncSession) -> None:
    """Idempotent pilot tribes for QA (requires demo users when seeding posts)."""
    if not await _user_exists(session, DEMO_CITIZEN_ID):
        logger.warning("reims_tribes_skip: demo users missing — run seeds --demo first")
        return
    now = datetime.now(UTC)
    tribe_by_slug: dict[str, Tribe] = {}

    for row in TRIBE_SEED:
        slug = str(row["slug"])
        result = await session.execute(
            select(Tribe.id).where(Tribe.city == REIMS_CITY, Tribe.slug == slug).limit(1)
        )
        if result.scalar_one_or_none() is not None:
            existing = await session.execute(
                select(Tribe).where(Tribe.city == REIMS_CITY, Tribe.slug == slug)
            )
            tribe_by_slug[slug] = existing.scalar_one()
            continue
        tribe_id = row["id"]
        assert isinstance(tribe_id, uuid.UUID)
        tribe = Tribe(
            id=tribe_id,
            slug=slug,
            name=str(row["name"]),
            description=str(row["description"]),
            city=REIMS_CITY,
            category=str(row["category"]),
            visibility=str(row["visibility"]),
            created_by_user_id=DEMO_CITIZEN_ID,
            is_featured=bool(row.get("is_featured", False)),
        )
        session.add(tribe)
        await session.flush()
        session.add(
            TribeMember(
                tribe_id=tribe.id,
                user_id=DEMO_CITIZEN_ID,
                role=TribeMemberRole.OWNER.value,
                joined_at=now,
                charter_accepted_at=now,
            )
        )
        tribe_by_slug[slug] = tribe

    await _ensure_demo_posts(session, tribe_by_slug)
    await session.flush()
    logger.info("reims_tribes_seed_completed", extra={"city": REIMS_CITY})


async def _ensure_demo_posts(session: AsyncSession, tribes: dict[str, Tribe]) -> None:
    running = tribes.get("running-reims")
    photo = tribes.get("photographes-urbains")
    if running is None or photo is None:
        return

    posts = (
        (
            DEMO_POST_TRIBE_1,
            running.id,
            DEMO_CITIZEN_ID,
            "Prochaine sortie dimanche 9h — place Drouet d'Erlon, allure tranquille.",
        ),
        (
            DEMO_POST_TRIBE_2,
            photo.id,
            DEMO_CITIZEN_2_ID,
            "Coucher de soleil sur la cathédrale hier — qui est partant pour une balade photo ?",
        ),
    )
    for post_id, tribe_id, author_id, body in posts:
        exists = await session.execute(select(Post.id).where(Post.id == post_id).limit(1))
        if exists.scalar_one_or_none() is not None:
            continue
        session.add(
            Post(
                id=post_id,
                author_type=PostAuthorType.CITIZEN.value,
                author_id=author_id,
                type=PostType.POST.value,
                city=None,
                tribe_id=tribe_id,
                body=body,
                is_active=True,
            )
        )
