"""Expo Push API client (TICKET-307)."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import Settings
from app.core.notification_constants import EXPO_PUSH_URL

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class ExpoPushMessage:
    to: str
    title: str
    body: str
    data: dict[str, Any] | None = None


@dataclass(frozen=True, slots=True)
class ExpoPushTicket:
    status: str
    id: str | None = None
    message: str | None = None
    details_error: str | None = None


def mask_push_token(token: str) -> str:
    if len(token) <= 12:
        return "***"
    return f"{token[:12]}…"


async def send_expo_push_batch(
    messages: list[ExpoPushMessage],
    settings: Settings,
) -> list[ExpoPushTicket]:
    if not messages:
        return []

    if not settings.expo_push_enabled:
        for msg in messages:
            logger.info(
                "expo_push_skipped_disabled",
                extra={"token": mask_push_token(msg.to), "title": msg.title},
            )
        return []

    payload = [
        {
            "to": msg.to,
            "title": msg.title,
            "body": msg.body,
            **({"data": msg.data} if msg.data else {}),
        }
        for msg in messages
    ]
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    if settings.expo_access_token:
        headers["Authorization"] = f"Bearer {settings.expo_access_token}"

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(EXPO_PUSH_URL, json=payload, headers=headers)
        response.raise_for_status()
        parsed = response.json()

    if not isinstance(parsed, dict):
        return []

    raw_tickets = parsed.get("data", [])
    if not isinstance(raw_tickets, list):
        return []

    tickets: list[ExpoPushTicket] = []
    for item in raw_tickets:
        if not isinstance(item, dict):
            continue
        raw_details = item.get("details")
        details: dict[str, object] = raw_details if isinstance(raw_details, dict) else {}
        error_val = details.get("error")
        tickets.append(
            ExpoPushTicket(
                status=str(item.get("status", "unknown")),
                id=item.get("id") if isinstance(item.get("id"), str) else None,
                message=item.get("message") if isinstance(item.get("message"), str) else None,
                details_error=str(error_val) if isinstance(error_val, str) else None,
            )
        )
    return tickets
