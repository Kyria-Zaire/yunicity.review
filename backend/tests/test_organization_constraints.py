"""Organization DB constraint integration tests."""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncGenerator

import pytest
from app.core.organization_constants import (
    OrganizationMemberRole,
    OrganizationMemberStatus,
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.db.base import Base
from app.db.session import dispose_db, get_engine, init_db
from app.models.organization import Organization, OrganizationMember, OrganizationVerification
from app.models.user import User
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def org_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[AsyncSession, None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip organization constraint tests")
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-at-least-32-characters-long!!")

    from app.core.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    init_db(settings)
    engine = get_engine()
    assert engine is not None
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        user = User(
            id=uuid.uuid4(),
            email=f"org-test-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Org Tester",
            city="Reims",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        session.info["test_user_id"] = user.id
        yield session

    await dispose_db()
    get_settings.cache_clear()


async def _create_org(session: AsyncSession, *, slug: str) -> Organization:
    org = Organization(
        slug=slug,
        name="Test Organization",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.PENDING,
        visibility=OrganizationVisibility.PRIVATE,
    )
    session.add(org)
    await session.flush()
    return org


@pytest.mark.asyncio
async def test_unique_slug_constraint(org_db: AsyncSession) -> None:
    await _create_org(org_db, slug="unique-slug-test")
    await org_db.commit()

    org_db.add(
        Organization(
            slug="unique-slug-test",
            name="Duplicate",
            type=OrganizationType.ASSOCIATION,
            city="Reims",
        )
    )
    with pytest.raises(IntegrityError):
        await org_db.commit()
    await org_db.rollback()


@pytest.mark.asyncio
async def test_unique_membership_constraint(org_db: AsyncSession) -> None:
    user_id = org_db.info["test_user_id"]
    org = await _create_org(org_db, slug="membership-unique-test")
    org_db.add(
        OrganizationMember(
            organization_id=org.id,
            user_id=user_id,
            role=OrganizationMemberRole.MEMBER,
            status=OrganizationMemberStatus.ACTIVE,
        )
    )
    await org_db.commit()

    org_db.add(
        OrganizationMember(
            organization_id=org.id,
            user_id=user_id,
            role=OrganizationMemberRole.ADMIN,
            status=OrganizationMemberStatus.ACTIVE,
        )
    )
    with pytest.raises(IntegrityError):
        await org_db.commit()
    await org_db.rollback()


@pytest.mark.asyncio
async def test_one_active_owner_per_organization(org_db: AsyncSession) -> None:
    user_id = org_db.info["test_user_id"]
    other_user = User(
        id=uuid.uuid4(),
        email=f"org-owner2-{uuid.uuid4().hex[:8]}@example.com",
        hashed_password="hashed",
        full_name="Owner Two",
        city="Reims",
    )
    org_db.add(other_user)
    org = await _create_org(org_db, slug="one-owner-test")
    org_db.add_all(
        [
            OrganizationMember(
                organization_id=org.id,
                user_id=user_id,
                role=OrganizationMemberRole.OWNER,
                status=OrganizationMemberStatus.ACTIVE,
            ),
            OrganizationMember(
                organization_id=org.id,
                user_id=other_user.id,
                role=OrganizationMemberRole.OWNER,
                status=OrganizationMemberStatus.ACTIVE,
            ),
        ]
    )
    with pytest.raises(IntegrityError):
        await org_db.commit()
    await org_db.rollback()


@pytest.mark.asyncio
async def test_verification_history_persisted(org_db: AsyncSession) -> None:
    org = await _create_org(org_db, slug="verification-history-test")
    org_db.add(
        OrganizationVerification(
            organization_id=org.id,
            previous_status=VerificationStatus.PENDING,
            new_status=VerificationStatus.UNDER_REVIEW,
            metadata_={"source": "test"},
        )
    )
    await org_db.commit()
    assert org.id is not None


@pytest.mark.asyncio
async def test_organization_defaults_pending_private(org_db: AsyncSession) -> None:
    org = await _create_org(org_db, slug="defaults-test-org")
    await org_db.commit()
    await org_db.refresh(org)
    assert org.verification_status == VerificationStatus.PENDING
    assert org.visibility == OrganizationVisibility.PRIVATE
