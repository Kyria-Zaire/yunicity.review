"""Deterministic, idempotent QA fixtures (C3-F0-T1).

Builds the minimal citizen-facing dataset the future E2E baseline (T3) needs.
Guarantees:
- **deterministic**: stable UUIDs (uuid5) and stable natural keys, so a re-seed
  without reset never duplicates (existing rows are skipped by primary key).
- **relative dates**: every timestamp derives from a single ``reference_now``
  (UTC, timezone-aware) captured once per run.
- **no external effect**: no email/push/payment/R2/webhook; the sample video is a
  tiny local placeholder written under the temp media dir.
- **no capacity/remaining-seats** semantics (absent from the model, forbidden).

Notification rows here are seeded **for rendering only**; business-generated
notifications are a T3 concern and are not produced here.
Passport is seeded as a **deterministic state only** — no progression action.
"""

from __future__ import annotations

import logging
import uuid
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.feed_constants import PostAuthorType, PostType
from app.core.local_event_constants import (
    LocalEventModerationStatus,
    LocalEventVisibility,
)
from app.core.local_video_constants import LocalVideoType
from app.core.organization_constants import (
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.partner_constants import PartnershipType, PartnerStatus
from app.core.passport_constants import (
    PartnerOfferStatus,
    PartnerOfferType,
    PassportStatus,
    PassportTierCode,
)
from app.core.neighborhood_v2_constants import NeighborhoodContributionStatus
from app.core.security import hash_password
from app.core.social_notification_constants import SocialNotificationType
from app.core.tribe_constants import TribeCategory, TribeMemberRole, TribeVisibility
from app.db.seeds.passport_tiers import seed_passport_tiers
from app.db.seeds.qa_video_media import (
    QA_LANDSCAPE_SPEC,
    QA_LANDSCAPE_THUMB_NAME,
    QA_LANDSCAPE_VIDEO_NAME,
    QA_PORTRAIT_SPEC,
    QA_PORTRAIT_THUMB_NAME,
    QA_PORTRAIT_VIDEO_NAME,
    ensure_qa_sample_video,
)
from app.db.seeds.reims_neighborhoods import seed_reims_neighborhoods
from app.models.local_event import EventInterest, LocalEvent
from app.models.local_video import LocalVideo
from app.models.neighborhood import Neighborhood
from app.models.neighborhood_editorial import NeighborhoodContribution
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile
from app.models.passport import PartnerOffer, Passport, PassportTier
from app.models.post import Post
from app.models.tribe import Tribe, TribeMember
from app.models.user import User
from app.models.user_notification import UserNotification
from app.models.user_profile import ProfileVisibility, UserProfile

logger = logging.getLogger(__name__)

CITY = "Reims"
_QA_PASSWORD = "StrongPassword1!"  # dev-only, QA fixtures — never a real credential
_FIXTURE_NAMESPACE = uuid.UUID("0f0a1c30-0000-4000-8000-00000000f0a1")


def _uid(name: str) -> uuid.UUID:
    """Stable UUID for a fixture logical name (idempotency by primary key)."""
    return uuid.uuid5(_FIXTURE_NAMESPACE, name)


@dataclass(frozen=True)
class SeedReport:
    reference_now: datetime
    counts: dict[str, int]


async def _get_or_add[ModelT](
    session: AsyncSession,
    model: type[ModelT],
    entity_id: uuid.UUID,
    factory: Callable[..., ModelT],
) -> bool:
    """Add ``factory()`` only if no row with ``entity_id`` exists. Returns True if created."""
    existing = await session.get(model, entity_id)
    if existing is not None:
        return False
    session.add(factory())
    return True


async def _upsert_sortir_event(
    session: AsyncSession,
    entity_id: uuid.UUID,
    factory: Callable[[], LocalEvent],
) -> bool:
    """Create or refresh Sortir immersion events so ``starts_at`` stays « ce soir ».

    Idempotent get-or-add is not enough: a re-seed on a later day would leave
    yesterday's wall-clock and empty the « Ce soir » rail. Refresh schedule +
    copy fields that drive the desktop grid (type, cover, location).
    """
    existing = await session.get(LocalEvent, entity_id)
    fresh = factory()
    if existing is None:
        session.add(fresh)
        return True
    existing.title = fresh.title
    existing.description = fresh.description
    existing.event_type = fresh.event_type
    existing.city = fresh.city
    existing.district = fresh.district
    existing.starts_at = fresh.starts_at
    existing.ends_at = fresh.ends_at
    existing.location_name = fresh.location_name
    existing.neighborhood_id = fresh.neighborhood_id
    existing.cover_image_url = fresh.cover_image_url
    existing.organization_id = fresh.organization_id
    existing.address = fresh.address
    existing.latitude = fresh.latitude
    existing.longitude = fresh.longitude
    existing.visibility = fresh.visibility
    existing.moderation_status = fresh.moderation_status
    existing.is_cancelled = False
    return False


async def _resolve_neighborhood_id_by_slug(session: AsyncSession, slug: str) -> uuid.UUID:
    result = await session.execute(
        select(Neighborhood.id).where(
            func.lower(Neighborhood.city) == CITY.lower(),
            Neighborhood.slug == slug,
        ).limit(1)
    )
    neighborhood_id = result.scalar_one_or_none()
    if neighborhood_id is None:
        raise RuntimeError(f"QA seed requires Reims neighborhood slug={slug!r}")
    return neighborhood_id


async def _resolve_neighborhood_id(session: AsyncSession) -> uuid.UUID:
    result = await session.execute(
        select(Neighborhood.id)
        .where(func.lower(Neighborhood.city) == CITY.lower())
        .order_by(Neighborhood.slug.asc())
        .limit(1)
    )
    neighborhood_id = result.scalar_one_or_none()
    if neighborhood_id is None:
        raise RuntimeError("QA seed requires at least one Reims neighborhood")
    return neighborhood_id


async def _resolve_basic_tier_id(session: AsyncSession) -> uuid.UUID:
    result = await session.execute(
        select(PassportTier.id).where(PassportTier.code == PassportTierCode.BASIC.value).limit(1)
    )
    tier_id = result.scalar_one_or_none()
    if tier_id is None:
        raise RuntimeError("QA seed requires the passport tier catalog")
    return tier_id


#: Prefixe public du montage `StaticFiles` de `app.main` (`/media`).
QA_MEDIA_PUBLIC_PREFIX = "/media/qa"


def _png_16_9(width: int = 320, height: int = 180) -> bytes:
    """Build a DECODABLE placeholder image, 16:9, with the stdlib only.

    C3-FEED-M7 : the previous placeholder carried only SOI+EOI (four bytes) and
    no frame. It was served with a 200 and `image/jpeg`, yet no browser can
    decode it, so the Feed rendered a broken image icon. A fixture must produce
    an asset the product can actually display; PNG is generated here because the
    stdlib ships a deflate encoder and no JPEG one. No dependency, no external
    asset, no FFmpeg.
    """
    import struct
    import zlib

    def chunk(kind: bytes, data: bytes) -> bytes:
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    row = bytes([0]) + bytes((90, 110, 255)) * width
    return (
        bytes([137, 80, 78, 71, 13, 10, 26, 10])
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(row * height, 9))
        + chunk(b"IEND", b"")
    )


