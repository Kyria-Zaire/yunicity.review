"""Expo push notifications — MVP foundation (TICKET-307)."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.notification_constants import EXPO_ERROR_DEVICE_NOT_REGISTERED
from app.integrations.expo_push import ExpoPushMessage, mask_push_token, send_expo_push_batch
from app.models.push_subscription import PushSubscription
from app.models.user import User
from app.repositories.push_subscription_repository import PushSubscriptionRepository
from app.schemas.notifications import (
    PushSubscriptionListResponse,
    PushSubscriptionResponse,
    RegisterDeviceRequest,
)

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._subscriptions = PushSubscriptionRepository(session)
        self._settings = get_settings()

    async def register_device(
        self,
        user: User,
        payload: RegisterDeviceRequest,
    ) -> PushSubscriptionResponse:
        now = datetime.now(UTC)
        existing = await self._subscriptions.get_by_token(payload.expo_push_token)
        if existing is not None:
            existing.user_id = user.id
            existing.platform = payload.platform
            existing.device_name = payload.device_name
            existing.app_version = payload.app_version
            existing.is_active = True
            existing.last_seen_at = now
            await self._session.commit()
            await self._session.refresh(existing)
            logger.info(
                "push_device_registered",
                extra={
                    "user_id": str(user.id),
                    "subscription_id": str(existing.id),
                    "token": mask_push_token(payload.expo_push_token),
                },
            )
            return PushSubscriptionResponse.model_validate(existing)

        subscription = PushSubscription(
            user_id=user.id,
            expo_push_token=payload.expo_push_token,
            platform=payload.platform,
            device_name=payload.device_name,
            app_version=payload.app_version,
            is_active=True,
            last_seen_at=now,
        )
        await self._subscriptions.add(subscription)
        await self._session.commit()
        await self._session.refresh(subscription)
        logger.info(
            "push_device_registered",
            extra={
                "user_id": str(user.id),
                "subscription_id": str(subscription.id),
                "token": mask_push_token(payload.expo_push_token),
            },
        )
        return PushSubscriptionResponse.model_validate(subscription)

    async def list_my_subscriptions(self, user: User) -> PushSubscriptionListResponse:
        rows = await self._subscriptions.list_for_user(user.id)
        return PushSubscriptionListResponse(
            items=[PushSubscriptionResponse.model_validate(row) for row in rows],
        )

    async def delete_subscription(self, user: User, subscription_id: uuid.UUID) -> None:
        row = await self._subscriptions.get_by_id(subscription_id)
        if row is None or row.user_id != user.id:
            raise AppError(
                status_code=404,
                code="PUSH_SUBSCRIPTION_NOT_FOUND",
                detail="Abonnement introuvable.",
            )
        await self._subscriptions.deactivate(subscription_id)
        await self._session.commit()
        logger.info(
            "push_device_deactivated",
            extra={"user_id": str(user.id), "subscription_id": str(subscription_id)},
        )

    async def send_to_user(
        self,
        user_id: uuid.UUID,
        *,
        title: str,
        body: str,
        data: dict[str, Any] | None = None,
    ) -> None:
        await self.send_to_users([user_id], title=title, body=body, data=data)

    async def send_to_users(
        self,
        user_ids: list[uuid.UUID],
        *,
        title: str,
        body: str,
        data: dict[str, Any] | None = None,
    ) -> None:
        if not user_ids:
            return

        unique_ids = list(dict.fromkeys(user_ids))
        tokens: list[str] = []
        token_to_subscription: dict[str, uuid.UUID] = {}
        for uid in unique_ids:
            subs = await self._subscriptions.list_active_for_user(uid)
            for sub in subs:
                tokens.append(sub.expo_push_token)
                token_to_subscription[sub.expo_push_token] = sub.id

        if not tokens:
            logger.info(
                "push_send_skipped_no_tokens",
                extra={"user_ids": [str(uid) for uid in unique_ids]},
            )
            return

        messages = [
            ExpoPushMessage(to=token, title=title, body=body, data=data) for token in tokens
        ]
        await self._send_messages(messages, token_to_subscription)

    async def _send_messages(
        self,
        messages: list[ExpoPushMessage],
        token_to_subscription: dict[str, uuid.UUID],
    ) -> None:
        try:
            tickets = await send_expo_push_batch(messages, self._settings)
        except Exception:
            logger.warning("expo_push_batch_failed", exc_info=True)
            return

        for msg, ticket in zip(messages, tickets, strict=False):
            if ticket.status == "ok":
                continue
            if ticket.details_error == EXPO_ERROR_DEVICE_NOT_REGISTERED:
                await self._subscriptions.deactivate_by_token(msg.to)
                sub_id = token_to_subscription.get(msg.to)
                logger.warning(
                    "expo_push_token_deactivated",
                    extra={
                        "token": mask_push_token(msg.to),
                        "subscription_id": str(sub_id) if sub_id else None,
                    },
                )
            else:
                logger.warning(
                    "expo_push_ticket_error",
                    extra={
                        "token": mask_push_token(msg.to),
                        "status": ticket.status,
                        "message": ticket.message,
                        "error": ticket.details_error,
                    },
                )
        if tickets:
            await self._session.commit()
