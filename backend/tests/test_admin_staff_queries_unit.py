"""Unit tests for admin staff command center helpers (STAFF-V10-01)."""

from __future__ import annotations

from app.services.admin_staff_queries import resolve_dominant_staff_role


def test_resolve_dominant_staff_role_empty() -> None:
    assert resolve_dominant_staff_role({}) is None


def test_resolve_dominant_staff_role_picks_highest_count() -> None:
    assert resolve_dominant_staff_role(
        {"MODERATOR": 2, "CITY_ADMIN": 5, "SUPER_ADMIN": 1},
    ) == "CITY_ADMIN"


def test_resolve_dominant_staff_role_tie_breaks_alphabetically() -> None:
    assert resolve_dominant_staff_role({"MODERATOR": 3, "SUPER_ADMIN": 3}) == "MODERATOR"
