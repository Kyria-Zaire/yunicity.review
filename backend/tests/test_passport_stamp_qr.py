"""Passport stamp QR claim integration tests (WEB-PARTNERS-04A)."""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncGenerator, Iterator

import jwt
import pytest
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.passport_constants import PassportStampSource
from app.core.passport_stamp_qr import STAMP_QR_TOKEN_TYPE, generate_stamp_qr_token
from app.db.seeds.reims_signed_partners import seed_reims_signed_partners
from app.db.session import dispose_db, get_session_factory, init_db
from app.main import create_app
from app.models.partner_profile import PartnerProfile
from app.models.passport import Passport
from app.models.user import User
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker


def _database_url() -> str | None:
    return os.environ.get("DATABASE_URL")


@pytest.fixture
def stamp_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    database_url = _database_url()
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip stamp QR integration tests")
    monkeypatch.setenv("DATABASE_URL", database_url)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
async def stamp_client(stamp_env: None) -> AsyncGenerator[AsyncClient, None]:
    settings = get_settings()
    init_db(settings)
    application = create_app()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    await dispose_db()


@pytest.fixture
async def seeded_partners(stamp_client: AsyncClient) -> None:
    session_factory = get_session_factory()
    if session_factory is None:
        pytest.skip("Database session factory not configured")
    async with session_factory() as session:
        await seed_reims_signed_partners(session)
        await session.commit()


async def _create_test_user_with_passport(
    session_factory: async_sessionmaker[AsyncSession],
) -> tuple[User, Passport, str]:
    """Create a test user, activate their passport, return (user, passport, auth_token)."""
    from app.core.security import create_access_token, hash_password
    from app.models.passport import PassportTier

    async with session_factory() as session:
        # Create user
        test_user = User(
            id=uuid.uuid4(),
            email=f"stamp_test_{uuid.uuid4().hex[:8]}@example.com",
            hashed_password=hash_password("TestPassword123!"),
            full_name="Stamp QR Tester",
            is_active=True,
        )
        session.add(test_user)

        # Get basic tier
        tier = await session.scalar(
            select(PassportTier).where(PassportTier.code == "basic").limit(1)
        )
        if tier is None:
            from app.db.seeds.passport_tiers import seed_passport_tiers
            await seed_passport_tiers(session)
            await session.flush()
            tier = await session.scalar(
                select(PassportTier).where(PassportTier.code == "basic").limit(1)
            )
        assert tier is not None

        # Create passport
        passport = Passport(
            id=uuid.uuid4(),
            user_id=test_user.id,
            tier_id=tier.id,
            city="Reims",
            passport_number=f"YNCP-{uuid.uuid4().hex[:8].upper()}",
            qr_token=uuid.uuid4().hex,
            stamps_count=0,
        )
        session.add(passport)
        await session.commit()

        auth_token = create_access_token(test_user.id)
        return test_user, passport, auth_token


async def _get_active_profile(session_factory: async_sessionmaker[AsyncSession]) -> PartnerProfile:
    """Return the first active partner profile."""
    async with session_factory() as session:
        result = await session.execute(
            select(PartnerProfile)
            .where(
                PartnerProfile.partner_status.in_(["active", "premium", "founding_partner"])
            )
            .limit(1)
        )
        profile = result.scalar_one_or_none()
        assert profile is not None
        return profile


def _make_valid_token(
    organization_id: str,
    partner_profile_id: str,
    *,
    partner_offer_id: str | None = None,
    expires_in_minutes: int = 60,
) -> str:
    token, _ = generate_stamp_qr_token(
        organization_id=organization_id,
        partner_profile_id=partner_profile_id,
        partner_offer_id=partner_offer_id,
        expires_in_minutes=expires_in_minutes,
    )
    return token


