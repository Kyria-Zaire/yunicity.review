"""Passport levels & reputation (TICKET-502)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

import pytest
from app.core.passport_constants import PassportTierCode
from app.core.passport_level_rules import (
    SILVER_REPUTATION_THRESHOLD,
    engagement_tier_for_score,
)
from app.services.notification_triggers import _passport_level_notification_body
from app.services.passport_level_service import PassportLevelService

pytestmark = pytest.mark.unit


def test_engagement_tier_for_score() -> None:
    assert engagement_tier_for_score(0) == PassportTierCode.BASIC
    assert engagement_tier_for_score(SILVER_REPUTATION_THRESHOLD) == PassportTierCode.SILVER
    assert engagement_tier_for_score(100) == PassportTierCode.GOLD


def test_initial_tier_newcomer() -> None:
    user = MagicMock()
    user.created_at = datetime.now(UTC) - timedelta(days=3)
    assert PassportLevelService.initial_tier_code_for_user(user) == PassportTierCode.NEO_ARRIVANT


def test_initial_tier_basic() -> None:
    user = MagicMock()
    user.created_at = datetime.now(UTC) - timedelta(days=60)
    assert PassportLevelService.initial_tier_code_for_user(user) == PassportTierCode.BASIC


def test_compute_reputation_score() -> None:
    passport = MagicMock()
    passport.redemptions_count = 2
    passport.stamps_count = 1
    passport.activated_at = datetime.now(UTC) - timedelta(days=10)
    user = MagicMock()
    user.is_verified = True
    score = PassportLevelService.compute_reputation_score(
        passport, user, posts_count=2, now=datetime.now(UTC)
    )
    # 2*10 + 1*5 + 2*5 + 5 verified + 5 tenure = 45
    assert score == 45


def test_resolve_target_neo_to_silver() -> None:
    target = PassportLevelService._resolve_target_tier(
        PassportTierCode.NEO_ARRIVANT.value,
        PassportTierCode.SILVER,
    )
    assert target == PassportTierCode.SILVER


def test_progression_hint_silver_path() -> None:
    hint = PassportLevelService.build_progression_hint(
        current_tier_code=PassportTierCode.BASIC.value,
        reputation_score=10,
    )
    assert hint.next_tier_code == PassportTierCode.SILVER
    assert hint.points_to_next == SILVER_REPUTATION_THRESHOLD - 10


def test_notification_body_sober() -> None:
    body = _passport_level_notification_body("silver")
    assert "Silver" in body
    assert "🔥" not in body
