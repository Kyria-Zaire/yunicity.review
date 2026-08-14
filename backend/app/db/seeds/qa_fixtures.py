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

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
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
from app.core.security import hash_password
from app.core.tribe_constants import TribeCategory, TribeMemberRole, TribeVisibility
from app.db.seeds.passport_tiers import seed_passport_tiers
from app.db.seeds.reims_neighborhoods import seed_reims_neighborhoods
from app.models.local_event import EventInterest, LocalEvent
from app.models.local_video import LocalVideo
from app.models.neighborhood import Neighborhood
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


def _write_placeholder_video() -> tuple[str, str]:
    """Write a tiny placeholder media file under the temp media dir (no external upload).

    Returns (media_url, thumbnail_url). Best-effort: on failure we still return URLs so
    the DB row is created (playback is a T3 concern)."""
    settings = get_settings()
    base_url = settings.local_video_public_base_url
    media_url = f"{base_url}/qa/qa-sample-video.mp4"
    thumbnail_url = f"{base_url}/qa/qa-sample-video.jpg"
    try:
        media_dir = Path(settings.media_upload_dir) / "qa"
        media_dir.mkdir(parents=True, exist_ok=True)
        (media_dir / "qa-sample-video.mp4").write_bytes(b"\x00\x00\x00\x18ftypmp42")
        (media_dir / "qa-sample-video.jpg").write_bytes(b"\xff\xd8\xff\xd9")
    except OSError as exc:  # pragma: no cover - filesystem edge
        logger.warning("qa_video_placeholder_skip", extra={"error": str(exc)})
    return media_url, thumbnail_url


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

    # --- Two citizens + profiles ---------------------------------------------
    citizen_a_id = _uid("citizen-a")
    citizen_b_id = _uid("citizen-b")
    hashed = hash_password(_QA_PASSWORD)
    created_users = 0
    for uid_, email, full_name in (
        # @example.com is accepted by EmailStr (the .test TLD is rejected) → these QA
        # actors are loginnable via API and UI with the deterministic QA password below.
        (citizen_a_id, "qa.citizen.a@example.com", "QA Citoyen A"),
        (citizen_b_id, "qa.citizen.b@example.com", "QA Citoyen B"),
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
    for uid_, user_id, username, interests in (
        # Valid profile-interest vocabulary (ALLOWED_INTERESTS), not tribe categories.
        (_uid("profile-a"), citizen_a_id, "qa_citizen_a", ["culture"]),
        (_uid("profile-b"), citizen_b_id, "qa_citizen_b", []),
    ):
        created_profiles += await _get_or_add(
            session,
            UserProfile,
            uid_,
            lambda uid_=uid_, user_id=user_id, username=username, interests=interests: UserProfile(
                id=uid_,
                user_id=user_id,
                username=username,
                display_name=username.replace("_", " ").title(),
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
    for uid_, tribe_id, user_id in (
        (_uid("member-pub-a"), tribe_public_id, citizen_a_id),
        (_uid("member-priv-b"), tribe_private_id, citizen_b_id),
    ):
        created_members += await _get_or_add(
            session,
            TribeMember,
            uid_,
            lambda uid_=uid_, tribe_id=tribe_id, user_id=user_id: TribeMember(
                id=uid_,
                tribe_id=tribe_id,
                user_id=user_id,
                role=TribeMemberRole.OWNER.value,
                joined_at=now,
                charter_accepted_at=now,
            ),
        )
    await session.flush()
    counts["tribe_members"] = created_members

    # --- Three feed posts (tribe_id None => city feed) -----------------------
    created_posts = 0
    posts_spec = (
        (_uid("post-1"), citizen_a_id, "Marché de Reims ce week-end", now - timedelta(hours=2)),
        (_uid("post-2"), citizen_b_id, "Balade au parc de Champagne", now - timedelta(hours=5)),
        (
            _uid("post-3"),
            citizen_a_id,
            "Recommandation café centre-ville",
            now - timedelta(hours=9),
        ),
    )
    for uid_, author_id, body, created_at in posts_spec:
        created_posts += await _get_or_add(
            session,
            Post,
            uid_,
            lambda uid_=uid_, author_id=author_id, body=body, created_at=created_at: Post(
                id=uid_,
                author_type="user",
                author_id=author_id,
                type="post",
                city=CITY,
                body=body,
                is_active=True,
                created_at=created_at,
            ),
        )
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
    counts["organizations"] = int(created_org)

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

    # --- Local video (filesystem placeholder, no external upload) ------------
    media_url, thumbnail_url = _write_placeholder_video()
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
            description="Vidéo locale QA (placeholder filesystem).",
            storage_key="qa/qa-sample-video.mp4",
            media_url=media_url,
            thumbnail_url=thumbnail_url,
            duration_seconds=12.0,
            file_size_bytes=8,
            mime_type="video/mp4",
            status="published",
            published_at=now - timedelta(days=1),
        ),
    )
    await session.flush()
    counts["local_videos"] = int(created_video)

    # --- Notifications (rendering only — business generation is T3) ----------
    created_notifs = 0
    notifs_spec = (
        (_uid("notif-1"), "system", "Bienvenue sur Yunicity QA"),
        (_uid("notif-2"), "system", "Un événement approche près de chez vous"),
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
    "users": 2,
    "profiles": 2,
    "tribes": 2,
    "tribe_members": 2,
    "posts": 3,
    "events": 2,
    "event_interests": 1,
    "organizations": 1,
    "partner_profiles": 1,
    "partner_offers": 2,
    "local_videos": 1,
    "notifications": 2,
    "passports": 1,
}
