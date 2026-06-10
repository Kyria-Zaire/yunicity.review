"""Unit tests for admin creator content query helpers."""

from __future__ import annotations

import pytest
from app.services.partner_creator_content_admin_queries import (
    normalize_admin_creator_content_title_query,
)

pytestmark = pytest.mark.unit


def test_normalize_admin_creator_content_title_query_empty_values() -> None:
    assert normalize_admin_creator_content_title_query(None) is None
    assert normalize_admin_creator_content_title_query("") is None
    assert normalize_admin_creator_content_title_query("   ") is None


def test_normalize_admin_creator_content_title_query_trims_value() -> None:
    assert normalize_admin_creator_content_title_query("  Récit local  ") == "Récit local"
