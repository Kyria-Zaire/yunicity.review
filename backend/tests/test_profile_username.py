"""Username rules unit tests."""

from __future__ import annotations

import uuid

from app.core.profile_username import (
    RESERVED_USERNAMES,
    build_username_base,
    is_reserved_username,
    is_valid_username_format,
    pick_available_username_sync,
)


def test_reserved_username_rejected() -> None:
    assert is_reserved_username("admin")
    assert not is_valid_username_format("admin")


def test_invalid_username_rejected() -> None:
    assert not is_valid_username_format("ab")
    assert not is_valid_username_format("Bad-Name")
    assert not is_valid_username_format("has space")


def test_valid_username_format() -> None:
    assert is_valid_username_format("kyria_mambu")


def test_build_username_from_full_name() -> None:
    assert build_username_base(full_name="Kyria Mambu", email="x@y.com") == "kyria_mambu"


def test_pick_unique_avoids_collisions() -> None:
    taken: set[str] = {"kyria_mambu"}
    user_id = uuid.uuid4()
    username = pick_available_username_sync(
        taken,
        full_name="Kyria Mambu",
        email="kyria@example.com",
        user_id=user_id,
    )
    assert username != "kyria_mambu"
    assert is_valid_username_format(username)


def test_fallback_username_when_name_too_short() -> None:
    user_id = uuid.UUID("12345678-1234-5678-1234-567812345678")
    base = build_username_base(full_name="A", email="ab@example.com")
    assert base == ""
    taken: set[str] = set()
    username = pick_available_username_sync(
        taken,
        full_name="A",
        email="x@y.com",
        user_id=user_id,
    )
    assert username.startswith("user_")


def test_reserved_list_contains_core_names() -> None:
    assert "yunicity" in RESERVED_USERNAMES
    assert "login" in RESERVED_USERNAMES
