"""Idempotent bootstrap SUPER_ADMIN account (PLATFORM-AUTH-RECOVERY-01)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.bootstrap_constants import (
    BOOTSTRAP_SUPER_ADMIN_ROLE,
    DEV_BOOTSTRAP_ADMIN_EMAIL,
    DEV_BOOTSTRAP_ADMIN_FULL_NAME,
    DEV_BOOTSTRAP_ADMIN_PASSWORD,
)
from app.core.config import Settings
from app.core.security import (
    hash_password,
    normalize_email,
    validate_password_strength,
    verify_password,
)
from app.db.seeds.auth_rbac import seed_auth_rbac
from app.models.user import User
from app.repositories.profile_repository import ProfileRepository
from app.repositories.rbac_repository import RbacRepository
from app.repositories.user_repository import UserRepository
from app.services.profile_service import ProfileService


class BootstrapCredentialsMissingError(RuntimeError):
    """Raised when bootstrap credentials are not configured."""


@dataclass(frozen=True)
class BootstrapAdminResult:
    user_id: uuid.UUID
    email: str
    role: str
    active: bool
    created: bool
    password_reset: bool
    role_restored: bool


def resolve_bootstrap_credentials(settings: Settings) -> tuple[str, str, str]:
    """Return (email, password, full_name) for bootstrap upsert."""
    email_raw = settings.bootstrap_admin_email
    password_raw = settings.bootstrap_admin_password

    if email_raw and password_raw:
        email = normalize_email(email_raw)
        password = password_raw
        full_name = settings.bootstrap_admin_full_name.strip() or DEV_BOOTSTRAP_ADMIN_FULL_NAME
        validate_password_strength(password)
        return email, password, full_name

    if settings.app_env in ("dev", "recette"):
        validate_password_strength(DEV_BOOTSTRAP_ADMIN_PASSWORD)
        return (
            normalize_email(DEV_BOOTSTRAP_ADMIN_EMAIL),
            DEV_BOOTSTRAP_ADMIN_PASSWORD,
            DEV_BOOTSTRAP_ADMIN_FULL_NAME,
        )

    raise BootstrapCredentialsMissingError(
        "YUNICITY_BOOTSTRAP_ADMIN_EMAIL and YUNICITY_BOOTSTRAP_ADMIN_PASSWORD "
        "must be set for bootstrap outside dev/recette."
    )


async def bootstrap_admin_account(
    session: AsyncSession,
    settings: Settings,
) -> BootstrapAdminResult:
    """Create or repair the platform bootstrap SUPER_ADMIN account."""
    email, password, full_name = resolve_bootstrap_credentials(settings)
    await seed_auth_rbac(session)

    users = UserRepository(session)
    rbac = RbacRepository(session)
    profile_service = ProfileService(session)

    user = await users.get_by_email(email)
    created = user is None
    password_reset = False
    role_restored = False

    hashed = hash_password(password)

    if user is None:
        user = User(
            email=email,
            hashed_password=hashed,
            full_name=full_name,
            city="Reims",
            is_active=True,
            is_verified=True,
            is_system_account=True,
        )
        session.add(user)
        await session.flush()
        password_reset = True
        await rbac.assign_role_to_user(user.id, "USER")
        await profile_service.create_profile_for_new_user(
            user_id=user.id,
            email=email,
            full_name=full_name,
            city="Reims",
        )
    else:
        password_reset = True
        if user.hashed_password and user.hashed_password != "!locked":
            try:
                password_reset = not verify_password(password, user.hashed_password)
            except Exception:
                password_reset = True
        if password_reset:
            user.hashed_password = hash_password(password)
        user.full_name = full_name
        user.city = user.city or "Reims"
        user.is_active = True
        user.is_verified = True
        user.is_system_account = True
        await session.flush()
        profile = await ProfileRepository(session).get_by_user_id(user.id)
        if profile is None:
            await profile_service.create_profile_for_new_user(
                user_id=user.id,
                email=email,
                full_name=full_name,
                city=user.city,
            )

    role_keys = await rbac.get_role_keys_for_user(user.id)
    if BOOTSTRAP_SUPER_ADMIN_ROLE not in role_keys:
        await rbac.assign_role_to_user(user.id, BOOTSTRAP_SUPER_ADMIN_ROLE)
        role_restored = True

    await session.flush()

    return BootstrapAdminResult(
        user_id=user.id,
        email=user.email,
        role=BOOTSTRAP_SUPER_ADMIN_ROLE,
        active=user.is_active,
        created=created,
        password_reset=password_reset,
        role_restored=role_restored,
    )
