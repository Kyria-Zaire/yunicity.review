"""Production admin bootstrap tests (PROD-DATA-05E)."""

from __future__ import annotations

import logging
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.core.bootstrap_constants import (
    BOOTSTRAP_ACCOUNT_ADMIN,
    BOOTSTRAP_ACCOUNT_STAFF,
    BOOTSTRAP_ACCOUNT_SUPER_ADMIN,
    BOOTSTRAP_CITY_ADMIN_ROLE,
    BOOTSTRAP_STAFF_ROLE,
    BOOTSTRAP_SUPER_ADMIN_ROLE,
)
from app.core.config import Settings
from app.core.security import generate_temporary_password, verify_password
from app.db.session import get_engine
from app.models.user import User
from app.repositories.rbac_repository import RbacRepository
from app.repositories.user_repository import UserRepository
from app.services.bootstrap_admins_service import (
    BootstrapAdminTarget,
    BootstrapSuperAdminEmailMissingError,
    bootstrap_initial_admin_accounts,
    resolve_bootstrap_admin_targets,
)
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker


def _settings(
    monkeypatch: pytest.MonkeyPatch,
    *,
    super_admin_email: str | None,
) -> Settings:
    if super_admin_email is None:
        monkeypatch.delenv("YUNICITY_BOOTSTRAP_SUPER_ADMIN_EMAIL", raising=False)
    else:
        monkeypatch.setenv("YUNICITY_BOOTSTRAP_SUPER_ADMIN_EMAIL", super_admin_email)
    return Settings(
        APP_ENV="prod",
        DATABASE_URL="postgresql+asyncpg://yunicity:yunicity@localhost:5434/yunicity_test",
        REDIS_URL="redis://localhost:6379/0",
        DEBUG=False,
        JWT_SECRET_KEY="x" * 48,
        REFRESH_TOKEN_PEPPER="y" * 32,
        REFRESH_COOKIE_SECURE=True,
        WEB_FRONTEND_URL="https://yunicity.city",
        MEDIA_PUBLIC_BASE_URL="https://api.yunicity.city",
        CORS_ORIGINS=["https://yunicity.city"],
        EMAIL_PROVIDER="console",
    )


def test_generate_temporary_password_meets_strength_rules() -> None:
    password = generate_temporary_password()
    assert len(password) >= 12
    assert any(char.isupper() for char in password)
    assert any(char.islower() for char in password)
    assert any(char.isdigit() for char in password)


