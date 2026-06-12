"""Citizen Passport API tests (PASSPORT-05A)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest
from app.core.organization_constants import (
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.passport_badge_constants import PassportBadgeCode
from app.core.passport_challenge_constants import PassportChallengeCode
from app.core.passport_constants import PassportStatus
from app.db.seeds.passport_badges import seed_passport_badges
from app.db.seeds.passport_challenges import seed_passport_challenges
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from app.models.organization import Organization
from app.models.passport import Passport, PassportStamp
from app.models.user import User
from app.services.passport_badge_earning_service import PassportBadgeEarningService
from app.services.passport_challenge_progress_service import PassportChallengeProgressService
from app.services.yuni_wallet_service import YuniWalletService
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from tests.conftest_passport import activate_passport, auth_header, register_user

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/me/passport"


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> None:
    """Évite RATE_LIMITED quand la suite enchaîne plusieurs POST /auth/register."""
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()


async def _user_session(
    suffix: str,
) -> tuple[AsyncSession, uuid.UUID, uuid.UUID, str]:
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    session = factory()
    email = f"passport{suffix}@example.com"
    user = await session.scalar(select(User).where(User.email == email))
    assert user is not None
    passport = await session.scalar(
        select(Passport).where(
            Passport.user_id == user.id,
            Passport.status == PassportStatus.ACTIVE,
        )
    )
    assert passport is not None
    return session, user.id, passport.id, email


async def _seed_catalogs(session: AsyncSession) -> None:
    await seed_passport_badges(session)
    await seed_passport_challenges(session)
    await session.commit()


async def _create_org(session: AsyncSession, suffix: str) -> Organization:
    org = Organization(
        slug=f"me-api-org-{suffix}-{uuid.uuid4().hex[:6]}",
        name=f"Org {suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PUBLIC,
    )
    session.add(org)
    await session.flush()
    return org


async def _add_stamp(
    session: AsyncSession,
    passport_id: uuid.UUID,
    suffix: str,
) -> PassportStamp:
    org = await _create_org(session, suffix)
    stamp = PassportStamp(
        passport_id=passport_id,
        organization_id=org.id,
        stamped_at=datetime.now(UTC),
    )
    session.add(stamp)
    passport = await session.get(Passport, passport_id)
    assert passport is not None
    passport.stamps_count += 1
    await session.commit()
    await session.refresh(stamp)
    return stamp


async def _complete_explorer(
    session: AsyncSession,
    user_id: uuid.UUID,
    passport_id: uuid.UUID,
) -> None:
    progress = PassportChallengeProgressService(session)
    for idx in range(5):
        stamp = await _add_stamp(session, passport_id, suffix=str(idx))
        await progress.increment_stamp_progress(user_id, stamp)


@pytest.mark.asyncio
async def test_overview_requires_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.get(BASE)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_badges_requires_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.get(f"{BASE}/badges")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_challenges_requires_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.get(f"{BASE}/challenges")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_claim_requires_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.post(
        f"{BASE}/challenges/{PassportChallengeCode.EXPLORER_CENTRE_VILLE.value}/claim"
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_overview_returns_expected_shape(auth_client: AsyncClient) -> None:
    data = await register_user(auth_client, suffix="-overview-shape")
    await activate_passport(auth_client, data["access_token"])
    headers = auth_header(data["access_token"])

    response = await auth_client.get(BASE, headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"summary", "passport", "wallet", "reputation"}
    assert set(body["summary"].keys()) == {
        "passport_tier",
        "reputation",
        "wallet_balance",
        "earned_badges",
        "active_challenges",
        "claimable_rewards",
    }
    assert body["passport"]["status"] == "active"
    assert "created_at" in body["passport"]
    assert body["wallet"]["balance"] == 0
    assert body["reputation"]["total_points"] == 0


@pytest.mark.asyncio
async def test_overview_returns_summary_counts(auth_client: AsyncClient) -> None:
    suffix = "-overview-counts"
    data = await register_user(auth_client, suffix=suffix)
    await activate_passport(auth_client, data["access_token"])
    headers = auth_header(data["access_token"])

    session, user_id, passport_id, _ = await _user_session(suffix)
    try:
        await _seed_catalogs(session)
        await PassportBadgeEarningService(session).award_badge(
            user_id,
            PassportBadgeCode.EXPLORATEUR_REIMS.value,
        )
        stamp = await _add_stamp(session, passport_id, suffix="partial")
        await PassportChallengeProgressService(session).increment_stamp_progress(
            user_id,
            stamp,
        )
    finally:
        await session.close()

    response = await auth_client.get(BASE, headers=headers)
    assert response.status_code == 200
    summary = response.json()["summary"]
    assert summary["earned_badges"] == 1
    assert summary["active_challenges"] == 1
    assert summary["claimable_rewards"] == 0


@pytest.mark.asyncio
async def test_earned_badges_are_exposed(auth_client: AsyncClient) -> None:
    suffix = "-earned-badges"
    data = await register_user(auth_client, suffix=suffix)
    await activate_passport(auth_client, data["access_token"])
    headers = auth_header(data["access_token"])

    session, user_id, _, _ = await _user_session(suffix)
    try:
        await _seed_catalogs(session)
        await PassportBadgeEarningService(session).award_badge(
            user_id,
            PassportBadgeCode.SOUTIEN_LOCAL.value,
        )
    finally:
        await session.close()

    response = await auth_client.get(f"{BASE}/badges", headers=headers)
    assert response.status_code == 200
    earned_codes = [item["code"] for item in response.json()["earned"]]
    assert PassportBadgeCode.SOUTIEN_LOCAL.value in earned_codes
    earned = next(
        item for item in response.json()["earned"] if item["code"] == "soutien_local"
    )
    assert earned["earned_at"] is not None
    assert earned["name"]
    assert earned["rarity"]


@pytest.mark.asyncio
async def test_visible_locked_badges_are_exposed(auth_client: AsyncClient) -> None:
    suffix = "-locked-visible"
    data = await register_user(auth_client, suffix=suffix)
    await activate_passport(auth_client, data["access_token"])
    headers = auth_header(data["access_token"])

    session, _, _, _ = await _user_session(suffix)
    try:
        await _seed_catalogs(session)
    finally:
        await session.close()

    response = await auth_client.get(f"{BASE}/badges", headers=headers)
    assert response.status_code == 200
    locked_codes = {item["code"] for item in response.json()["locked"]}
    assert PassportBadgeCode.EXPLORATEUR_REIMS.value in locked_codes
    assert PassportBadgeCode.AMATEUR_SPECTACLES.value in locked_codes
    assert all(item["earned_at"] is None for item in response.json()["locked"])


@pytest.mark.asyncio
async def test_secret_unearned_badges_are_hidden(auth_client: AsyncClient) -> None:
    suffix = "-secret-hidden"
    data = await register_user(auth_client, suffix=suffix)
    await activate_passport(auth_client, data["access_token"])
    headers = auth_header(data["access_token"])

    session, _, _, _ = await _user_session(suffix)
    try:
        await _seed_catalogs(session)
    finally:
        await session.close()

    response = await auth_client.get(f"{BASE}/badges", headers=headers)
    assert response.status_code == 200
    body = response.json()
    all_codes = {item["code"] for item in body["earned"] + body["locked"]}
    assert PassportBadgeCode.FANTOME_DES_HALLES.value not in all_codes


@pytest.mark.asyncio
async def test_active_completed_claimable_are_partitioned(
    auth_client: AsyncClient,
) -> None:
    suffix = "-challenge-partition"
    data = await register_user(auth_client, suffix=suffix)
    await activate_passport(auth_client, data["access_token"])
    headers = auth_header(data["access_token"])

    session, user_id, passport_id, _ = await _user_session(suffix)
    try:
        await _seed_catalogs(session)
        stamp = await _add_stamp(session, passport_id, suffix="one")
        await PassportChallengeProgressService(session).increment_stamp_progress(
            user_id,
            stamp,
        )
        await _complete_explorer(session, user_id, passport_id)
    finally:
        await session.close()

    response = await auth_client.get(f"{BASE}/challenges", headers=headers)
    assert response.status_code == 200
    body = response.json()
    explorer_code = PassportChallengeCode.EXPLORER_CENTRE_VILLE.value
    active_codes = {item["code"] for item in body["active"]}
    completed_codes = {item["code"] for item in body["completed"]}
    claimable_codes = {item["code"] for item in body["claimable"]}

    assert explorer_code in completed_codes
    assert explorer_code in claimable_codes
    assert explorer_code not in active_codes
    assert len(body["claimable"]) == 1
    assert len(active_codes) >= 1


@pytest.mark.asyncio
async def test_claim_completed_challenge_awards_yuni(auth_client: AsyncClient) -> None:
    suffix = "-claim-ym"
    data = await register_user(auth_client, suffix=suffix)
    await activate_passport(auth_client, data["access_token"])
    headers = auth_header(data["access_token"])
    code = PassportChallengeCode.EXPLORER_CENTRE_VILLE.value

    session, user_id, passport_id, _ = await _user_session(suffix)
    try:
        await _seed_catalogs(session)
        await _complete_explorer(session, user_id, passport_id)
    finally:
        await session.close()

    response = await auth_client.post(f"{BASE}/challenges/{code}/claim", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["claimed"] is True
    assert body["ym_awarded"] == 10


@pytest.mark.asyncio
async def test_claim_updates_returned_balance(auth_client: AsyncClient) -> None:
    suffix = "-claim-balance"
    data = await register_user(auth_client, suffix=suffix)
    await activate_passport(auth_client, data["access_token"])
    headers = auth_header(data["access_token"])
    code = PassportChallengeCode.EXPLORER_CENTRE_VILLE.value

    session, user_id, passport_id, _ = await _user_session(suffix)
    try:
        await _seed_catalogs(session)
        await _complete_explorer(session, user_id, passport_id)
    finally:
        await session.close()

    response = await auth_client.post(f"{BASE}/challenges/{code}/claim", headers=headers)
    assert response.status_code == 200
    assert response.json()["new_balance"] == 10


@pytest.mark.asyncio
async def test_double_claim_is_idempotent(auth_client: AsyncClient) -> None:
    suffix = "-double-claim"
    data = await register_user(auth_client, suffix=suffix)
    await activate_passport(auth_client, data["access_token"])
    headers = auth_header(data["access_token"])
    code = PassportChallengeCode.EXPLORER_CENTRE_VILLE.value

    session, user_id, passport_id, _ = await _user_session(suffix)
    try:
        await _seed_catalogs(session)
        await _complete_explorer(session, user_id, passport_id)
    finally:
        await session.close()

    first = await auth_client.post(f"{BASE}/challenges/{code}/claim", headers=headers)
    second = await auth_client.post(f"{BASE}/challenges/{code}/claim", headers=headers)
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["claimed"] is True
    assert second.json()["claimed"] is False
    assert second.json()["ym_awarded"] == 0
    assert second.json()["new_balance"] == 10


@pytest.mark.asyncio
async def test_challenge_in_progress_cannot_be_claimed(auth_client: AsyncClient) -> None:
    suffix = "-claim-in-progress"
    data = await register_user(auth_client, suffix=suffix)
    await activate_passport(auth_client, data["access_token"])
    headers = auth_header(data["access_token"])
    code = PassportChallengeCode.EXPLORER_CENTRE_VILLE.value

    session, user_id, passport_id, _ = await _user_session(suffix)
    try:
        await _seed_catalogs(session)
        stamp = await _add_stamp(session, passport_id, suffix="partial")
        await PassportChallengeProgressService(session).increment_stamp_progress(
            user_id,
            stamp,
        )
    finally:
        await session.close()

    response = await auth_client.post(f"{BASE}/challenges/{code}/claim", headers=headers)
    assert response.status_code == 400
    assert response.json()["code"] == "PASSPORT_CHALLENGE_NOT_COMPLETED"


@pytest.mark.asyncio
async def test_wallet_suspended_cannot_claim(auth_client: AsyncClient) -> None:
    suffix = "-claim-suspended"
    data = await register_user(auth_client, suffix=suffix)
    await activate_passport(auth_client, data["access_token"])
    headers = auth_header(data["access_token"])
    code = PassportChallengeCode.EXPLORER_CENTRE_VILLE.value

    session, user_id, passport_id, _ = await _user_session(suffix)
    try:
        await _seed_catalogs(session)
        await _complete_explorer(session, user_id, passport_id)
        await YuniWalletService(session).get_or_create_wallet(user_id)
        await YuniWalletService(session).suspend_wallet(user_id, reason="api test")
    finally:
        await session.close()

    response = await auth_client.post(f"{BASE}/challenges/{code}/claim", headers=headers)
    assert response.status_code == 403
    assert response.json()["code"] == "YUNI_WALLET_SUSPENDED"
