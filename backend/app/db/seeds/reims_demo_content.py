"""Idempotent Reims demo content for QA (TICKET-506 / TICKET-604).

Run (dev/recette only): python -m app.db.seeds --demo
Blocked when APP_ENV is preprod or prod (see seeds.__main__).

Demo login: demo@yunicity.dev / DemoReims1!Dev — never deploy to production.

Territorial links (TICKET-604): posts, events and orgs reference Reims neighborhoods
so feed badges and quartier detail feel alive in recette.
"""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.feed_constants import PostAuthorType, PostType
from app.core.local_event_constants import LocalEventModerationStatus, LocalEventVisibility
from app.core.organization_constants import (
    OrganizationMemberRole,
    OrganizationMemberStatus,
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.passport_constants import PartnerOfferStatus, PartnerOfferType, PassportStatus
from app.core.security import hash_password
from app.models.local_event import LocalEvent
from app.models.neighborhood import Neighborhood
from app.models.organization import Organization, OrganizationMember
from app.models.passport import PartnerOffer, Passport, PassportTier
from app.models.post import Post
from app.models.user import User
from app.repositories.rbac_repository import RbacRepository
from app.services.feed_event_sync import FeedEventSyncService
from app.services.feed_offer_sync import FeedOfferSyncService
from app.services.profile_service import ProfileService

logger = logging.getLogger(__name__)

DEMO_PASSWORD = "DemoReims1!Dev"

DEMO_CITIZEN_ID = uuid.UUID("c5010000-0000-4000-8000-000000000001")
DEMO_CITIZEN_2_ID = uuid.UUID("c5010000-0000-4000-8000-000000000002")
DEMO_PARTNER_CAFE_ID = uuid.UUID("c5020000-0000-4000-8000-000000000001")
DEMO_PARTNER_CAVEAU_ID = uuid.UUID("c5020000-0000-4000-8000-000000000002")

DEMO_ORG_CAFE_ID = uuid.UUID("c5030000-0000-4000-8000-000000000001")
DEMO_ORG_CAVEAU_ID = uuid.UUID("c5030000-0000-4000-8000-000000000002")

DEMO_POST_1_ID = uuid.UUID("c5040000-0000-4000-8000-000000000001")
DEMO_POST_2_ID = uuid.UUID("c5040000-0000-4000-8000-000000000002")
DEMO_POST_3_ID = uuid.UUID("c5040000-0000-4000-8000-000000000003")

DEMO_EVENT_1_ID = uuid.UUID("c5050000-0000-4000-8000-000000000001")
DEMO_EVENT_2_ID = uuid.UUID("c5050000-0000-4000-8000-000000000002")
DEMO_EVENT_3_ID = uuid.UUID("c5050000-0000-4000-8000-000000000003")

# Europe/Paris approx. for demo seeds (UTC+2 — summer / CEST).
PARIS_UTC_OFFSET = timedelta(hours=2)

DEMO_OFFER_FLASH_ID = uuid.UUID("c5060000-0000-4000-8000-000000000001")
DEMO_PASSPORT_ID = uuid.UUID("c5070000-0000-4000-8000-000000000001")

REIMS_CITY = "Reims"


def _demo_event_window(
    *,
    days_ahead: int,
    start_hour: int,
    start_minute: int = 0,
    end_hour: int,
    end_minute: int = 0,
) -> tuple[datetime, datetime]:
    """Build UTC instants from today + N days at local (Paris) wall-clock times."""
    local_reference = datetime.now(UTC) + PARIS_UTC_OFFSET
    target_day: date = (local_reference + timedelta(days=days_ahead)).date()
    start_utc = datetime(
        target_day.year,
        target_day.month,
        target_day.day,
        start_hour,
        start_minute,
        tzinfo=UTC,
    ) - PARIS_UTC_OFFSET
    end_utc = datetime(
        target_day.year,
        target_day.month,
        target_day.day,
        end_hour,
        end_minute,
        tzinfo=UTC,
    ) - PARIS_UTC_OFFSET
    if end_utc <= start_utc:
        end_utc += timedelta(hours=1)
    return start_utc, end_utc


async def _neighborhood_id_by_slug(session: AsyncSession, slug: str) -> uuid.UUID | None:
    result = await session.execute(
        select(Neighborhood.id)
        .where(Neighborhood.city == REIMS_CITY, Neighborhood.slug == slug)
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _user_exists(session: AsyncSession, user_id: uuid.UUID) -> bool:
    result = await session.execute(select(User.id).where(User.id == user_id).limit(1))
    return result.scalar_one_or_none() is not None


async def _ensure_demo_user(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    email: str,
    full_name: str,
) -> User:
    if await _user_exists(session, user_id):
        result = await session.execute(select(User).where(User.id == user_id))
        return result.scalar_one()

    hashed = hash_password(DEMO_PASSWORD)
    user = User(
        id=user_id,
        email=email,
        hashed_password=hashed,
        full_name=full_name,
        city="Reims",
        is_active=True,
        is_verified=True,
    )
    session.add(user)
    await session.flush()
    await RbacRepository(session).assign_role_to_user(user.id, "USER")
    await ProfileService(session).create_profile_for_new_user(
        user_id=user.id,
        email=email,
        full_name=full_name,
        city="Reims",
    )
    return user


async def _ensure_organization(
    session: AsyncSession,
    *,
    org_id: uuid.UUID,
    slug: str,
    name: str,
    owner_id: uuid.UUID,
    neighborhood_id: uuid.UUID | None = None,
) -> Organization:
    result = await session.execute(select(Organization).where(Organization.id == org_id))
    existing = result.scalar_one_or_none()
    if existing is not None:
        if neighborhood_id is not None and existing.neighborhood_id is None:
            existing.neighborhood_id = neighborhood_id
        return existing

    org = Organization(
        id=org_id,
        slug=slug,
        name=name,
        type=OrganizationType.COMMERCE,
        city=REIMS_CITY,
        neighborhood_id=neighborhood_id,
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PUBLIC,
    )
    session.add(org)
    await session.flush()
    session.add(
        OrganizationMember(
            organization_id=org.id,
            user_id=owner_id,
            role=OrganizationMemberRole.OWNER,
            status=OrganizationMemberStatus.ACTIVE,
        )
    )
    await session.flush()
    return org


async def _ensure_citizen_post(
    session: AsyncSession,
    *,
    post_id: uuid.UUID,
    author_id: uuid.UUID,
    body: str,
    neighborhood_id: uuid.UUID | None = None,
) -> None:
    result = await session.execute(select(Post).where(Post.id == post_id).limit(1))
    existing = result.scalar_one_or_none()
    if existing is not None:
        if neighborhood_id is not None and existing.neighborhood_id is None:
            existing.neighborhood_id = neighborhood_id
        return
    session.add(
        Post(
            id=post_id,
            author_type=PostAuthorType.CITIZEN.value,
            author_id=author_id,
            type=PostType.POST.value,
            city=REIMS_CITY,
            body=body,
            neighborhood_id=neighborhood_id,
            is_active=True,
        )
    )


async def _ensure_passport(session: AsyncSession, user: User) -> None:
    result = await session.execute(
        select(Passport.id).where(Passport.id == DEMO_PASSPORT_ID).limit(1)
    )
    if result.scalar_one_or_none() is not None:
        return

    tier_result = await session.execute(
        select(PassportTier.id).where(PassportTier.code == "basic").limit(1)
    )
    tier_id = tier_result.scalar_one_or_none()
    if tier_id is None:
        logger.warning(
            "reims_demo_skip_passport: basic tier missing — run seed_passport_tiers first"
        )
        return

    now = datetime.now(UTC)
    session.add(
        Passport(
            id=DEMO_PASSPORT_ID,
            user_id=user.id,
            tier_id=tier_id,
            city="Reims",
            passport_number="REIMS-DEMO-0001",
            qr_token="demo-qr-token-reims-0001",
            status=PassportStatus.ACTIVE,
            onboarding_completed=True,
            onboarding_step="activated",
            activated_at=now,
            tier_unlocked_at=now,
            reputation_score=12,
        )
    )


async def _ensure_local_event(
    session: AsyncSession,
    *,
    event_id: uuid.UUID,
    org: Organization,
    created_by: uuid.UUID,
    title: str,
    description: str,
    event_type: str,
    location_name: str,
    starts_at: datetime,
    ends_at: datetime,
    district: str | None = None,
    neighborhood_id: uuid.UUID | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    address: str | None = None,
) -> LocalEvent:
    result = await session.execute(select(LocalEvent).where(LocalEvent.id == event_id))
    existing = result.scalar_one_or_none()
    if existing is not None:
        existing.title = title
        existing.description = description
        existing.event_type = event_type
        existing.location_name = location_name
        existing.starts_at = starts_at
        existing.ends_at = ends_at
        existing.moderation_status = LocalEventModerationStatus.APPROVED.value
        existing.is_cancelled = False
        if district is not None:
            existing.district = district
        if neighborhood_id is not None:
            existing.neighborhood_id = neighborhood_id
        if latitude is not None:
            existing.latitude = latitude
        if longitude is not None:
            existing.longitude = longitude
        if address is not None:
            existing.address = address
        await session.flush()
        await FeedEventSyncService(session).upsert_event_post(existing, org)
        return existing

    event = LocalEvent(
        id=event_id,
        organization_id=org.id,
        created_by_user_id=created_by,
        title=title,
        description=description,
        event_type=event_type,
        city=REIMS_CITY,
        district=district,
        neighborhood_id=neighborhood_id,
        starts_at=starts_at,
        ends_at=ends_at,
        location_name=location_name,
        address=address,
        latitude=latitude,
        longitude=longitude,
        visibility=LocalEventVisibility.PUBLIC.value,
        moderation_status=LocalEventModerationStatus.APPROVED.value,
        moderated_at=datetime.now(UTC),
        is_cancelled=False,
    )
    session.add(event)
    await session.flush()
    await FeedEventSyncService(session).upsert_event_post(event, org)
    return event


async def _ensure_flash_offer(
    session: AsyncSession,
    org: Organization,
    partner_id: uuid.UUID,
    *,
    neighborhood_id: uuid.UUID | None = None,
) -> None:
    result = await session.execute(
        select(PartnerOffer).where(PartnerOffer.id == DEMO_OFFER_FLASH_ID).limit(1)
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        if neighborhood_id is not None and existing.neighborhood_id is None:
            existing.neighborhood_id = neighborhood_id
        return

    now = datetime.now(UTC)
    offer = PartnerOffer(
        id=DEMO_OFFER_FLASH_ID,
        organization_id=org.id,
        title="Café offert en fin de matinée",
        description="Un espresso ou un thé, à savourer sur place.",
        offer_type=PartnerOfferType.DRINK.value,
        status=PartnerOfferStatus.PUBLISHED.value,
        is_active=True,
        is_flash=True,
        flash_ends_at=now + timedelta(hours=6),
        valid_from=now,
        valid_until=now + timedelta(days=1),
        created_by_user_id=partner_id,
        neighborhood_id=neighborhood_id,
        moderated_at=now,
    )
    session.add(offer)
    await session.flush()
    await FeedOfferSyncService(session).upsert_offer_post(offer, org)


async def seed_reims_demo_content(session: AsyncSession) -> None:
    """Populate Reims with realistic QA content (idempotent)."""
    citizen = await _ensure_demo_user(
        session,
        user_id=DEMO_CITIZEN_ID,
        email="demo@yunicity.dev",
        full_name="Léa Martin",
    )
    await _ensure_demo_user(
        session,
        user_id=DEMO_CITIZEN_2_ID,
        email="thomas@yunicity.dev",
        full_name="Thomas Bernard",
    )
    partner_cafe = await _ensure_demo_user(
        session,
        user_id=DEMO_PARTNER_CAFE_ID,
        email="cafe-centre@partner.yunicity.dev",
        full_name="Équipe Café du Centre",
    )
    partner_caveau = await _ensure_demo_user(
        session,
        user_id=DEMO_PARTNER_CAVEAU_ID,
        email="caveau@partner.yunicity.dev",
        full_name="Caveau Saint-Pierre",
    )

    hood_centre = await _neighborhood_id_by_slug(session, "centre-ville")
    hood_saint_remi = await _neighborhood_id_by_slug(session, "saint-remi")
    hood_boulingrin = await _neighborhood_id_by_slug(session, "boulingrin")

    org_cafe = await _ensure_organization(
        session,
        org_id=DEMO_ORG_CAFE_ID,
        slug="cafe-du-centre-reims",
        name="Café du Centre",
        owner_id=partner_cafe.id,
        neighborhood_id=hood_centre,
    )
    await _ensure_organization(
        session,
        org_id=DEMO_ORG_CAVEAU_ID,
        slug="caveau-saint-pierre",
        name="Caveau Saint-Pierre",
        owner_id=partner_caveau.id,
        neighborhood_id=hood_saint_remi,
    )

    await _ensure_passport(session, citizen)

    await _ensure_citizen_post(
        session,
        post_id=DEMO_POST_1_ID,
        author_id=citizen.id,
        body="Première pause café sur la place — le centre-ville respire ce matin.",
        neighborhood_id=hood_centre,
    )
    await _ensure_citizen_post(
        session,
        post_id=DEMO_POST_2_ID,
        author_id=DEMO_CITIZEN_2_ID,
        body="Quelqu’un connaît un bon marché local ce week-end à Reims ?",
        neighborhood_id=hood_boulingrin,
    )
    await _ensure_citizen_post(
        session,
        post_id=DEMO_POST_3_ID,
        author_id=citizen.id,
        body="La basilique Saint-Remi au crépuscule — une pause culturelle avant la soirée.",
        neighborhood_id=hood_saint_remi,
    )

    await _ensure_flash_offer(
        session,
        org_cafe,
        partner_cafe.id,
        neighborhood_id=hood_centre,
    )

    event_1_start, event_1_end = _demo_event_window(
        days_ahead=3,
        start_hour=8,
        end_hour=13,
    )
    event_2_start, event_2_end = _demo_event_window(
        days_ahead=5,
        start_hour=18,
        end_hour=20,
    )
    event_3_start, event_3_end = _demo_event_window(
        days_ahead=10,
        start_hour=10,
        end_hour=12,
    )

    await _ensure_local_event(
        session,
        event_id=DEMO_EVENT_3_ID,
        org=org_cafe,
        created_by=partner_cafe.id,
        title="Marché local bio",
        description="Produits frais et rencontrer les producteurs locaux.",
        event_type="market",
        location_name="Place d'Erlon",
        address="Place d'Erlon",
        starts_at=event_1_start,
        ends_at=event_1_end,
        district="Centre-ville",
        neighborhood_id=hood_centre,
        latitude=49.27,
        longitude=4.02,
    )
    await _ensure_local_event(
        session,
        event_id=DEMO_EVENT_1_ID,
        org=org_cafe,
        created_by=partner_cafe.id,
        title="Café-rencontre des entrepreneurs",
        description="Venez échanger avec les acteurs économiques locaux autour d’un café.",
        event_type="meetup",
        location_name="Centre-ville – 10 rue du Commerce",
        address="10 rue du Commerce",
        starts_at=event_2_start,
        ends_at=event_2_end,
        district="Centre-ville",
        neighborhood_id=hood_centre,
        latitude=49.2583,
        longitude=4.0317,
    )
    await _ensure_local_event(
        session,
        event_id=DEMO_EVENT_2_ID,
        org=org_cafe,
        created_by=partner_cafe.id,
        title="Atelier photo urbain",
        description="Promenade photo dans le quartier Saint-Remi, animée par un photographe local.",
        event_type="workshop",
        location_name="Quartier Saint-Remi – départ place du Cardinal",
        address="Place du Cardinal",
        starts_at=event_3_start,
        ends_at=event_3_end,
        district="Saint-Remi",
        neighborhood_id=hood_saint_remi,
        latitude=49.24,
        longitude=4.045,
    )

    await session.flush()
    logger.info("reims_demo_content_seed_completed")
