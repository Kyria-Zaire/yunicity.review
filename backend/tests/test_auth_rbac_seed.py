"""Integration tests for RBAC seed (requires DATABASE_URL)."""

import os
import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta

import pytest
from app.db.base import Base
from app.db.seeds.auth_rbac import (
    PERMISSION_DEFINITIONS,
    ROLE_DEFINITIONS,
    ROLE_PERMISSION_KEYS,
    seed_auth_rbac,
)
from app.models.rbac import Permission, Role, RolePermission
from app.models.refresh_token import RefreshToken
from app.models.user import User
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

pytestmark = pytest.mark.integration


def _database_url() -> str | None:
    return os.environ.get("DATABASE_URL")


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    database_url = _database_url()
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip integration tests")

    engine = create_async_engine(database_url, pool_pre_ping=True)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_seed_idempotent(db_session: AsyncSession) -> None:
    await seed_auth_rbac(db_session)
    await db_session.commit()

    role_count_first = await db_session.scalar(select(func.count()).select_from(Role))
    permission_count_first = await db_session.scalar(
        select(func.count()).select_from(Permission)
    )

    await seed_auth_rbac(db_session)
    await db_session.commit()

    role_count_second = await db_session.scalar(select(func.count()).select_from(Role))
    permission_count_second = await db_session.scalar(
        select(func.count()).select_from(Permission)
    )

    assert role_count_first == role_count_second == len(ROLE_DEFINITIONS)
    assert permission_count_first == permission_count_second == len(PERMISSION_DEFINITIONS)


@pytest.mark.asyncio
async def test_roles_and_permissions_seeded(db_session: AsyncSession) -> None:
    await seed_auth_rbac(db_session)
    await db_session.commit()

    roles = (await db_session.execute(select(Role).order_by(Role.key))).scalars().all()
    assert [role.key for role in roles] == sorted(ROLE_DEFINITIONS.keys())

    permissions = (
        await db_session.execute(select(Permission).order_by(Permission.key))
    ).scalars().all()
    assert [perm.key for perm in permissions] == sorted(PERMISSION_DEFINITIONS.keys())


@pytest.mark.asyncio
async def test_super_admin_has_all_permissions(db_session: AsyncSession) -> None:
    await seed_auth_rbac(db_session)
    await db_session.commit()

    result = await db_session.execute(
        select(Permission.key)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(Role, Role.id == RolePermission.role_id)
        .where(Role.key == "SUPER_ADMIN")
        .order_by(Permission.key)
    )
    super_admin_permissions = set(result.scalars().all())
    assert super_admin_permissions == set(PERMISSION_DEFINITIONS.keys())


@pytest.mark.asyncio
async def test_user_role_has_only_self_permissions(db_session: AsyncSession) -> None:
    await seed_auth_rbac(db_session)
    await db_session.commit()

    result = await db_session.execute(
        select(Permission.key)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(Role, Role.id == RolePermission.role_id)
        .where(Role.key == "USER")
        .order_by(Permission.key)
    )
    user_permissions = set(result.scalars().all())
    assert user_permissions == set(ROLE_PERMISSION_KEYS["USER"])


@pytest.mark.asyncio
async def test_unique_email_constraint(db_session: AsyncSession) -> None:
    user = User(
        email="duplicate@example.com",
        hashed_password="hashed-not-plain",
        full_name="Test User",
    )
    db_session.add(user)
    await db_session.commit()

    duplicate = User(
        email="duplicate@example.com",
        hashed_password="hashed-not-plain",
        full_name="Other User",
    )
    db_session.add(duplicate)
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()


@pytest.mark.asyncio
async def test_refresh_token_unique_hash(db_session: AsyncSession) -> None:
    user = User(
        email="token-user@example.com",
        hashed_password="hashed-not-plain",
        full_name="Token User",
    )
    db_session.add(user)
    await db_session.flush()

    expires = datetime.now(UTC) + timedelta(days=30)
    family_id = uuid.uuid4()
    db_session.add(
        RefreshToken(
            user_id=user.id,
            token_hash="hash-one",
            family_id=family_id,
            expires_at=expires,
        )
    )
    await db_session.commit()

    db_session.add(
        RefreshToken(
            user_id=user.id,
            token_hash="hash-one",
            family_id=family_id,
            expires_at=expires,
        )
    )
    with pytest.raises(IntegrityError):
        await db_session.commit()