def _make_expired_token(organization_id: str, partner_profile_id: str) -> str:
    import secrets
    from datetime import UTC, datetime, timedelta

    settings = get_settings()
    now = datetime.now(UTC)
    payload = {
        "typ": STAMP_QR_TOKEN_TYPE,
        "organization_id": organization_id,
        "partner_profile_id": partner_profile_id,
        "nonce": secrets.token_urlsafe(16),
        "iat": now,
        "exp": now - timedelta(seconds=1),  # already expired
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


@pytest.mark.integration
@pytest.mark.anyio
async def test_claim_valid_token_creates_stamp(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None

    _, _, auth_token = await _create_test_user_with_passport(session_factory)
    profile = await _get_active_profile(session_factory)
    token = _make_valid_token(str(profile.organization_id), str(profile.id))

    response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "created"
    assert body["already_claimed"] is False
    assert body["stamp"]["stamp_source"] == "qr"
    assert body["passport"]["stamps_count"] == 1


@pytest.mark.integration
@pytest.mark.anyio
async def test_claim_persists_stamp_with_active_logging(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    """Regression PASSPORT-QR-FIX-01: reserved LogRecord key 'created' in extra crashed claim."""
    configure_logging(get_settings())

    session_factory = get_session_factory()
    assert session_factory is not None

    _, _, auth_token = await _create_test_user_with_passport(session_factory)
    profile = await _get_active_profile(session_factory)
    token = _make_valid_token(str(profile.organization_id), str(profile.id))

    claim_response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert claim_response.status_code == 201
    assert claim_response.json()["status"] == "created"

    list_response = await stamp_client.get(
        "/api/v1/passport/stamps",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert list_response.status_code == 200
    stamps_body = list_response.json()
    assert stamps_body["total"] == 1
    assert stamps_body["items"][0]["stamp_source"] == "qr"


@pytest.mark.integration
@pytest.mark.anyio
async def test_claim_same_token_twice_returns_already_claimed(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None

    _, _, auth_token = await _create_test_user_with_passport(session_factory)
    profile = await _get_active_profile(session_factory)
    token = _make_valid_token(str(profile.organization_id), str(profile.id))

    first = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert first.status_code == 201

    second = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert second.status_code == 200
    assert second.json()["status"] == "already_claimed"
    assert second.json()["already_claimed"] is True


@pytest.mark.integration
@pytest.mark.anyio
async def test_existing_stamp_from_old_flow_returns_already_claimed(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    """A stamp created via Mode 1 (ORGANIZATION source) blocks Mode 2 claim."""
    from datetime import UTC, datetime

    from app.repositories.passport_repository import PassportRepository

    session_factory = get_session_factory()
    assert session_factory is not None

    user, passport, auth_token = await _create_test_user_with_passport(session_factory)
    profile = await _get_active_profile(session_factory)

    # Pre-create a stamp with ORGANIZATION source (simulating Mode 1)
    async with session_factory() as session:
        repo = PassportRepository(session)
        await repo.add_stamp_if_missing(
            passport_id=passport.id,
            organization_id=profile.organization_id,
            stamped_at=datetime.now(UTC),
            stamp_source=PassportStampSource.ORGANIZATION,
        )
        await session.commit()

    # Mode 2 claim on the same org should return already_claimed
    token = _make_valid_token(str(profile.organization_id), str(profile.id))
    response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 200
    assert response.json()["already_claimed"] is True


@pytest.mark.integration
@pytest.mark.anyio
async def test_claim_expired_token_returns_410(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None

    _, _, auth_token = await _create_test_user_with_passport(session_factory)
    profile = await _get_active_profile(session_factory)
    token = _make_expired_token(str(profile.organization_id), str(profile.id))

    response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 410
    assert response.json()["code"] == "STAMP_TOKEN_EXPIRED"


@pytest.mark.integration
@pytest.mark.anyio
async def test_claim_invalid_signature_returns_400(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    import secrets as _secrets
    from datetime import UTC, datetime, timedelta

    session_factory = get_session_factory()
    assert session_factory is not None

    _, _, auth_token = await _create_test_user_with_passport(session_factory)
    profile = await _get_active_profile(session_factory)

    bad_secret = "wrong_secret_key_that_does_not_match"
    payload = {
        "typ": STAMP_QR_TOKEN_TYPE,
        "organization_id": str(profile.organization_id),
        "partner_profile_id": str(profile.id),
        "nonce": _secrets.token_urlsafe(16),
        "iat": datetime.now(UTC),
        "exp": datetime.now(UTC) + timedelta(hours=1),
    }
    bad_token = jwt.encode(payload, bad_secret, algorithm="HS256")

    response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": bad_token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 400
    assert response.json()["code"] == "STAMP_TOKEN_INVALID"


@pytest.mark.integration
@pytest.mark.anyio
async def test_claim_signed_partner_returns_403(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None

    _, _, auth_token = await _create_test_user_with_passport(session_factory)

    # Find a signed (non-public) partner
    async with session_factory() as session:
        result = await session.execute(
            select(PartnerProfile)
            .where(PartnerProfile.partner_status == "signed")
            .limit(1)
        )
        signed_profile = result.scalar_one_or_none()
    if signed_profile is None:
        pytest.skip("No signed partner in seed data")

    token = _make_valid_token(str(signed_profile.organization_id), str(signed_profile.id))

    response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 403
    assert response.json()["code"] == "PARTNER_NOT_ACTIVE"


@pytest.mark.integration
@pytest.mark.anyio
async def test_claim_unauthenticated_returns_401(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": "any_token"},
    )
    assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.anyio
async def test_claim_response_does_not_expose_internal_fields(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None

    _, _, auth_token = await _create_test_user_with_passport(session_factory)
    profile = await _get_active_profile(session_factory)
    token = _make_valid_token(str(profile.organization_id), str(profile.id))

    response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    body = response.json()
    stamp = body["stamp"]
    for forbidden in ("passport_id", "metadata", "stamped_by_user_id", "metadata_"):
        assert forbidden not in stamp, f"Internal field '{forbidden}' exposed in claim response"


@pytest.mark.integration
@pytest.mark.anyio
async def test_list_stamps_returns_only_current_user_stamps(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None

    _, _, auth_token_a = await _create_test_user_with_passport(session_factory)
    _, _, auth_token_b = await _create_test_user_with_passport(session_factory)
    profile = await _get_active_profile(session_factory)

    # User A claims a stamp
    token = _make_valid_token(str(profile.organization_id), str(profile.id))
    claim_response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token_a}"},
    )
    assert claim_response.status_code == 201

    # User B lists stamps — should see 0
    list_response = await stamp_client.get(
        "/api/v1/passport/stamps",
        headers={"Authorization": f"Bearer {auth_token_b}"},
    )
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 0


@pytest.mark.integration
@pytest.mark.anyio
async def test_generate_qr_requires_auth(stamp_client: AsyncClient) -> None:
    response = await stamp_client.post(
        "/api/v1/partners/belga-queen/passport-qr",
        json={},
    )
    assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.anyio
async def test_generate_qr_non_member_returns_403(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None

    _, _, auth_token = await _create_test_user_with_passport(session_factory)

    response = await stamp_client.post(
        "/api/v1/partners/belga-queen/passport-qr",
        json={"expires_in_minutes": 60},
        headers={"Authorization": f"Bearer {auth_token}"},
        params={"city": "Reims"},
    )
    assert response.status_code == 403