def _write_sortir_cover_png(filename: str, *, width: int = 640, height: int = 360, rgb: tuple[int, int, int] = (40, 60, 120)) -> str:
    """Write a local cover image for Sortir QA events; return public /media URL."""
    settings = get_settings()
    base_url = (settings.local_video_public_base_url or "").rstrip("/")
    public_url = f"{base_url}{QA_MEDIA_PUBLIC_PREFIX}/{filename}"
    try:
        media_dir = Path(settings.media_upload_dir) / "qa"
        media_dir.mkdir(parents=True, exist_ok=True)
        import struct
        import zlib

        def chunk(kind: bytes, data: bytes) -> bytes:
            body = kind + data
            return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

        header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
        row = bytes([0]) + bytes(rgb) * width
        png = (
            bytes([137, 80, 78, 71, 13, 10, 26, 10])
            + chunk(b"IHDR", header)
            + chunk(b"IDAT", zlib.compress(row * height, 9))
            + chunk(b"IEND", b"")
        )
        (media_dir / filename).write_bytes(png)
    except OSError as exc:  # pragma: no cover
        logger.warning("qa_sortir_cover_skip", extra={"error": str(exc), "file": filename})
    return public_url


def _tonight_at(now: datetime, hour: int, minute: int = 0) -> datetime:
    """Same calendar day as ``now``, at the given Europe/Paris wall-clock.

    Seeds used to stamp UTC hour=19 → displayed as 21:00 in Paris. Immersion
    mockups need the label times (19:30, 18:00, …) the citizen actually reads.
    """
    local = now.astimezone(ZoneInfo("Europe/Paris"))
    return local.replace(hour=hour, minute=minute, second=0, microsecond=0)


