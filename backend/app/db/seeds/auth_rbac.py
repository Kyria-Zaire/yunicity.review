"""Idempotent RBAC seed — roles, permissions, role_permissions. No users."""

from __future__ import annotations

from collections.abc import Mapping

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rbac import Permission, Role, RolePermission

ROLE_DEFINITIONS: dict[str, tuple[str, str | None]] = {
    "USER": ("Citoyen", "Utilisateur standard de la plateforme"),
    "MODERATOR": ("Modérateur", "Modération de contenus"),
    "CITY_ADMIN": ("Admin ville", "Administration locale"),
    "SUPER_ADMIN": ("Super administrateur", "Administration système"),
}

PERMISSION_DEFINITIONS: dict[str, str] = {
    "auth.me.read": "Lire le profil et le contexte auth courant",
    "users.read.self": "Lire ses propres données utilisateur",
    "users.update.self": "Modifier son profil (champs autorisés)",
    "users.read.all": "Lister et lire les utilisateurs (admin)",
    "users.manage.status": "Suspendre ou réactiver un compte",
    "moderation.read": "Consulter les files de modération",
    "moderation.manage": "Actions de modération",
    "roles.assign": "Attribuer ou retirer des rôles",
    "system.admin": "Opérations système réservées super admin",
}

ROLE_PERMISSION_KEYS: Mapping[str, frozenset[str]] = {
    "USER": frozenset(
        {
            "auth.me.read",
            "users.read.self",
            "users.update.self",
        }
    ),
    "MODERATOR": frozenset(
        {
            "auth.me.read",
            "users.read.self",
            "users.update.self",
            "moderation.read",
            "moderation.manage",
        }
    ),
    "CITY_ADMIN": frozenset(
        {
            "auth.me.read",
            "users.read.self",
            "users.update.self",
            "users.read.all",
            "users.manage.status",
            "moderation.read",
            "moderation.manage",
        }
    ),
    "SUPER_ADMIN": frozenset(PERMISSION_DEFINITIONS.keys()),
}


async def _get_or_create_role(session: AsyncSession, key: str) -> Role:
    result = await session.execute(select(Role).where(Role.key == key))
    role = result.scalar_one_or_none()
    if role is not None:
        return role
    name, description = ROLE_DEFINITIONS[key]
    role = Role(key=key, name=name, description=description, is_system=True)
    session.add(role)
    await session.flush()
    return role


async def _get_or_create_permission(session: AsyncSession, key: str) -> Permission:
    result = await session.execute(select(Permission).where(Permission.key == key))
    permission = result.scalar_one_or_none()
    if permission is not None:
        return permission
    permission = Permission(key=key, description=PERMISSION_DEFINITIONS[key])
    session.add(permission)
    await session.flush()
    return permission


async def _ensure_role_permission(
    session: AsyncSession,
    role: Role,
    permission: Permission,
) -> None:
    result = await session.execute(
        select(RolePermission).where(
            RolePermission.role_id == role.id,
            RolePermission.permission_id == permission.id,
        )
    )
    if result.scalar_one_or_none() is not None:
        return
    session.add(RolePermission(role_id=role.id, permission_id=permission.id))


async def seed_auth_rbac(session: AsyncSession) -> None:
    """Seed MVP roles and permissions. Safe to run multiple times."""
    permissions_by_key: dict[str, Permission] = {}
    for key in PERMISSION_DEFINITIONS:
        permissions_by_key[key] = await _get_or_create_permission(session, key)

    roles_by_key: dict[str, Role] = {}
    for key in ROLE_DEFINITIONS:
        roles_by_key[key] = await _get_or_create_role(session, key)

    for role_key, permission_keys in ROLE_PERMISSION_KEYS.items():
        role = roles_by_key[role_key]
        for permission_key in permission_keys:
            await _ensure_role_permission(
                session,
                role,
                permissions_by_key[permission_key],
            )
