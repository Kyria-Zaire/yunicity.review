"""Admin partner offer moderation audit API tests (ADMIN-04E-B1)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta

import pytest
from app.core.organization_constants import (
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.passport_constants import PartnerOfferStatus, PartnerOfferType
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from app.models.organization import Organization
from app.models.passport import PartnerOffer
from app.models.user import User
from app.models.user_profile import UserProfile
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/partner-offers"


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> AsyncIterator[None]:
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()
    yield
    if redis is not None:
        await redis.flushdb()


async def _session_factory() -> async_sessionmaker[AsyncSession]:
    engine = get_engine()
    assert engine is not None
    return async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


async def _create_verified_org(session: AsyncSession, *, suffix: str) -> Organization:
    org = Organization(
        slug=f"offer-audit-org-{suffix}",
        name=f"Offer Audit Org {suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PRIVATE,
    )
    session.add(org)
    await session.flush()
    return org


async def _create_pending_offer(session: AsyncSession, *, org: Organization) -> PartnerOffer:
    suffix = uuid.uuid4().hex[:8]
    offer = PartnerOffer(
        organization_id=org.id,
        title=f"Audit offer {suffix}",
        slug=f"audit-offer-{suffix}",
        offer_type=PartnerOfferType.DRINK,
        status=PartnerOfferStatus.PENDING_REVIEW,
        is_active=False,
    )
    session.add(offer)
    await session.flush()
    return offer


async def _create_published_offer(session: AsyncSession, *, org: Organization) -> PartnerOffer:
    suffix = uuid.uuid4().hex[:8]
    offer = PartnerOffer(
        organization_id=org.id,
        title=f"Published audit {suffix}",
        slug=f"published-audit-{suffix}",
        offer_type=PartnerOfferType.GIFT,
        status=PartnerOfferStatus.PUBLISHED,
        is_active=True,
    )
    session.add(offer)
    await session.flush()
    return offer


async def _count_audit(session: AsyncSession, offer_id: uuid.UUID) -> int:
    from app.repositories.admin_partner_offer_repository import AdminPartnerOfferRepository

    return await AdminPartnerOfferRepository(session).count_admin_actions(offer_id)


def _actions_url(offer_id: uuid.UUID) -> str:
    return f"{BASE}/{offer_id}/actions"


@pytest.mark.asyncio
async def test_approve_writes_audit_entry(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        org = await _create_verified_org(session, suffix="approve")
        offer = await _create_pending_offer(session, org=org)
        offer_id = offer.id
        await session.commit()

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.post(
        f"{BASE}/{offer_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text

    async with factory() as session:
        assert await _count_audit(session, offer_id) == 1

    actions = await auth_client.get(
        _actions_url(offer_id),
        headers=auth_header(moderator.access_token),
    )
    assert actions.status_code == 200
    item = actions.json()["items"][0]
    assert item["action"] == "approve"
    assert item["previous_status"] == "pending_review"
    assert item["new_status"] == "published"
    assert item["reason"] == "Offre approuvée et publiée."


@pytest.mark.asyncio
async def test_reject_writes_audit_with_payload_reason(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        org = await _create_verified_org(session, suffix="reject")
        offer = await _create_pending_offer(session, org=org)
        offer_id = offer.id
        await session.commit()

    moderator = await rbac_user_factory("MODERATOR")
    reject_reason = "Contenu incomplet pour publication"
    response = await auth_client.post(
        f"{BASE}/{offer_id}/reject",
        headers=auth_header(moderator.access_token),
        json={"reason": reject_reason},
    )
    assert response.status_code == 200, response.text

    actions = await auth_client.get(
        _actions_url(offer_id),
        headers=auth_header(moderator.access_token),
    )
    assert actions.status_code == 200
    item = actions.json()["items"][0]
    assert item["action"] == "reject"
    assert item["reason"] == reject_reason


@pytest.mark.asyncio
async def test_archive_writes_audit_entry(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        org = await _create_verified_org(session, suffix="archive")
        offer = await _create_published_offer(session, org=org)
        offer_id = offer.id
        await session.commit()

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.post(
        f"{BASE}/{offer_id}/archive",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text

    actions = await auth_client.get(
        _actions_url(offer_id),
        headers=auth_header(moderator.access_token),
    )
    assert actions.status_code == 200
    item = actions.json()["items"][0]
    assert item["action"] == "archive"
    assert item["previous_status"] == "published"
    assert item["new_status"] == "archived"
    assert item["reason"] == "Offre archivée."


@pytest.mark.asyncio
async def test_no_audit_when_moderation_action_fails(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        org = await _create_verified_org(session, suffix="fail")
        offer = await _create_pending_offer(session, org=org)
        offer_id = offer.id
        await session.commit()

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.post(
        f"{BASE}/{offer_id}/archive",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_OFFER_TRANSITION"

    async with factory() as session:
        assert await _count_audit(session, offer_id) == 0


@pytest.mark.asyncio
async def test_moderator_can_list_offer_actions(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        org = await _create_verified_org(session, suffix="list")
        offer = await _create_pending_offer(session, org=org)
        offer_id = offer.id
        await session.commit()

    mod_email = f"mod-audit-{uuid.uuid4().hex[:8]}@example.com"
    moderator = await rbac_user_factory("MODERATOR", email=mod_email)
    approve = await auth_client.post(
        f"{BASE}/{offer_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert approve.status_code == 200

    response = await auth_client.get(
        _actions_url(offer_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1


@pytest.mark.asyncio
async def test_user_denied_list_offer_actions(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        org = await _create_verified_org(session, suffix="403")
        offer = await _create_pending_offer(session, org=org)
        offer_id = offer.id
        await session.commit()

    user = await rbac_user_factory()
    response = await auth_client.get(
        _actions_url(offer_id),
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_unknown_offer_actions_returns_404(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _actions_url(uuid.uuid4()),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 404
    assert response.json()["code"] == "OFFER_NOT_FOUND"


@pytest.mark.asyncio
async def test_offer_actions_pagination(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        org = await _create_verified_org(session, suffix="page")
        offer = await _create_pending_offer(session, org=org)
        offer_id = offer.id
        moderator_user = User(
            email=f"audit-mod-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Staff Audit",
            city="Reims",
        )
        session.add(moderator_user)
        await session.flush()
        session.add(
            UserProfile(
                user_id=moderator_user.id,
                username=f"staff{uuid.uuid4().hex[:6]}",
                display_name="Staff Audit Display",
                city="Reims",
            )
        )
        from app.core.offer_admin_constants import OfferAdminAction
        from app.repositories.admin_partner_offer_repository import AdminPartnerOfferRepository

        repo = AdminPartnerOfferRepository(session)
        now = datetime.now(UTC)
        await repo.record_admin_action(
            partner_offer_id=offer_id,
            action=OfferAdminAction.APPROVE.value,
            actor_user_id=moderator_user.id,
            previous_status="pending_review",
            new_status="published",
            reason="Offre approuvée et publiée.",
            created_at=now - timedelta(hours=2),
        )
        await repo.record_admin_action(
            partner_offer_id=offer_id,
            action=OfferAdminAction.ARCHIVE.value,
            actor_user_id=moderator_user.id,
            previous_status="published",
            new_status="archived",
            reason="Offre archivée.",
            created_at=now - timedelta(hours=1),
        )
        await session.commit()

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _actions_url(offer_id),
        params={"page": 1, "page_size": 1},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 1
    assert data["page_size"] == 1


@pytest.mark.asyncio
async def test_offer_actions_sorted_by_created_at_desc(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        org = await _create_verified_org(session, suffix="sort")
        offer = await _create_pending_offer(session, org=org)
        offer_id = offer.id
        moderator_user = User(
            email=f"audit-sort-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Sort Staff",
            city="Reims",
        )
        session.add(moderator_user)
        await session.flush()
        from app.core.offer_admin_constants import OfferAdminAction
        from app.repositories.admin_partner_offer_repository import AdminPartnerOfferRepository

        repo = AdminPartnerOfferRepository(session)
        now = datetime.now(UTC)
        await repo.record_admin_action(
            partner_offer_id=offer_id,
            action=OfferAdminAction.APPROVE.value,
            actor_user_id=moderator_user.id,
            previous_status="pending_review",
            new_status="published",
            reason="Offre approuvée et publiée.",
            created_at=now - timedelta(hours=1),
        )
        await repo.record_admin_action(
            partner_offer_id=offer_id,
            action=OfferAdminAction.ARCHIVE.value,
            actor_user_id=moderator_user.id,
            previous_status="published",
            new_status="archived",
            reason="Offre archivée.",
            created_at=now,
        )
        await session.commit()

    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        _actions_url(offer_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert items[0]["action"] == "archive"
    assert items[1]["action"] == "approve"
    timestamps = [item["created_at"] for item in items]
    assert timestamps == sorted(timestamps, reverse=True)


@pytest.mark.asyncio
async def test_offer_action_actor_email_and_display_name(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        org = await _create_verified_org(session, suffix="actor")
        offer = await _create_pending_offer(session, org=org)
        offer_id = offer.id
        await session.commit()

    display_name = f"Moderator Audit {uuid.uuid4().hex[:6]}"
    moderator = await rbac_user_factory(
        "MODERATOR",
        email=f"mod-display-{uuid.uuid4().hex[:8]}@example.com",
    )
    async with factory() as session:
        profile = (
            await session.execute(
                select(UserProfile).where(UserProfile.user_id == moderator.user_id)
            )
        ).scalar_one()
        profile.display_name = display_name
        await session.commit()

    approve = await auth_client.post(
        f"{BASE}/{offer_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert approve.status_code == 200

    response = await auth_client.get(
        _actions_url(offer_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    actor = response.json()["items"][0]["actor_user"]
    assert actor["email"] == moderator.email
    assert actor["display_name"] == display_name


@pytest.mark.asyncio
async def test_offer_actions_response_excludes_metadata(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    factory = await _session_factory()
    async with factory() as session:
        org = await _create_verified_org(session, suffix="meta")
        offer = await _create_pending_offer(session, org=org)
        offer_id = offer.id
        from app.repositories.admin_partner_offer_repository import AdminPartnerOfferRepository

        await AdminPartnerOfferRepository(session).record_admin_action(
            partner_offer_id=offer_id,
            action="approve",
            actor_user_id=moderator.user_id,
            previous_status="pending_review",
            new_status="published",
            reason="Offre approuvée et publiée.",
            metadata={"internal": "secret"},
        )
        await session.commit()
    response = await auth_client.get(
        _actions_url(offer_id),
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    item = response.json()["items"][0]
    assert "metadata" not in item
