"""Promote an existing user to an RBAC role (dev only)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import Settings, get_settings
from app.core.security import normalize_email
from app.db.dev._guards import require_non_production_env
from app.db.seeds.auth_rbac import ROLE_DEFINITIONS, seed_auth_rbac
from app.repositories.rbac_repository import RbacRepository
from app.repositories.user_repository import UserRepository


@dataclass(frozen=True)
class PromoteUserResult:
    user_id: uuid.UUID
    email: str
    role_key: str
    created: bool


def _validate_role_key(role_key: str) -> str:
    normalized = role_key.strip().upper()
    if normalized not in ROLE_DEFINITIONS:
        allowed = ", ".join(sorted(ROLE_DEFINITIONS))
        raise ValueError(f"Rôle inconnu : {role_key!r}. Valeurs seedées : {allowed}")
    return normalized


async def promote_user(
    *,
    email: str,
    role_key: str,
    settings: Settings | None = None,
) -> PromoteUserResult:
    """
    Assign a seeded RBAC role to an existing user (global scope).

    Idempotent: if the assignment already exists, returns created=False.
    """
    resolved_settings = settings or get_settings()
    require_non_production_env(resolved_settings)

    if not resolved_settings.database_url:
        raise RuntimeError("DATABASE_URL is required")

    normalized_email = normalize_email(email)
    normalized_role = _validate_role_key(role_key)

    engine = create_async_engine(resolved_settings.database_url, pool_pre_ping=True)
    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    try:
        async with session_factory() as session:
            await seed_auth_rbac(session)

            user = await UserRepository(session).get_by_email(normalized_email)
            if user is None:
                raise LookupError(f"Aucun utilisateur avec l'email {normalized_email!r}")

            rbac = RbacRepository(session)
            existing_keys = await rbac.get_role_keys_for_user(user.id)
            already_assigned = normalized_role in existing_keys

            await rbac.assign_role_to_user(user.id, normalized_role)
            await session.commit()

            return PromoteUserResult(
                user_id=user.id,
                email=user.email,
                role_key=normalized_role,
                created=not already_assigned,
            )
    finally:
        await engine.dispose()
