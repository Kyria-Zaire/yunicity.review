"""Initial production admin bootstrap (PROD-DATA-05E)."""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.bootstrap_constants import (
    BOOTSTRAP_ACCOUNT_ADMIN,
    BOOTSTRAP_ACCOUNT_STAFF,
    BOOTSTRAP_ACCOUNT_SUPER_ADMIN,
    BOOTSTRAP_CITY_ADMIN_ROLE,
    BOOTSTRAP_STAFF_ROLE,
    BOOTSTRAP_SUPER_ADMIN_ROLE,
    PROD_BOOTSTRAP_ADMIN_EMAIL,
    PROD_BOOTSTRAP_STAFF_EMAIL,
)
from app.core.config import Settings
from app.core.security import (
    generate_temporary_password,
    hash_password,
    normalize_email,
)
from app.db.seeds.auth_rbac import seed_auth_rbac
from app.models.user import User
from app.repositories.profile_repository import ProfileRepository
from app.repositories.rbac_repository import RbacRepository
from app.repositories.user_repository import UserRepository
from app.services.profile_service import ProfileService

logger = logging.getLogger(__name__)


class BootstrapSuperAdminEmailMissingError(RuntimeError):
    """Raised when the SUPER_ADMIN bootstrap email is not configured."""


@dataclass(frozen=True)
class BootstrapAdminTarget:
    account_key: str
    email: str
    role_key: str
    full_name: str
    is_system_account: bool = True


@dataclass(frozen=True)
class BootstrapAdminAccountResult:
    account_key: str
    email: str
    role_key: str
    user_id: uuid.UUID | None
    created: bool
    role_assigned: bool
    force_password_reset: bool
    temporary_password: str | None


def resolve_bootstrap_admin_targets(settings: Settings) -> tuple[BootstrapAdminTarget, ...]:
    """Resolve the three initial admin accounts for production bootstrap."""
    super_admin_email_raw = settings.bootstrap_super_admin_email
    if not super_admin_email_raw or not super_admin_email_raw.strip():
        raise BootstrapSuperAdminEmailMissingError(
            "YUNICITY_BOOTSTRAP_SUPER_ADMIN_EMAIL must be set for bootstrap_admins."
        )

    return (
        BootstrapAdminTarget(
            account_key=BOOTSTRAP_ACCOUNT_SUPER_ADMIN,
            email=normalize_email(super_admin_email_raw),
            role_key=BOOTSTRAP_SUPER_ADMIN_ROLE,
            full_name="Yunicity Super Admin",
        ),
        BootstrapAdminTarget(
            account_key=BOOTSTRAP_ACCOUNT_ADMIN,
            email=normalize_email(PROD_BOOTSTRAP_ADMIN_EMAIL),
            role_key=BOOTSTRAP_CITY_ADMIN_ROLE,
            full_name="Yunicity Admin",
        ),
        BootstrapAdminTarget(
            account_key=BOOTSTRAP_ACCOUNT_STAFF,
            email=normalize_email(PROD_BOOTSTRAP_STAFF_EMAIL),
            role_key=BOOTSTRAP_STAFF_ROLE,
            full_name="Yunicity Staff",
        ),
    )


async def _ensure_role(
    rbac: RbacRepository,
    *,
    user_id: uuid.UUID,
    role_key: str,
) -> bool:
    role_keys = await rbac.get_role_keys_for_user(user_id)
    if role_key in role_keys:
        return False
    await rbac.assign_role_to_user(user_id, role_key)
    return True


async def _bootstrap_single_account(
    session: AsyncSession,
    *,
    target: BootstrapAdminTarget,
    users: UserRepository,
    rbac: RbacRepository,
    profile_service: ProfileService,
) -> BootstrapAdminAccountResult:
    existing = await users.get_by_email(target.email)
    if existing is not None:
        role_assigned = await _ensure_role(rbac, user_id=existing.id, role_key=target.role_key)
        await session.flush()
        logger.info(
            "bootstrap_admin_account_skipped",
            extra={
                "account_key": target.account_key,
                "email": target.email,
                "role_key": target.role_key,
                "user_id": str(existing.id),
                "account_created": False,
                "role_assigned": role_assigned,
            },
        )
        return BootstrapAdminAccountResult(
            account_key=target.account_key,
            email=target.email,
            role_key=target.role_key,
            user_id=existing.id,
            created=False,
            role_assigned=role_assigned,
            force_password_reset=existing.force_password_reset,
            temporary_password=None,
        )

    temporary_password = generate_temporary_password()
    user = User(
        email=target.email,
        hashed_password=hash_password(temporary_password),
        full_name=target.full_name,
        city="Reims",
        is_active=True,
        is_verified=True,
        is_system_account=target.is_system_account,
        force_password_reset=True,
    )
    session.add(user)
    await session.flush()

    await rbac.assign_role_to_user(user.id, "USER")
    role_assigned = await _ensure_role(rbac, user_id=user.id, role_key=target.role_key)
    await profile_service.create_profile_for_new_user(
        user_id=user.id,
        email=target.email,
        full_name=target.full_name,
        city="Reims",
    )
    await session.flush()

    logger.info(
        "bootstrap_admin_account_created",
        extra={
            "account_key": target.account_key,
            "email": target.email,
            "role_key": target.role_key,
            "user_id": str(user.id),
            "account_created": True,
            "role_assigned": role_assigned,
            "force_password_reset": True,
        },
    )
    return BootstrapAdminAccountResult(
        account_key=target.account_key,
        email=target.email,
        role_key=target.role_key,
        user_id=user.id,
        created=True,
        role_assigned=role_assigned,
        force_password_reset=True,
        temporary_password=temporary_password,
    )


async def bootstrap_initial_admin_accounts(
    session: AsyncSession,
    settings: Settings,
    *,
    targets: tuple[BootstrapAdminTarget, ...] | None = None,
) -> list[BootstrapAdminAccountResult]:
    """Create initial admin accounts if absent. Passwords are returned only on creation."""
    resolved_targets = targets or resolve_bootstrap_admin_targets(settings)
    await seed_auth_rbac(session)

    users = UserRepository(session)
    rbac = RbacRepository(session)
    profile_service = ProfileService(session)

    results: list[BootstrapAdminAccountResult] = []
    for target in resolved_targets:
        result = await _bootstrap_single_account(
            session,
            target=target,
            users=users,
            rbac=rbac,
            profile_service=profile_service,
        )
        results.append(result)

    created_count = sum(1 for item in results if item.created)
    logger.info(
        "bootstrap_admins_completed",
        extra={
            "accounts_total": len(results),
            "accounts_created": created_count,
            "accounts_skipped": len(results) - created_count,
        },
    )
    return results
