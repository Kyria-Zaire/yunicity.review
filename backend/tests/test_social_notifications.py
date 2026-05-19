"""Social notifications (TICKET-503)."""

from __future__ import annotations

import uuid
from unittest.mock import MagicMock

import pytest
from app.core.notification_preferences import (
    DEFAULT_NOTIFICATION_PREFERENCES,
    is_notification_enabled,
    merge_notification_preferences,
)
from app.core.social_notification_constants import SocialNotificationType
from app.core.social_notification_helpers import (
    build_feed_deeplink,
    skip_notification_if_self,
)
from app.services.notification_triggers import _passport_level_notification_body

pytestmark = pytest.mark.unit


def test_skip_notification_if_self() -> None:
    uid = uuid.uuid4()
    assert skip_notification_if_self(uid, uid) is True
    assert skip_notification_if_self(uid, uuid.uuid4()) is False


def test_merge_notification_preferences_defaults() -> None:
    merged = merge_notification_preferences({})
    assert merged == DEFAULT_NOTIFICATION_PREFERENCES


def test_is_notification_enabled_respects_false() -> None:
    assert is_notification_enabled({"social": False}, key="social") is False
    assert is_notification_enabled({"social": True}, key="social") is True


def test_build_feed_deeplink() -> None:
    post_id = uuid.uuid4()
    assert build_feed_deeplink(post_id) == f"/feed?post={post_id}"


def test_push_body_sober() -> None:
    body = _passport_level_notification_body("silver")
    assert "Silver" in body
    assert "🔥" not in body


def test_citizen_author_only() -> None:
    from app.core.feed_constants import PostAuthorType
    from app.services.social_notification_service import SocialNotificationService

    post = MagicMock()
    post.author_type = PostAuthorType.ORGANIZATION.value
    assert SocialNotificationService._citizen_author_user_id(post) is None

    post.author_type = PostAuthorType.CITIZEN.value
    post.author_id = uuid.uuid4()
    assert SocialNotificationService._citizen_author_user_id(post) == post.author_id


def test_notification_types_enum() -> None:
    assert SocialNotificationType.POST_LIKED.value == "POST_LIKED"
    assert SocialNotificationType.POST_COMMENTED.value == "POST_COMMENTED"
