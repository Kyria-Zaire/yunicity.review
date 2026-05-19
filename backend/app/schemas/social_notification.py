"""Social notification API schemas (TICKET-503)."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.core.notification_preferences import DEFAULT_NOTIFICATION_PREFERENCES
from app.core.social_notification_constants import SocialNotificationType


class UserNotificationPreferencesUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    social: bool | None = None
    passport: bool | None = None
    offers: bool | None = None


class UserNotificationPreferencesResponse(BaseModel):
    social: bool
    passport: bool
    offers: bool

    @classmethod
    def from_raw(cls, raw: dict[str, Any]) -> UserNotificationPreferencesResponse:
        bool_prefs = {k: v for k, v in raw.items() if isinstance(v, bool)}
        merged = {**DEFAULT_NOTIFICATION_PREFERENCES, **bool_prefs}
        return cls(
            social=bool(merged.get("social", True)),
            passport=bool(merged.get("passport", True)),
            offers=bool(merged.get("offers", True)),
        )


class UserNotificationItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: SocialNotificationType
    actor_id: UUID | None
    actor_name: str | None
    target_post_id: UUID | None
    deeplink: str | None
    payload: dict[str, Any]
    is_read: bool
    created_at: datetime


class UserNotificationListResponse(BaseModel):
    items: list[UserNotificationItemResponse]
    unread_count: int
    total: int


class MarkNotificationReadResponse(BaseModel):
    id: UUID
    is_read: bool


class MarkAllNotificationsReadResponse(BaseModel):
    marked_count: int
