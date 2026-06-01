"""Notification inbox cursor encoding."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest
from app.core.notification_cursor import (
    decode_notification_cursor,
    encode_notification_cursor,
)

pytestmark = pytest.mark.unit


def test_notification_cursor_roundtrip() -> None:
    created_at = datetime(2026, 5, 28, 12, 0, tzinfo=UTC)
    notification_id = uuid.uuid4()
    cursor = encode_notification_cursor(created_at, notification_id)
    decoded_at, decoded_id = decode_notification_cursor(cursor)
    assert decoded_id == notification_id
    assert decoded_at == created_at
