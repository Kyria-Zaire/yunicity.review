"""Organization ORM model unit tests."""


import app.models  # noqa: F401 — register metadata
from app.core.organization_constants import (
    ORGANIZATION_MEMBER_ROLES,
    ORGANIZATION_TYPES,
    VERIFICATION_STATUSES,
    OrganizationMemberRole,
    OrganizationType,
    VerificationStatus,
)
from app.db.base import Base
from app.models.organization import (
    Organization,
    OrganizationMember,
    OrganizationVerification,
)
from sqlalchemy import Index, UniqueConstraint, inspect

ORGANIZATION_TABLES = frozenset(
    {
        "organizations",
        "organization_members",
        "organization_verifications",
    }
)


def test_organization_models_importable() -> None:
    assert Organization.__tablename__ == "organizations"
    assert OrganizationMember.__tablename__ == "organization_members"
    assert OrganizationVerification.__tablename__ == "organization_verifications"


def test_organization_tables_in_metadata() -> None:
    table_names = set(Base.metadata.tables.keys())
    assert ORGANIZATION_TABLES.issubset(table_names)


def test_organization_type_constants() -> None:
    assert OrganizationType.COMMERCE.value in ORGANIZATION_TYPES
    assert len(ORGANIZATION_TYPES) == 7


def test_verification_status_constants() -> None:
    assert VerificationStatus.PENDING.value in VERIFICATION_STATUSES
    assert VerificationStatus.VERIFIED.value in VERIFICATION_STATUSES


def test_member_role_constants() -> None:
    assert OrganizationMemberRole.OWNER.value in ORGANIZATION_MEMBER_ROLES


def test_organization_column_server_defaults() -> None:
    table = Organization.__table__
    verification_default = table.c.verification_status.server_default
    visibility_default = table.c.visibility.server_default
    assert verification_default is not None
    assert visibility_default is not None


def test_unique_membership_constraint() -> None:
    table_args = OrganizationMember.__table_args__
    assert isinstance(table_args, tuple)
    names = {
        constraint.name
        for constraint in table_args
        if isinstance(constraint, UniqueConstraint)
    }
    assert "uq_organization_members_org_user" in names


def test_one_active_owner_partial_index() -> None:
    table_args = OrganizationMember.__table_args__
    assert isinstance(table_args, tuple)
    index_names = {
        constraint.name for constraint in table_args if isinstance(constraint, Index)
    }
    assert "uq_organization_members_one_active_owner" in index_names


def test_verification_history_has_metadata_column() -> None:
    columns = {column.name for column in inspect(OrganizationVerification).columns}
    assert "metadata" in columns
    assert "organization_id" in columns


def test_organization_latitude_longitude_columns() -> None:
    columns = {column.name for column in inspect(Organization).columns}
    assert "latitude" in columns
    assert "longitude" in columns
    assert "created_by_user_id" in columns
