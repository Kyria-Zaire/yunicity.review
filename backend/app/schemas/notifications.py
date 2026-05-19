"""Push notification API schemas (TICKET-307)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

PushPlatformLiteral = Literal["ios", "android"]


class RegisterDeviceRequest(BaseModel):
    expo_push_token: str = Field(..., min_length=10, max_length=512)
    platform: PushPlatformLiteral
    device_name: str | None = Field(default=None, max_length=128)
    app_version: str | None = Field(default=None, max_length=32)

    @field_validator("expo_push_token")
    @classmethod
    def validate_expo_token(cls, value: str) -> str:
        token = value.strip()
        if not token.startswith("ExponentPushToken[") and not token.startswith("ExpoPushToken["):
            raise ValueError("Invalid Expo push token format")
        return token


class PushSubscriptionResponse(BaseModel):
    id: uuid.UUID
    platform: str
    device_name: str | None
    app_version: str | None
    is_active: bool
    last_seen_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class PushSubscriptionListResponse(BaseModel):
    items: list[PushSubscriptionResponse]
