"""Organization slug helper unit tests."""

from app.core.organization_slug import (
    RESERVED_ORGANIZATION_SLUGS,
    disambiguate_slug,
    is_reserved_organization_slug,
    is_valid_organization_slug_format,
    normalize_organization_slug,
    slugify_organization_name,
)


def test_slugify_basic() -> None:
    assert slugify_organization_name("Café du Centre") == "cafe-du-centre"


def test_slugify_strips_accents() -> None:
    assert slugify_organization_name("École Rémoise") == "ecole-remoise"


def test_normalize_lowercase_trim() -> None:
    assert normalize_organization_slug("  My-Org  ") == "my-org"


def test_reserved_slug_rejected() -> None:
    assert is_reserved_organization_slug("admin")
    assert not is_valid_organization_slug_format("admin")


def test_reserved_o_slug() -> None:
    assert "o" in RESERVED_ORGANIZATION_SLUGS
    assert not is_valid_organization_slug_format("o")


def test_invalid_slug_characters() -> None:
    assert not is_valid_organization_slug_format("bad_slug")
    assert not is_valid_organization_slug_format("ab")


def test_valid_slug_format() -> None:
    assert is_valid_organization_slug_format("cafe-du-centre-reims")


def test_disambiguate_slug() -> None:
    assert disambiguate_slug("cafe-du-centre", 2) == "cafe-du-centre-2"