def _write_placeholder_video() -> tuple[str, str, str, str]:
    """Write landscape + portrait placeholder media under the temp media dir.

    Returns (landscape_media, landscape_thumb, portrait_media, portrait_thumb).
    Best-effort: on failure we still return URLs so the DB rows are created.

    C3-FEED-M7 : the URLs used to omit the `/media` segment while the files were
    written under `media_upload_dir` -- exactly what `app.mount("/media",
    StaticFiles(...))` serves. Both the thumbnail and the video answered 404.
    The public prefix now names the mount point, so the fixture can no longer
    describe a route that does not exist.
    """
    settings = get_settings()
    base_url = (settings.local_video_public_base_url or "").rstrip("/")
    landscape_media = f"{base_url}{QA_MEDIA_PUBLIC_PREFIX}/qa-sample-video.mp4"
    landscape_thumb = f"{base_url}{QA_MEDIA_PUBLIC_PREFIX}/qa-sample-video.png"
    portrait_media = f"{base_url}{QA_MEDIA_PUBLIC_PREFIX}/qa-sample-video-portrait.mp4"
    portrait_thumb = f"{base_url}{QA_MEDIA_PUBLIC_PREFIX}/qa-sample-video-portrait.png"
    try:
        media_dir = Path(settings.media_upload_dir) / "qa"
        media_dir.mkdir(parents=True, exist_ok=True)
        ensure_qa_sample_video(media_dir / QA_LANDSCAPE_VIDEO_NAME, QA_LANDSCAPE_SPEC)
        ensure_qa_sample_video(media_dir / QA_PORTRAIT_VIDEO_NAME, QA_PORTRAIT_SPEC)
        (media_dir / QA_LANDSCAPE_THUMB_NAME).write_bytes(_png_16_9(320, 180))
        (media_dir / QA_PORTRAIT_THUMB_NAME).write_bytes(_png_16_9(180, 320))
    except (OSError, RuntimeError) as exc:  # pragma: no cover - filesystem edge
        logger.warning("qa_video_placeholder_skip", extra={"error": str(exc)})
    return landscape_media, landscape_thumb, portrait_media, portrait_thumb


