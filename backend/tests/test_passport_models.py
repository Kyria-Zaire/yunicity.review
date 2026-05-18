"""Passport ORM model unit tests."""

import app.models  # noqa: F401 — register metadata
from app.core.passport_constants import (
    MVP_PASSPORT_TIER_SEED,
    OFFER_REDEMPTION_STATUSES,
    PARTNER_OFFER_STATUSES,
    PARTNER_OFFER_TYPES,
    PASSPORT_STATUSES,
    PASSPORT_TIER_CODES,
    PassportStatus,
    PassportTierCode,
)
from app.db.base import Base
from app.models.passport import (
    PartnerOffer,
    Passport,
    PassportOfferRedemption,
    PassportStamp,
    PassportTier,
)
from sqlalchemy import Index, UniqueConstraint, inspect

PASSPORT_TABLES = frozenset(
    {
        "passport_tiers",
        "passports",
        "passport_stamps",
        "partner_offers",
        "passport_offer_redemptions",
    }
)


def test_passport_models_importable() -> None:
    assert PassportTier.__tablename__ == "passport_tiers"
    assert Passport.__tablename__ == "passports"
    assert PassportStamp.__tablename__ == "passport_stamps"
    assert PartnerOffer.__tablename__ == "partner_offers"
    assert PassportOfferRedemption.__tablename__ == "passport_offer_redemptions"


def test_passport_tables_in_metadata() -> None:
    table_names = set(Base.metadata.tables.keys())
    assert PASSPORT_TABLES.issubset(table_names)


def test_passport_tier_constants() -> None:
    assert PassportTierCode.BASIC.value in PASSPORT_TIER_CODES
    assert len(PASSPORT_TIER_CODES) == 6
    assert len(MVP_PASSPORT_TIER_SEED) == 6


def test_passport_status_constants() -> None:
    assert PassportStatus.ACTIVE.value in PASSPORT_STATUSES
    assert PassportStatus.SUSPENDED.value in PASSPORT_STATUSES


def test_partner_offer_type_constants() -> None:
    assert "drink" in PARTNER_OFFER_TYPES
    assert "custom" in PARTNER_OFFER_TYPES
    assert len(PARTNER_OFFER_TYPES) == 6


def test_offer_status_constants() -> None:
    assert "draft" in PARTNER_OFFER_STATUSES
    assert "completed" in OFFER_REDEMPTION_STATUSES


def test_one_active_passport_partial_index() -> None:
    table_args = Passport.__table_args__
    assert isinstance(table_args, tuple)
    index_names = {constraint.name for constraint in table_args if isinstance(constraint, Index)}
    assert "uq_passports_one_active_per_user" in index_names


def test_passport_number_unique_constraint() -> None:
    table_args = Passport.__table_args__
    assert isinstance(table_args, tuple)
    names = {
        constraint.name for constraint in table_args if isinstance(constraint, UniqueConstraint)
    }
    assert "uq_passports_passport_number" in names


def test_stamp_unique_per_organization() -> None:
    table_args = PassportStamp.__table_args__
    assert isinstance(table_args, tuple)
    names = {
        constraint.name for constraint in table_args if isinstance(constraint, UniqueConstraint)
    }
    assert "uq_passport_stamps_passport_organization" in names


def test_redemption_unique_per_offer() -> None:
    table_args = PassportOfferRedemption.__table_args__
    assert isinstance(table_args, tuple)
    names = {
        constraint.name for constraint in table_args if isinstance(constraint, UniqueConstraint)
    }
    assert "uq_passport_offer_redemptions_passport_offer" in names


def test_passport_relationships_mapped() -> None:
    passport_mapper = inspect(Passport)
    assert "user" in passport_mapper.relationships
    assert "tier" in passport_mapper.relationships
    assert "stamps" in passport_mapper.relationships
    assert "redemptions" in passport_mapper.relationships
