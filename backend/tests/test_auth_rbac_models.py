"""Unit tests for Auth/RBAC ORM models (no database required)."""

import uuid
from datetime import UTC, datetime

import app.models  # noqa: F401 — register metadata
from app.db.base import Base
from app.models.rbac import Permission, Role, RolePermission, UserRole
from app.models.refresh_token import RefreshToken
from app.models.user import User
from sqlalchemy import UniqueConstraint, inspect

EXPECTED_TABLES = frozenset(
    {
        "users",
        "roles",
        "permissions",
        "role_permissions",
        "user_roles",
        "refresh_tokens",
    }
)


def test_models_importable() -> None:
    assert User.__tablename__ == "users"
    assert Role.__tablename__ == "roles"
    assert Permission.__tablename__ == "permissions"
    assert RolePermission.__tablename__ == "role_permissions"
    assert UserRole.__tablename__ == "user_roles"
    assert RefreshToken.__tablename__ == "refresh_tokens"


def test_base_metadata_contains_six_tables() -> None:
    table_names = set(Base.metadata.tables.keys())
    assert EXPECTED_TABLES.issubset(table_names)


def test_users_has_no_role_column() -> None:
    columns = {column.name for column in inspect(User).columns}
    assert "role" not in columns
    assert "roles" not in columns  # relationship only, not a DB column


def test_user_required_columns() -> None:
    columns = {column.name for column in inspect(User).columns}
    assert {
        "id",
        "email",
        "hashed_password",
        "full_name",
        "city",
        "is_active",
        "is_verified",
        "created_at",
        "updated_at",
    }.issubset(columns)


def test_refresh_token_stores_hash_only() -> None:
    columns = {column.name for column in inspect(RefreshToken).columns}
    assert "token_hash" in columns
    assert "token" not in columns
    assert "refresh_token" not in columns
    assert "raw_token" not in columns


def test_refresh_token_instance_uses_hash_field() -> None:
    token = RefreshToken(
        user_id=uuid.uuid4(),
        token_hash="a" * 64,
        family_id=uuid.uuid4(),
        expires_at=datetime.now(UTC),
    )
    assert token.token_hash == "a" * 64
    assert not hasattr(token, "token")


def test_role_permission_composite_primary_key() -> None:
    pk = {column.name for column in inspect(RolePermission).primary_key}
    assert pk == {"role_id", "permission_id"}


def test_user_roles_scope_unique_constraint() -> None:
    table_args = UserRole.__table_args__
    assert isinstance(table_args, tuple)
    constraint_names = {
        arg.name
        for arg in table_args
        if isinstance(arg, UniqueConstraint) and arg.name is not None
    }
    assert "uq_user_roles_scope" in constraint_names