async def seed_qa_fixtures(
    session: AsyncSession,
    *,
    reference_now: datetime | None = None,
) -> SeedReport:
    """Seed the full QA dataset idempotently. Assumes migrations already ran."""
    now = reference_now or datetime.now(UTC)
    if now.tzinfo is None:
        raise ValueError("reference_now must be timezone-aware")

    # Base catalogs (idempotent) required by FKs.
    await seed_passport_tiers(session)
    await seed_reims_neighborhoods(session)
    await session.flush()

    neighborhood_id = await _resolve_neighborhood_id(session)
    basic_tier_id = await _resolve_basic_tier_id(session)
    counts: dict[str, int] = {}

    # --- Citizens + profiles ---------------------------------------------
    citizen_a_id = _uid("citizen-a")
    citizen_b_id = _uid("citizen-b")
    citizen_c_id = _uid("citizen-c")
    citizen_pro_id = _uid("citizen-pro")
    hashed = hash_password(_QA_PASSWORD)
    created_users = 0
    for uid_, email, full_name in (
        (citizen_a_id, "qa.citizen.a@example.com", "QA Citoyen A"),
        (citizen_b_id, "qa.citizen.b@example.com", "QA Citoyen B"),
        (citizen_c_id, "qa.citizen.c@example.com", "QA Citoyen C"),
        (citizen_pro_id, "qa.profile.pro@example.com", "QA Profile Pro"),
    ):
        created_users += await _get_or_add(
            session,
            User,
            uid_,
            lambda uid_=uid_, email=email, full_name=full_name: User(
                id=uid_,
                email=email,
                hashed_password=hashed,
                full_name=full_name,
                city=CITY,
                is_active=True,
                is_verified=True,
            ),
        )
    await session.flush()
    counts["users"] = created_users

    created_profiles = 0
    profiles_spec = (
        (_uid("profile-a"), citizen_a_id, "qa_citizen_a", "Qa Citizen A", None, ["culture"]),
        (
            _uid("profile-b"),
            citizen_b_id,
            "qa_citizen_b",
            "Qa Citizen B",
            "Passionné de sorties locales à Reims.",
            ["culture", "music"],
        ),
        (
            _uid("profile-c"),
            citizen_c_id,
            "qa_citizen_c",
            "Qa Citizen C",
            "Nouveau citoyen QA pour tester les profils publics.",
            ["culture", "art"],
        ),
        (
            _uid("profile-pro"),
            citizen_pro_id,
            "qa_profile_pro",
            "Léa Martin",
            "Photographe amatrice, curieuse de culture et de belles initiatives locales.",
            ["culture", "art", "music"],
        ),
    )
    for uid_, user_id, username, display_name, bio, interests in profiles_spec:
        created_profiles += await _get_or_add(
            session,
            UserProfile,
            uid_,
            lambda uid_=uid_, user_id=user_id, username=username, display_name=display_name, bio=bio, interests=interests: UserProfile(
                id=uid_,
                user_id=user_id,
                username=username,
                display_name=display_name,
                bio=bio,
                city=CITY,
                interests=interests,
                visibility=ProfileVisibility.PUBLIC,
                onboarding_completed=True,
            ),
        )
    await session.flush()
    counts["profiles"] = created_profiles

    # --- Public + private tribe with owner memberships -----------------------
    tribe_public_id = _uid("tribe-public")
    tribe_private_id = _uid("tribe-private")
    created_tribes = 0
    created_tribes += await _get_or_add(
        session,
        Tribe,
        tribe_public_id,
        lambda: Tribe(
            id=tribe_public_id,
            slug="qa-tribu-publique",
            name="QA Tribu Publique",
            description="Tribu publique de test QA.",
            city=CITY,
            category=TribeCategory.CAFE_CULTURE.value,
            visibility=TribeVisibility.PUBLIC.value,
            created_by_user_id=citizen_a_id,
        ),
    )
    created_tribes += await _get_or_add(
        session,
        Tribe,
        tribe_private_id,
        lambda: Tribe(
            id=tribe_private_id,
            slug="qa-tribu-privee",
            name="QA Tribu Privée",
            description="Tribu privée (sur invitation) de test QA.",
            city=CITY,
            category=TribeCategory.ASSOCIATION.value,
            visibility=TribeVisibility.PRIVATE_INVITE.value,
            created_by_user_id=citizen_b_id,
        ),
    )
    await session.flush()
    counts["tribes"] = created_tribes

    created_members = 0
    for uid_, tribe_id, user_id, role in (
        (_uid("member-pub-a"), tribe_public_id, citizen_a_id, TribeMemberRole.OWNER.value),
        (_uid("member-priv-b"), tribe_private_id, citizen_b_id, TribeMemberRole.OWNER.value),
        (_uid("member-pub-pro"), tribe_public_id, citizen_pro_id, TribeMemberRole.MEMBER.value),
    ):
        created_members += await _get_or_add(
            session,
            TribeMember,
            uid_,
            lambda uid_=uid_, tribe_id=tribe_id, user_id=user_id, role=role: TribeMember(
                id=uid_,
                tribe_id=tribe_id,
                user_id=user_id,
                role=role,
                joined_at=now,
                charter_accepted_at=now,
            ),
        )

    tribe_photo_id = _uid("tribe-photo")
    created_tribes += await _get_or_add(
        session,
        Tribe,
        tribe_photo_id,
        lambda: Tribe(
            id=tribe_photo_id,
            slug="qa-tribu-photo",
            name="Photographie Reims",
            description="Tribu publique QA autour de la photo locale.",
            city=CITY,
            category=TribeCategory.CAFE_CULTURE.value,
            visibility=TribeVisibility.PUBLIC.value,
            created_by_user_id=citizen_pro_id,
        ),
    )
    await session.flush()
    created_members += await _get_or_add(
        session,
        TribeMember,
        _uid("member-photo-pro"),
        lambda: TribeMember(
            id=_uid("member-photo-pro"),
            tribe_id=tribe_photo_id,
            user_id=citizen_pro_id,
            role=TribeMemberRole.OWNER.value,
            joined_at=now,
            charter_accepted_at=now,
        ),
    )
    await session.flush()
    counts["tribes"] = created_tribes
    counts["tribe_members"] = created_members

    boulingrin_id = await _resolve_neighborhood_id_by_slug(session, "boulingrin")
    centre_ville_id = await _resolve_neighborhood_id_by_slug(session, "centre-ville")
    created_contributions = 0
    contrib_spec = (
        (
            _uid("contrib-pro-boulingrin"),
            boulingrin_id,
            citizen_pro_id,
            "Marché du Boulingrin",
            "Photo ajoutée au fil des saisons — les halles au petit matin.",
            now - timedelta(days=2),
        ),
        (
            _uid("contrib-pro-centre"),
            centre_ville_id,
            citizen_pro_id,
            "Centre-ville",
            "Informations complétées sur les façades Art déco autour de la place du Forum.",
            now - timedelta(days=3),
        ),
    )
    for uid_, hood_id, author_id, title, body, approved_at in contrib_spec:
        created_contributions += await _get_or_add(
            session,
            NeighborhoodContribution,
            uid_,
            lambda uid_=uid_, hood_id=hood_id, author_id=author_id, title=title, body=body, approved_at=approved_at: NeighborhoodContribution(
                id=uid_,
                neighborhood_id=hood_id,
                author_user_id=author_id,
                title=title,
                body=body,
                status=NeighborhoodContributionStatus.APPROVED.value,
                display_identity_type="pseudo",
                display_identity_label="Léa Martin",
                passport_verified_snapshot=False,
                submitted_at=approved_at,
                approved_at=approved_at,
            ),
        )
    await session.flush()
    counts["neighborhood_contributions"] = created_contributions

    # --- Feed posts (tribe_id None => city feed) -----------------------
    cover_reims_street = (
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34"
        "?w=1200&auto=format&fit=crop&q=80"
    )
    cover_reims_cathedral = (
        "https://images.unsplash.com/photo-1541961017774-22349e4a1262"
        "?w=1200&auto=format&fit=crop&q=80"
    )
    created_posts = 0
    posts_spec: tuple[tuple[uuid.UUID, uuid.UUID, str, datetime, str | None], ...] = (
        (_uid("post-1"), citizen_a_id, "Marché de Reims ce week-end", now - timedelta(hours=2), None),
        (_uid("post-2"), citizen_b_id, "Balade au parc de Champagne", now - timedelta(hours=5), None),
        (
            _uid("post-3"),
            citizen_a_id,
            "Recommandation café centre-ville",
            now - timedelta(hours=9),
            None,
        ),
        (
            _uid("post-4"),
            citizen_c_id,
            "Première sortie culture à Reims — des idées ?",
            now - timedelta(days=2, hours=3),
            None,
        ),
        (
            _uid("post-5"),
            citizen_pro_id,
            "Balade photo ce matin dans le centre de Reims. La lumière sur les façades est juste incroyable !",
            now - timedelta(days=3, hours=6),
            cover_reims_street,
        ),
        (
            _uid("post-6"),
            citizen_c_id,
            "Découverte de la Bibliothèque Carnegie — un vrai bijou Art déco.",
            now - timedelta(days=1, hours=8),
            cover_reims_cathedral,
        ),
        (
            _uid("post-7"),
            citizen_c_id,
            "Quelqu'un pour un café culture samedi matin au Boulingrin ?",
            now - timedelta(hours=18),
            None,
        ),
        (
            _uid("post-8"),
            citizen_pro_id,
            "Expo temporaire au musée — à ne pas manquer si vous passez par Reims.",
            now - timedelta(days=1, hours=14),
            cover_reims_cathedral,
        ),
        (
            _uid("post-9"),
            citizen_pro_id,
            "Coucher de soleil sur la cathédrale hier soir. Magique.",
            now - timedelta(hours=30),
            cover_reims_street,
        ),
    )
    for uid_, author_id, body, created_at, media_url in posts_spec:
        created_posts += await _get_or_add(
            session,
            Post,
            uid_,
            lambda uid_=uid_, author_id=author_id, body=body, created_at=created_at, media_url=media_url: Post(
                id=uid_,
                author_type=PostAuthorType.CITIZEN.value,
                author_id=author_id,
                type=PostType.POST.value,
                city=CITY,
                body=body,
                media_url=media_url,
                is_active=True,
                created_at=created_at,
            ),
        )
    # Idempotent re-seed: refresh media URLs when fixture CDN links change.
    for uid_, _, _, _, media_url in posts_spec:
        if media_url is None:
            continue
        existing_post = await session.get(Post, uid_)
        if existing_post is not None:
            existing_post.media_url = media_url
    await session.flush()
    counts["posts"] = created_posts

    # --- Future + past events + interest -------------------------------------
    event_future_id = _uid("event-future")
    event_past_id = _uid("event-past")
    created_events = 0
    created_events += await _get_or_add(
        session,
        LocalEvent,
        event_future_id,
        lambda: LocalEvent(
            id=event_future_id,
            created_by_user_id=citizen_a_id,
            title="QA Événement futur",
            description="Événement QA à venir.",
            city=CITY,
            starts_at=now + timedelta(days=7),
            ends_at=now + timedelta(days=7, hours=2),
            location_name="Place d'Erlon",
            neighborhood_id=neighborhood_id,
            visibility=LocalEventVisibility.PUBLIC.value,
            moderation_status=LocalEventModerationStatus.APPROVED.value,
        ),
    )
    created_events += await _get_or_add(
        session,
        LocalEvent,
        event_past_id,
        lambda: LocalEvent(
            id=event_past_id,
            created_by_user_id=citizen_a_id,
            title="QA Événement passé",
            description="Événement QA passé.",
            city=CITY,
            starts_at=now - timedelta(days=7),
            ends_at=now - timedelta(days=7, hours=-2),
            location_name="Cryptoportique",
            neighborhood_id=neighborhood_id,
            visibility=LocalEventVisibility.PUBLIC.value,
            moderation_status=LocalEventModerationStatus.APPROVED.value,
        ),
    )
    await session.flush()
    counts["events"] = created_events

    # --- Sortir immersion: 1 à la une + 3 ce soir (mobile / medium / desktop) -
    # Real editorial photos (Unsplash / Reims CDN) — solid QA PNGs looked like
    # color blocks in the « Ce soir » cards and broke the mockup immersion.
    cover_featured = (
        "https://cdn.elebase.io/173fe953-8a63-4a8a-8ca3-1bacb56d78a5/"
        "a016fa00-8eec-4399-bcb8-10f91b9acfd5-shutterstock_200545976.jpg?q=90"
    )
    cover_music = (
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819"
        "?w=800&auto=format&fit=crop&q=80"
    )
    cover_food = (
        "https://images.unsplash.com/photo-1488459716781-31db52582fe9"
        "?w=800&auto=format&fit=crop&q=80"
    )
    cover_local = (
        "https://images.unsplash.com/photo-1514933651103-005eec06c04b"
        "?w=800&auto=format&fit=crop&q=80"
    )

    tourism_org_id = _uid("organization-tourism")
    created_tourism_org = await _get_or_add(
        session,
        Organization,
        tourism_org_id,
        lambda: Organization(
            id=tourism_org_id,
            slug="reims-tourisme",
            name="Reims Tourisme",
            type=OrganizationType.ASSOCIATION.value,
            city=CITY,
            neighborhood_id=neighborhood_id,
            verification_status=VerificationStatus.VERIFIED.value,
            visibility=OrganizationVisibility.PUBLIC.value,
            verified_at=now - timedelta(days=90),
        ),
    )
    await session.flush()
    counts["organizations"] = counts.get("organizations", 0) + int(created_tourism_org)

    sortir_specs: list[tuple[str, Callable[[], LocalEvent]]] = [
        (
            "event-sortir-featured",
            lambda: LocalEvent(
                id=_uid("event-sortir-featured"),
                created_by_user_id=citizen_a_id,
                organization_id=tourism_org_id,
                title="Visite nocturne de la cathédrale",
                description=(
                    "Une découverte lumineuse du patrimoine rémois.\n"
                    "Un parcours guidé sous les voûtes de Notre-Dame pour comprendre "
                    "l’histoire, l’architecture gothique et les secrets de la cathédrale "
                    "illuminée. Rendez-vous sur le parvis quinze minutes avant le départ. "
                    "Chaussures confortables conseillées ; la visite se déroule à pied "
                    "autour et à l’intérieur selon les conditions d’accès du soir."
                ),
                event_type="exhibition",
                city=CITY,
                district="Centre-ville",
                starts_at=_tonight_at(now, 20, 30),
                ends_at=_tonight_at(now, 23, 45),
                location_name="Parvis Notre-Dame",
                address="Place du Cardinal Luçon, Reims",
                latitude=49.2535,
                longitude=4.034,
                neighborhood_id=neighborhood_id,
                cover_image_url=cover_featured[:500],
                visibility=LocalEventVisibility.PUBLIC.value,
                moderation_status=LocalEventModerationStatus.APPROVED.value,
            ),
        ),
        (
            "event-sortir-tonight-music",
            lambda: LocalEvent(
                id=_uid("event-sortir-tonight-music"),
                created_by_user_id=citizen_a_id,
                title="Live au Cryptoportique",
                description=(
                    "Concert live sous les voûtes gallo-romaines du centre.\n"
                    "Une scène locale pour la nuit rémoise : acoustique unique, "
                    "ambiance feutrée et artistes de la ville. Arrivez un peu en avance "
                    "pour l’accueil sur place."
                ),
                event_type="local_concert",
                city=CITY,
                district="Centre-ville",
                starts_at=_tonight_at(now, 19, 30),
                ends_at=_tonight_at(now, 23, 45),
                location_name="Cryptoportique",
                address="Place du Forum, Reims",
                latitude=49.2567,
                longitude=4.0319,
                neighborhood_id=neighborhood_id,
                cover_image_url=cover_music[:500],
                visibility=LocalEventVisibility.PUBLIC.value,
                moderation_status=LocalEventModerationStatus.APPROVED.value,
            ),
        ),
        (
            "event-sortir-tonight-food",
            lambda: LocalEvent(
                id=_uid("event-sortir-tonight-food"),
                created_by_user_id=citizen_a_id,
                title="Nocturne du Boulingrin",
                description="Marché nocturne, food trucks et ambiance locale aux Halles.",
                event_type="local_market",
                city=CITY,
                district="Boulingrin",
                starts_at=_tonight_at(now, 18, 0),
                ends_at=_tonight_at(now, 23, 45),
                location_name="Halles du Boulingrin",
                address="Rue de Mars, Reims",
                latitude=49.2595,
                longitude=4.031,
                neighborhood_id=neighborhood_id,
                cover_image_url=cover_food[:500],
                visibility=LocalEventVisibility.PUBLIC.value,
                moderation_status=LocalEventModerationStatus.APPROVED.value,
            ),
        ),
        (
            "event-sortir-tonight-local",
            lambda: LocalEvent(
                id=_uid("event-sortir-tonight-local"),
                created_by_user_id=citizen_a_id,
                title="Apéro Place d'Erlon",
                description="Rencontre conviviale en terrasse au cœur de Reims.",
                event_type="cafe_meetup",
                city=CITY,
                district="Centre-ville",
                starts_at=_tonight_at(now, 21, 0),
                ends_at=_tonight_at(now, 23, 45),
                location_name="Place d'Erlon",
                address="Place Drouet d'Erlon, Reims",
                latitude=49.2558,
                longitude=4.0265,
                neighborhood_id=neighborhood_id,
                cover_image_url=cover_local[:500],
                visibility=LocalEventVisibility.PUBLIC.value,
                moderation_status=LocalEventModerationStatus.APPROVED.value,
            ),
        ),
    ]
    for logical_name, factory in sortir_specs:
        created_events += await _upsert_sortir_event(session, _uid(logical_name), factory)
    await session.flush()
    counts["events"] = created_events

    created_interest = await _get_or_add(
        session,
        EventInterest,
        _uid("interest-a-future"),
        lambda: EventInterest(
            id=_uid("interest-a-future"),
            user_id=citizen_a_id,
            event_id=event_future_id,
        ),
    )
    await session.flush()
    counts["event_interests"] = int(created_interest)

    # --- Organization (verified/public) + flash + expired offers -------------
    org_id = _uid("organization")
    created_org = await _get_or_add(
        session,
        Organization,
        org_id,
        lambda: Organization(
            id=org_id,
            slug="qa-partenaire",
            name="QA Partenaire Local",
            type=OrganizationType.COMMERCE.value,
            city=CITY,
            neighborhood_id=neighborhood_id,
            verification_status=VerificationStatus.VERIFIED.value,
            visibility=OrganizationVisibility.PUBLIC.value,
            verified_at=now - timedelta(days=30),
        ),
    )
    await session.flush()
    counts["organizations"] = counts.get("organizations", 0) + int(created_org)

    # PartnerProfile with a public status is REQUIRED for the public offers catalog:
    # GET /partner-offers inner-joins partner_profiles and filters partner_status in
    # {active, premium, founding_partner} (see PublicPartnerOfferService). Without it the
    # seeded offers never surface publicly. (C3-F0-T3-R2 fixture completion.)
    partner_profile_id = _uid("partner-profile")
    created_partner_profile = await _get_or_add(
        session,
        PartnerProfile,
        partner_profile_id,
        lambda: PartnerProfile(
            id=partner_profile_id,
            organization_id=org_id,
            partner_status=PartnerStatus.ACTIVE.value,
            partnership_type=PartnershipType.LOCAL_BUSINESS.value,
            activated_at=now - timedelta(days=30),
            public_partner_label="QA Partenaire Local",
        ),
    )
    await session.flush()
    counts["partner_profiles"] = int(created_partner_profile)

    offer_flash_id = _uid("offer-flash-future")
    offer_expired_id = _uid("offer-expired")
    created_offers = 0
    created_offers += await _get_or_add(
        session,
        PartnerOffer,
        offer_flash_id,
        lambda: PartnerOffer(
            id=offer_flash_id,
            organization_id=org_id,
            title="QA Offre flash",
            slug="qa-offre-flash",
            description="Offre flash QA valable quelques heures.",
            offer_type=PartnerOfferType.DISCOUNT.value,
            status=PartnerOfferStatus.PUBLISHED.value,
            is_active=True,
            is_flash=True,
            valid_from=now - timedelta(days=1),
            valid_until=now + timedelta(days=30),
            flash_ends_at=now + timedelta(hours=2),
        ),
    )
    created_offers += await _get_or_add(
        session,
        PartnerOffer,
        offer_expired_id,
        lambda: PartnerOffer(
            id=offer_expired_id,
            organization_id=org_id,
            title="QA Offre expirée",
            slug="qa-offre-expiree",
            description="Offre flash QA déjà expirée.",
            offer_type=PartnerOfferType.DISCOUNT.value,
            status=PartnerOfferStatus.PUBLISHED.value,
            is_active=True,
            is_flash=True,
            valid_from=now - timedelta(days=10),
            valid_until=now - timedelta(hours=1),
            flash_ends_at=now - timedelta(hours=1),
        ),
    )
    await session.flush()
    counts["partner_offers"] = created_offers

    # --- Local videos (filesystem placeholders, no external upload) ----------
    landscape_media, landscape_thumb, portrait_media, portrait_thumb = _write_placeholder_video()
    video_id = _uid("local-video")
    created_video = await _get_or_add(
        session,
        LocalVideo,
        video_id,
        lambda: LocalVideo(
            id=video_id,
            author_user_id=citizen_a_id,
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
        ),
    )
    # Idempotent re-seed: keep orientation fields in sync for already-created rows.
    existing_landscape = await session.get(LocalVideo, video_id)
    if existing_landscape is not None:
        existing_landscape.media_width = 1920
        existing_landscape.media_height = 1080
        existing_landscape.media_url = landscape_media
        existing_landscape.thumbnail_url = landscape_thumb

    portrait_video_id = _uid("local-video-portrait")
    created_portrait = await _get_or_add(
        session,
        LocalVideo,
        portrait_video_id,
        lambda: LocalVideo(
            id=portrait_video_id,
            author_user_id=citizen_a_id,
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
            published_at=now - timedelta(hours=6),
            latitude=49.2583,
            longitude=4.0317,
        ),
    )
    existing_portrait = await session.get(LocalVideo, portrait_video_id)
    if existing_portrait is not None:
        existing_portrait.media_width = 1080
        existing_portrait.media_height = 1920
        existing_portrait.media_url = portrait_media
        existing_portrait.thumbnail_url = portrait_thumb
        existing_portrait.title = "3 adresses à tester ce week-end à Reims"
        existing_portrait.description = (
            "Parcours QA portrait pour valider la carte split desktop."
        )

    await session.flush()
    counts["local_videos"] = int(created_video) + int(created_portrait)

    # --- Notifications (rendering only — business generation is T3) ----------
    created_notifs = 0
    # Les types viennent du CONTRAT PUBLIC, jamais d'un littéral (C3.1-R1H.1) :
    # `user_notifications.type` est un VARCHAR(64) sans contrainte, donc une valeur
    # hors contrat s'écrit en silence et ne casse qu'à la LECTURE de l'inbox — ce qui
    # renvoyait 500 sur chaque page authentifiée. Passer par l'énumération transforme
    # une faute de frappe en erreur d'import.
    # Les deux types choisis sont cohérents avec ce que la baseline sème par ailleurs :
    # un passeport pour le citoyen A, et deux événements locaux.
    notifs_spec = (
        (
            _uid("notif-1"),
            SocialNotificationType.PASSPORT_LEVEL_UNLOCKED.value,
            "Votre Passport Yunicity a franchi un nouveau niveau",
        ),
        (
            _uid("notif-2"),
            SocialNotificationType.LOCAL_EVENT_PUBLISHED.value,
            "Un événement approche près de chez vous",
        ),
    )
    for uid_, ntype, message in notifs_spec:
        created_notifs += await _get_or_add(
            session,
            UserNotification,
            uid_,
            lambda uid_=uid_, ntype=ntype, message=message: UserNotification(
                id=uid_,
                type=ntype,
                target_user_id=citizen_a_id,
                deeplink="/notifications",
                payload={"message": message, "seeded": True},
                is_read=False,
            ),
        )
    await session.flush()
    counts["notifications"] = created_notifs

    # --- Passport minimal (deterministic state only) -------------------------
    passport_id = _uid("passport-a")
    created_passport = await _get_or_add(
        session,
        Passport,
        passport_id,
        lambda: Passport(
            id=passport_id,
            user_id=citizen_a_id,
            tier_id=basic_tier_id,
            city=CITY,
            passport_number="QA-0000-0001",
            qr_token="qa-passport-token-citizen-a",
            status=PassportStatus.ACTIVE.value,
            onboarding_completed=True,
            activated_at=now - timedelta(days=3),
        ),
    )
    await session.flush()
    counts["passports"] = int(created_passport)

    await session.commit()
    return SeedReport(reference_now=now, counts=counts)


# Expected non-zero volumes after a fresh seed — used by `verify` and idempotence tests.
EXPECTED_VOLUMES: dict[str, int] = {
    "users": 4,
    "profiles": 4,
    "tribes": 2,
    "tribe_members": 2,
    "posts": 9,
    "events": 6,
    "event_interests": 1,
    "organizations": 1,
    "partner_profiles": 1,
    "partner_offers": 2,
    "local_videos": 2,
    "notifications": 2,
    "passports": 1,
}