def test_resolve_bootstrap_admin_targets_requires_super_admin_email(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    settings = _settings(monkeypatch, super_admin_email=None)
    with pytest.raises(BootstrapSuperAdminEmailMissingError):
        resolve_bootstrap_admin_targets(settings)


def test_resolve_bootstrap_admin_targets_maps_roles(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = _settings(monkeypatch, super_admin_email="ops@yunicity.city")
    targets = resolve_bootstrap_admin_targets(settings)
    by_key = {target.account_key: target for target in targets}

    assert by_key[BOOTSTRAP_ACCOUNT_SUPER_ADMIN].role_key == BOOTSTRAP_SUPER_ADMIN_ROLE
    assert by_key[BOOTSTRAP_ACCOUNT_ADMIN].email == "admin@yunicity.city"
    assert by_key[BOOTSTRAP_ACCOUNT_ADMIN].role_key == BOOTSTRAP_CITY_ADMIN_ROLE
    assert by_key[BOOTSTRAP_ACCOUNT_STAFF].email == "staff@yunicity.city"
    assert by_key[BOOTSTRAP_ACCOUNT_STAFF].role_key == BOOTSTRAP_STAFF_ROLE


@pytest.mark.asyncio
async def test_bootstrap_admins_logging_does_not_include_password(
    caplog: pytest.LogCaptureFixture,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    caplog.set_level(logging.INFO)
    settings = _settings(monkeypatch, super_admin_email="ops-log@yunicity.city")
    generated_password = "YnTempPasswordTest9A"

    async def fake_seed_auth_rbac(_session: object) -> None:
        return None

    class FakeRbac:
        async def get_role_keys_for_user(self, _user_id: object) -> list[str]:
            return ["USER"]

        async def assign_role_to_user(self, _user_id: object, _role_key: str) -> None:
            return None

    class FakeProfileService:
        async def create_profile_for_new_user(self, **_kwargs: object) -> None:
            return None

    class FakeUsers:
        async def get_by_email(self, _email: str) -> None:
            return None

    monkeypatch.setattr(
        "app.services.bootstrap_admins_service.seed_auth_rbac",
        fake_seed_auth_rbac,
    )
    monkeypatch.setattr(
        "app.services.bootstrap_admins_service.generate_temporary_password",
        lambda: generated_password,
    )
    monkeypatch.setattr(
        "app.services.bootstrap_admins_service.RbacRepository",
        lambda _session: FakeRbac(),
    )
    monkeypatch.setattr(
        "app.services.bootstrap_admins_service.ProfileService",
        lambda _session: FakeProfileService(),
    )
    monkeypatch.setattr(
        "app.services.bootstrap_admins_service.UserRepository",
        lambda _session: FakeUsers(),
    )

    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()

    targets = (
        BootstrapAdminTarget(
            account_key=BOOTSTRAP_ACCOUNT_SUPER_ADMIN,
            email="ops-log@yunicity.city",
            role_key=BOOTSTRAP_SUPER_ADMIN_ROLE,
            full_name="Ops",
        ),
    )

    results = await bootstrap_initial_admin_accounts(
        session,
        settings,
        targets=targets,
    )

    assert len(results) == 1
    assert results[0].temporary_password == generated_password
    for record in caplog.records:
        assert generated_password not in record.getMessage()
        assert generated_password not in str(record.__dict__)


async def _delete_users_by_email(session: AsyncSession, emails: list[str]) -> None:
    for email in emails:
        user = await UserRepository(session).get_by_email(email)
        if user is None:
            continue
        await session.execute(delete(User).where(User.id == user.id))
    await session.flush()


@pytest.mark.asyncio
@pytest.mark.integration
async def test_bootstrap_admins_creates_accounts_with_reset_flag(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip bootstrap admins integration tests")

    suffix = uuid.uuid4().hex[:8]
    super_email = f"super-{suffix}@yunicity.city"
    admin_email = f"admin-{suffix}@yunicity.city"
    staff_email = f"staff-{suffix}@yunicity.city"
    settings = _settings(monkeypatch, super_admin_email=super_email)
    targets = (
        BootstrapAdminTarget(
            account_key=BOOTSTRAP_ACCOUNT_SUPER_ADMIN,
            email=super_email,
            role_key=BOOTSTRAP_SUPER_ADMIN_ROLE,
            full_name="Super",
        ),
        BootstrapAdminTarget(
            account_key=BOOTSTRAP_ACCOUNT_ADMIN,
            email=admin_email,
            role_key=BOOTSTRAP_CITY_ADMIN_ROLE,
            full_name="Admin",
        ),
        BootstrapAdminTarget(
            account_key=BOOTSTRAP_ACCOUNT_STAFF,
            email=staff_email,
            role_key=BOOTSTRAP_STAFF_ROLE,
            full_name="Staff",
        ),
    )
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with factory() as session:
        await _delete_users_by_email(session, [super_email, admin_email, staff_email])
        await session.commit()

    async with factory() as session:
        results = await bootstrap_initial_admin_accounts(session, settings, targets=targets)
        await session.commit()

    assert len(results) == 3
    assert all(item.created for item in results)
    assert all(item.force_password_reset for item in results)
    assert all(item.temporary_password for item in results)

    async with factory() as session:
        for item in results:
            user = await UserRepository(session).get_by_email(item.email)
            assert user is not None
            assert user.force_password_reset is True
            assert user.hashed_password
            assert item.temporary_password is not None
            assert verify_password(item.temporary_password, user.hashed_password)
            roles = await RbacRepository(session).get_role_keys_for_user(user.id)
            assert item.role_key in roles


@pytest.mark.asyncio
@pytest.mark.integration
async def test_bootstrap_admins_idempotent_without_duplicates(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip bootstrap admins integration tests")

    suffix = uuid.uuid4().hex[:8]
    super_email = f"super-idem-{suffix}@yunicity.city"
    settings = _settings(monkeypatch, super_admin_email=super_email)
    targets = (
        BootstrapAdminTarget(
            account_key=BOOTSTRAP_ACCOUNT_SUPER_ADMIN,
            email=super_email,
            role_key=BOOTSTRAP_SUPER_ADMIN_ROLE,
            full_name="Super",
        ),
    )
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with factory() as session:
        await _delete_users_by_email(session, [super_email])
        await session.commit()

    async with factory() as session:
        first = await bootstrap_initial_admin_accounts(session, settings, targets=targets)
        await session.commit()
        second = await bootstrap_initial_admin_accounts(session, settings, targets=targets)
        await session.commit()

        count = (
            await session.execute(select(User).where(User.email == super_email))
        ).scalars().all()

    assert first[0].created is True
    assert second[0].created is False
    assert second[0].temporary_password is None
    assert len(count) == 1
