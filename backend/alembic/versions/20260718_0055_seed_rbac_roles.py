"""seed RBAC roles, permissions and mappings (OPS-01)

Revision ID: 20260718_0055
Revises: 20260708_0054

AuthService.register assigns the USER role and raises if it is missing, so a database
rebuilt without `python -m app.db.seeds` (new environment, restore, disaster recovery)
would answer 500 to every registration. Seed the MVP roles here so any deployment or
rebuild is self-sufficient.

Idempotent by construction (ON CONFLICT DO NOTHING): safe on a fresh database and on one
already seeded by the CLI, and safe to re-run.

The definitions are inlined rather than imported from app.db.seeds.auth_rbac on purpose:
a revision must stay a stable historical snapshot. Changing ROLE_DEFINITIONS later has to
ship its own migration instead of silently rewriting what this one did.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260718_0055"
down_revision: str | None = "20260708_0054"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


_ROLES: tuple[tuple[str, str, str], ...] = (
    ("USER", "Citoyen", "Utilisateur standard de la plateforme"),
    ("MODERATOR", "Modérateur", "Modération de contenus"),
    ("CITY_ADMIN", "Admin ville", "Administration locale"),
    ("SUPER_ADMIN", "Super administrateur", "Administration système"),
)

_PERMISSIONS: tuple[tuple[str, str], ...] = (
    ("auth.me.read", "Lire le profil et le contexte auth courant"),
    ("users.read.self", "Lire ses propres données utilisateur"),
    ("users.update.self", "Modifier son profil (champs autorisés)"),
    ("users.read.all", "Lister et lire les utilisateurs (admin)"),
    ("users.manage.status", "Suspendre ou réactiver un compte"),
    ("moderation.read", "Consulter les files de modération"),
    ("moderation.manage", "Actions de modération"),
    ("roles.assign", "Attribuer ou retirer des rôles"),
    ("system.admin", "Opérations système réservées super admin"),
)

_ALL_PERMISSION_KEYS: tuple[str, ...] = tuple(key for key, _ in _PERMISSIONS)

_ROLE_PERMISSIONS: dict[str, tuple[str, ...]] = {
    "USER": ("auth.me.read", "users.read.self", "users.update.self"),
    "MODERATOR": (
        "auth.me.read",
        "users.read.self",
        "users.update.self",
        "moderation.read",
        "moderation.manage",
    ),
    "CITY_ADMIN": (
        "auth.me.read",
        "users.read.self",
        "users.update.self",
        "users.read.all",
        "users.manage.status",
        "moderation.read",
        "moderation.manage",
    ),
    "SUPER_ADMIN": _ALL_PERMISSION_KEYS,
}

_INSERT_ROLE = sa.text(
    """
    INSERT INTO roles (id, key, name, description, is_system)
    VALUES (gen_random_uuid(), :key, :name, :description, true)
    ON CONFLICT (key) DO NOTHING
    """
)

_INSERT_PERMISSION = sa.text(
    """
    INSERT INTO permissions (id, key, description)
    VALUES (gen_random_uuid(), :key, :description)
    ON CONFLICT (key) DO NOTHING
    """
)

# Resolved by key so the mapping works whatever ids the rows already carry — the seed
# CLI may have created them with different UUIDs.
_INSERT_ROLE_PERMISSION = sa.text(
    """
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r, permissions p
    WHERE r.key = :role_key AND p.key = :permission_key
    ON CONFLICT DO NOTHING
    """
)


def upgrade() -> None:
    bind = op.get_bind()

    for key, name, description in _ROLES:
        bind.execute(_INSERT_ROLE, {"key": key, "name": name, "description": description})

    for key, description in _PERMISSIONS:
        bind.execute(_INSERT_PERMISSION, {"key": key, "description": description})

    for role_key, permission_keys in _ROLE_PERMISSIONS.items():
        for permission_key in permission_keys:
            bind.execute(
                _INSERT_ROLE_PERMISSION,
                {"role_key": role_key, "permission_key": permission_key},
            )


def downgrade() -> None:
    """Deliberately a no-op.

    user_roles references roles with ON DELETE CASCADE, so deleting these rows would
    silently strip every user's role assignment. Seed data is not schema: rolling this
    revision back must not destroy access control.
    """
