"""Tests for dev-only promote_user CLI."""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncGenerator

import pytest
from app.core.config import Settings, get_settings
from app.db.base import Base
from app.db.dev._guards import require_non_production_env
from app.db.dev.promote_user import _validate_role_key, promote_user
from app.db.seeds.auth_rbac import seed_auth_rbac
from app.repositories.rbac_repository import RbacRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest
from app.services.auth_service import AuthService
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
        # AuthService.register assigns the USER role, so the RBAC roles must exist —
        # create_all only builds the tables (same seeding auth_client performs).
        await seed_auth_rbac(session)
        await session.commit()
        yield session

    await engine.dispose()


def test_require_non_production_env_rejects_prod() -> None:
    settings = Settings(
        APP_ENV="prod",
        DEBUG=False,
        JWT_SECRET_KEY="x" * 48,
        REFRESH_TOKEN_PEPPER="y" * 32,
        REFRESH_COOKIE_SECURE=True,
        DATABASE_URL="postgresql+asyncpg://user:pass@db:5432/yunicity_prod",
        REDIS_URL="redis://redis:6379/0",
        CORS_ORIGINS=["https://yunicity.fr"],
        WEB_FRONTEND_URL="https://yunicity.fr",
        MEDIA_PUBLIC_BASE_URL="https://api.yunicity.fr",
        EMAIL_PROVIDER="resend",
        RESEND_API_KEY="re_test_key",
        EMAIL_FROM="no-reply@yunicity.fr",
    )

    with pytest.raises(SystemExit) as exc_info:
        require_non_production_env(settings)

    assert exc_info.value.code == 1


def test_validate_unknown_role() -> None:
    with pytest.raises(ValueError, match="Rôle inconnu"):
        _validate_role_key("NOT_A_REAL_ROLE")


@pytest.mark.asyncio
async def test_promote_user_assigns_super_admin(
    auth_env: None,
    db_session: AsyncSession,
) -> None:
    auth = AuthService(db_session)
    suffix = uuid.uuid4().hex[:8]
    email = f"promote-dev-{suffix}@example.com"
    await auth.register(
        RegisterRequest(
            email=email,
            password="StrongPassword1!",
            full_name="Promote Target",
            city="Reims",
        )
    )

    user = await UserRepository(db_session).get_by_email(email)
    assert user is not None

    result = await promote_user(
        email=email,
        role_key="SUPER_ADMIN",
        settings=get_settings(),
    )
    assert result.created is True
    assert result.role_key == "SUPER_ADMIN"

    role_keys = await RbacRepository(db_session).get_role_keys_for_user(user.id)
    assert "SUPER_ADMIN" in role_keys

    again = await promote_user(
        email=email,
        role_key="SUPER_ADMIN",
        settings=get_settings(),
    )
    assert again.created is False


@pytest.mark.asyncio
async def test_promote_user_missing_email(auth_env: None) -> None:
    with pytest.raises(LookupError, match="Aucun utilisateur"):
        await promote_user(
            email="missing-promote@example.com",
            role_key="SUPER_ADMIN",
            settings=get_settings(),
        )
