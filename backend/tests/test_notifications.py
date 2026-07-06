"""Push notification foundation tests (TICKET-307)."""

from __future__ import annotations

import uuid
from typing import cast
from unittest.mock import AsyncMock, patch

import pytest
from app.integrations.expo_push import ExpoPushMessage, ExpoPushTicket
from app.integrations.redis import get_redis_client
from app.services.notification_service import NotificationService
from httpx import AsyncClient

from tests.conftest_passport import auth_header, register_user

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> None:
    """Évite RATE_LIMITED quand la suite enchaîne plusieurs POST /auth/register."""
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()


_VALID_TOKEN = "ExponentPushToken[test-device-token-307]"


def _register_payload(**overrides: object) -> dict[str, object]:
    body: dict[str, object] = {
        "expo_push_token": _VALID_TOKEN,
        "platform": "ios",
        "device_name": "iPhone Test",
        "app_version": "1.0.0",
    }
    body.update(overrides)
    return body


@pytest.mark.asyncio
async def test_register_push_device(auth_client: AsyncClient) -> None:
    user = await register_user(auth_client, suffix="-push-reg")
    response = await auth_client.post(
        "/api/v1/notifications/register-device",
        json=_register_payload(),
        headers=auth_header(user["access_token"]),
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["platform"] == "ios"
    assert body["is_active"] is True
    assert body["device_name"] == "iPhone Test"


@pytest.mark.asyncio
async def test_register_push_device_idempotent_update(auth_client: AsyncClient) -> None:
    user = await register_user(auth_client, suffix="-push-idem")
    headers = auth_header(user["access_token"])
    first = await auth_client.post(
        "/api/v1/notifications/register-device",
        json=_register_payload(),
        headers=headers,
    )
    assert first.status_code == 201
    first_id = first.json()["id"]

    second = await auth_client.post(
        "/api/v1/notifications/register-device",
        json=_register_payload(device_name="iPhone Updated", platform="android"),
        headers=headers,
    )
    assert second.status_code == 201
    second_body = second.json()
    assert second_body["id"] == first_id
    assert second_body["platform"] == "android"
    assert second_body["device_name"] == "iPhone Updated"


@pytest.mark.asyncio
async def test_list_own_push_subscriptions(auth_client: AsyncClient) -> None:
    user = await register_user(auth_client, suffix="-push-list")
    headers = auth_header(user["access_token"])
    await auth_client.post(
        "/api/v1/notifications/register-device",
        json=_register_payload(),
        headers=headers,
    )
    response = await auth_client.get(
        "/api/v1/notifications/me/subscriptions",
        headers=headers,
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) >= 1
    assert "expo_push_token" not in items[0]


@pytest.mark.asyncio
async def test_delete_own_push_subscription(auth_client: AsyncClient) -> None:
    user = await register_user(auth_client, suffix="-push-del")
    headers = auth_header(user["access_token"])
    created = await auth_client.post(
        "/api/v1/notifications/register-device",
        json=_register_payload(expo_push_token="ExponentPushToken[delete-me]"),
        headers=headers,
    )
    sub_id = created.json()["id"]
    delete_resp = await auth_client.delete(
        f"/api/v1/notifications/subscriptions/{sub_id}",
        headers=headers,
    )
    assert delete_resp.status_code == 204

    listed = await auth_client.get(
        "/api/v1/notifications/me/subscriptions",
        headers=headers,
    )
    row = next((i for i in listed.json()["items"] if i["id"] == sub_id), None)
    assert row is not None
    assert row["is_active"] is False


@pytest.mark.asyncio
async def test_cannot_delete_other_user_subscription(auth_client: AsyncClient) -> None:
    owner = await register_user(auth_client, suffix="-push-owner")
    other = await register_user(auth_client, suffix="-push-other")
    owner_headers = auth_header(owner["access_token"])
    created = await auth_client.post(
        "/api/v1/notifications/register-device",
        json=_register_payload(expo_push_token="ExponentPushToken[owner-only]"),
        headers=owner_headers,
    )
    sub_id = created.json()["id"]
    response = await auth_client.delete(
        f"/api/v1/notifications/subscriptions/{sub_id}",
        headers=auth_header(other["access_token"]),
    )
    assert response.status_code == 404
    assert response.json()["code"] == "PUSH_SUBSCRIPTION_NOT_FOUND"


@pytest.mark.asyncio
async def test_register_invalid_expo_token(auth_client: AsyncClient) -> None:
    user = await register_user(auth_client, suffix="-push-bad")
    response = await auth_client.post(
        "/api/v1/notifications/register-device",
        json=_register_payload(expo_push_token="not-a-valid-token"),
        headers=auth_header(user["access_token"]),
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_expo_device_not_registered_deactivates_token() -> None:
    from app.db.session import get_engine
    from app.models.push_subscription import PushSubscription
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not configured")

    user_id = uuid.uuid4()
    token = f"ExponentPushToken[deactivate-{uuid.uuid4().hex[:8]}]"
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        from app.models.user import User

        session.add(
            User(
                id=user_id,
                email=f"push-deact-{uuid.uuid4().hex}@example.com",
                hashed_password="x",
                full_name="Push Deact",
            )
        )
        sub = PushSubscription(
            user_id=user_id,
            expo_push_token=token,
            platform="ios",
            is_active=True,
        )
        await session.flush()
        session.add(sub)
        await session.commit()
        sub_id = sub.id

        tickets = [
            ExpoPushTicket(
                status="error",
                message="not registered",
                details_error="DeviceNotRegistered",
            )
        ]
        with patch(
            "app.services.notification_service.send_expo_push_batch",
            new=AsyncMock(return_value=tickets),
        ):
            service = NotificationService(session)
            enabled_settings = service._settings.model_copy(
                update={"expo_push_enabled": True},
            )
            object.__setattr__(service, "_settings", enabled_settings)
            await service.send_to_user(
                user_id,
                title="Test",
                body="Body",
            )

        await session.refresh(sub)
        refreshed = await session.get(PushSubscription, sub_id)
        assert refreshed is not None
        assert refreshed.is_active is False


@pytest.mark.asyncio
async def test_redemption_notification_failure_non_blocking(
    auth_client: AsyncClient,
) -> None:
    from tests.conftest_passport import activate_passport, create_verified_org_with_offer
    from tests.test_scan_redemption import _link_partner_to_org, _register_partner

    citizen = await register_user(auth_client, suffix="-push-redeem")
    await activate_passport(auth_client, citizen["access_token"])
    partner = await _register_partner(auth_client, "-push-redeem")

    from app.db.session import get_engine
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        _org, offer = await create_verified_org_with_offer(
            session,
            slug_suffix="push-redeem",
            offer_title="Offre push test",
        )
        await _link_partner_to_org(
            session,
            org_id=_org.id,
            user_id=uuid.UUID(cast(str, partner["user"]["id"])),
        )
        await session.commit()
        offer_id = offer.id

    qr = await auth_client.get(
        "/api/v1/passport/me/qr",
        headers=auth_header(citizen["access_token"]),
    )
    qr_payload = qr.json()["qr_payload"]

    with patch(
        "app.services.notification_triggers.notify_redemption_success",
        new=AsyncMock(side_effect=RuntimeError("push down")),
    ):
        redeem = await auth_client.post(
            "/api/v1/scan/redeem",
            json={"offer_id": str(offer_id), "qr_secret": qr_payload},
            headers=auth_header(partner["access_token"]),
        )
    assert redeem.status_code == 200
    assert redeem.json()["success"] is True


@pytest.mark.asyncio
async def test_send_expo_skipped_when_disabled() -> None:
    from app.core.config import Settings
    from app.integrations.expo_push import send_expo_push_batch

    settings = Settings(
        EXPO_PUSH_ENABLED=False,
        JWT_SECRET_KEY="dev-only-insecure-jwt-secret-change-in-env-32chars",
    )
    tickets = await send_expo_push_batch(
        [ExpoPushMessage(to=_VALID_TOKEN, title="T", body="B")],
        settings,
    )
    assert tickets == []


@pytest.mark.asyncio
async def test_notifications_summary_requires_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/notifications/summary")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_notifications_summary_returns_counts(auth_client: AsyncClient) -> None:
    from app.core.social_notification_constants import SocialNotificationType
    from app.db.session import get_engine
    from app.models.user_notification import UserNotification
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    user = await register_user(auth_client, suffix="-notif-summary")
    headers = auth_header(user["access_token"])

    empty = await auth_client.get("/api/v1/notifications/summary", headers=headers)
    assert empty.status_code == 200
    assert empty.json() == {
        "unread_count": 0,
        "unread_mentions": 0,
        "unread_social": 0,
        "unread_events": 0,
        "unread_passport": 0,
        "unread_system": 0,
        "count_this_week": 0,
        "count_this_month": 0,
    }

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        session.add(
            UserNotification(
                type=SocialNotificationType.POST_LIKED.value,
                actor_id=None,
                target_user_id=user["user"]["id"],
                target_post_id=None,
                deeplink="/feed",
                payload={"category": "social"},
                is_read=False,
            )
        )
        session.add(
            UserNotification(
                type=SocialNotificationType.LOCAL_STAMP_EARNED.value,
                actor_id=None,
                target_user_id=user["user"]["id"],
                target_post_id=None,
                deeplink="/passport",
                payload={"category": "passport"},
                is_read=False,
            )
        )
        await session.commit()

    summary = await auth_client.get("/api/v1/notifications/summary", headers=headers)
    assert summary.status_code == 200
    body = summary.json()
    assert body["unread_count"] == 2
    assert body["unread_social"] == 1
    assert body["unread_passport"] == 1
    assert body["count_this_week"] >= 2
    assert body["count_this_month"] >= 2
