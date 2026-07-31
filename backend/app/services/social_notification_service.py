"""Social in-app + push notifications (TICKET-503)."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.feed_constants import PostAuthorType
from app.core.notification_preferences import (
    PREFERENCE_KEY_PASSPORT,
    PREFERENCE_KEY_SOCIAL,
    PREFERENCE_KEY_TRIBE,
    is_notification_enabled,
)
from app.core.social_notification_constants import (
    SOCIAL_NOTIFICATION_COOLDOWN_SECONDS,
    SocialNotificationType,
)
from app.core.social_notification_helpers import (
    build_feed_deeplink,
    build_post_excerpt,
    skip_notification_if_self,
)
from app.models.post import Post
from app.models.tribe import Tribe
from app.models.user import User
from app.models.user_notification import UserNotification
from app.repositories.profile_repository import ProfileRepository
from app.repositories.user_notification_repository import UserNotificationRepository
from app.schemas.social_notification import (
    MarkAllNotificationsReadResponse,
    MarkNotificationReadResponse,
    UserNotificationItemResponse,
    UserNotificationListResponse,
    UserNotificationPreferencesResponse,
    UserNotificationPreferencesUpdate,
    UserNotificationSummaryResponse,
)
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

_PUSH_BODIES: dict[SocialNotificationType, str] = {
    SocialNotificationType.POST_LIKED: "Quelqu'un a aimé votre publication.",
    SocialNotificationType.POST_COMMENTED: "{actor_name} a commenté votre publication.",
    SocialNotificationType.PASSPORT_LEVEL_UNLOCKED: "Votre Passport évolue.",
    SocialNotificationType.LOCAL_STAMP_EARNED: "Nouveau souvenir ajouté à votre Passport.",
    SocialNotificationType.LOCAL_EVENT_PUBLISHED: "Votre événement local est visible.",
    SocialNotificationType.TRIBE_POST_CREATED: "{actor_name} a publié dans {tribe_name}.",
    SocialNotificationType.TRIBE_JOIN_REQUEST: "{actor_name} demande à rejoindre {tribe_name}.",
    SocialNotificationType.TRIBE_JOIN_REQUEST_ACCEPTED: "Vous avez rejoint {tribe_name}.",
}


class SocialNotificationService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._notifications = UserNotificationRepository(session)
        self._profiles = ProfileRepository(session)
        self._push = NotificationService(session)

    async def notify_post_liked(
        self,
        *,
        actor_id: uuid.UUID,
        post: Post,
    ) -> None:
        target_user_id = self._citizen_author_user_id(post)
        if target_user_id is None:
            return
        if skip_notification_if_self(actor_id, target_user_id):
            return
        actor_name = await self._actor_display_name(actor_id)
        await self._create_and_push(
            notification_type=SocialNotificationType.POST_LIKED,
            actor_id=actor_id,
            target_user_id=target_user_id,
            post=post,
            actor_name=actor_name,
            preference_key=PREFERENCE_KEY_SOCIAL,
            push_body=_PUSH_BODIES[SocialNotificationType.POST_LIKED],
        )

    async def notify_post_commented(
        self,
        *,
        actor_id: uuid.UUID,
        post: Post,
        comment_body: str,
    ) -> None:
        target_user_id = self._citizen_author_user_id(post)
        if target_user_id is None:
            return
        if skip_notification_if_self(actor_id, target_user_id):
            return
        actor_name = await self._actor_display_name(actor_id)
        excerpt = build_post_excerpt(comment_body) or build_post_excerpt(post.body)
        await self._create_and_push(
            notification_type=SocialNotificationType.POST_COMMENTED,
            actor_id=actor_id,
            target_user_id=target_user_id,
            post=post,
            actor_name=actor_name,
            preference_key=PREFERENCE_KEY_SOCIAL,
            push_body=_PUSH_BODIES[SocialNotificationType.POST_COMMENTED].format(
                actor_name=actor_name
            ),
            extra_payload={"comment_excerpt": excerpt},
        )

    async def notify_tribe_post(
        self,
        *,
        post: Post,
        tribe: Tribe,
        actor_id: uuid.UUID,
        recipient_user_ids: list[uuid.UUID],
    ) -> None:
        # TODO(debt): fan-out synchrone. ~15 utilisateurs aujourd'hui, aucune tribu à volume.
        # Seuil de bascule : si une tribu approche ~50-100 membres actifs, déplacer ce fan-out
        # vers ARQ (worker creative-commitment, déjà en place) pour ne pas ralentir create_post.
        # Même doctrine que PgBouncer/multi-replica : différé consciemment, pas oublié.
        if not recipient_user_ids:
            return
        # Préférence globale "tribe" filtrée en UN batch de profils (pas de N+1). Le mute
        # par tribu est déjà appliqué en amont (recipient_user_ids vient d'une seule requête).
        profiles = await self._profiles.list_by_user_ids(recipient_user_ids)
        globally_muted = {
            profile.user_id
            for profile in profiles
            if not is_notification_enabled(
                profile.notification_preferences, key=PREFERENCE_KEY_TRIBE
            )
        }
        targets = [uid for uid in recipient_user_ids if uid not in globally_muted]
        if not targets:
            return

        actor_name = await self._actor_display_name(actor_id)
        deeplink = f"/tribes/{tribe.slug}?city={tribe.city}"
        payload: dict[str, object] = {
            "actor_name": actor_name,
            "tribe_slug": tribe.slug,
            "tribe_name": tribe.name,
            "post_excerpt": build_post_excerpt(post.body),
            "category": "tribe",
        }
        rows = [
            UserNotification(
                type=SocialNotificationType.TRIBE_POST_CREATED.value,
                actor_id=actor_id,
                target_user_id=target_user_id,
                target_post_id=post.id,
                deeplink=deeplink,
                payload=payload,
            )
            for target_user_id in targets
        ]
        self._session.add_all(rows)
        await self._session.commit()
        logger.info(
            "tribe_post_notifications_created",
            extra={
                "tribe_id": str(tribe.id),
                "post_id": str(post.id),
                "recipients": len(rows),
            },
        )

        push_body = _PUSH_BODIES[SocialNotificationType.TRIBE_POST_CREATED].format(
            actor_name=actor_name, tribe_name=tribe.name
        )
        for target_user_id in targets:
            try:
                await self._push.send_to_user(
                    target_user_id,
                    title=tribe.name,
                    body=push_body,
                    data={
                        "type": "tribe",
                        "tribe_slug": tribe.slug,
                        "post_id": str(post.id),
                        "notification_type": SocialNotificationType.TRIBE_POST_CREATED.value,
                    },
                )
            except Exception:
                logger.warning(
                    "push_notification_failed",
                    extra={"event": "tribe_post", "user_id": str(target_user_id)},
                    exc_info=True,
                )

    async def notify_tribe_join_request(
        self,
        *,
        tribe: Tribe,
        requester_id: uuid.UUID,
        recipient_user_ids: list[uuid.UUID],
    ) -> None:
        """Nouvelle demande d'adhésion → notifie owner/mods (in-app + push, pattern bloc 3)."""
        if not recipient_user_ids:
            return
        profiles = await self._profiles.list_by_user_ids(recipient_user_ids)
        globally_muted = {
            profile.user_id
            for profile in profiles
            if not is_notification_enabled(
                profile.notification_preferences, key=PREFERENCE_KEY_TRIBE
            )
        }
        targets = [uid for uid in recipient_user_ids if uid not in globally_muted]
        if not targets:
            return
        requester_name = await self._actor_display_name(requester_id)
        deeplink = f"/tribes/{tribe.slug}?city={tribe.city}"
        payload: dict[str, object] = {
            "actor_name": requester_name,
            "tribe_slug": tribe.slug,
            "tribe_name": tribe.name,
            "category": "tribe",
        }
        rows = [
            UserNotification(
                type=SocialNotificationType.TRIBE_JOIN_REQUEST.value,
                actor_id=requester_id,
                target_user_id=target_user_id,
                target_post_id=None,
                deeplink=deeplink,
                payload=payload,
            )
            for target_user_id in targets
        ]
        self._session.add_all(rows)
        await self._session.commit()
        push_body = _PUSH_BODIES[SocialNotificationType.TRIBE_JOIN_REQUEST].format(
            actor_name=requester_name, tribe_name=tribe.name
        )
        for target_user_id in targets:
            try:
                await self._push.send_to_user(
                    target_user_id,
                    title=tribe.name,
                    body=push_body,
                    data={
                        "type": "tribe",
                        "tribe_slug": tribe.slug,
                        "notification_type": SocialNotificationType.TRIBE_JOIN_REQUEST.value,
                    },
                )
            except Exception:
                logger.warning(
                    "push_notification_failed",
                    extra={"event": "tribe_join_request", "user_id": str(target_user_id)},
                    exc_info=True,
                )

    async def notify_tribe_join_request_accepted(
        self,
        *,
        tribe: Tribe,
        target_user_id: uuid.UUID,
    ) -> None:
        """Demande acceptée → notifie le demandeur (in-app + push)."""
        profile = await self._profiles.get_by_user_id(target_user_id)
        if profile is not None and not is_notification_enabled(
            profile.notification_preferences, key=PREFERENCE_KEY_TRIBE
        ):
            return
        row = UserNotification(
            type=SocialNotificationType.TRIBE_JOIN_REQUEST_ACCEPTED.value,
            actor_id=None,
            target_user_id=target_user_id,
            target_post_id=None,
            deeplink=f"/tribes/{tribe.slug}?city={tribe.city}",
            payload={"tribe_slug": tribe.slug, "tribe_name": tribe.name, "category": "tribe"},
        )
        self._session.add(row)
        await self._session.commit()
        try:
            await self._push.send_to_user(
                target_user_id,
                title=tribe.name,
                body=_PUSH_BODIES[SocialNotificationType.TRIBE_JOIN_REQUEST_ACCEPTED].format(
                    tribe_name=tribe.name
                ),
                data={
                    "type": "tribe",
                    "tribe_slug": tribe.slug,
                    "notification_type": SocialNotificationType.TRIBE_JOIN_REQUEST_ACCEPTED.value,
                },
            )
        except Exception:
            logger.warning(
                "push_notification_failed",
                extra={"event": "tribe_join_request_accepted", "user_id": str(target_user_id)},
                exc_info=True,
            )

    async def notify_passport_level_unlocked(
        self,
        *,
        target_user_id: uuid.UUID,
        tier_code: str,
        tier_label: str,
    ) -> None:
        profile = await self._profiles.get_by_user_id(target_user_id)
        if profile is None:
            return
        if not is_notification_enabled(
            profile.notification_preferences,
            key=PREFERENCE_KEY_PASSPORT,
        ):
            return
        payload = {
            "tier_code": tier_code,
            "tier_label": tier_label,
            "category": "passport",
        }
        row = UserNotification(
            type=SocialNotificationType.PASSPORT_LEVEL_UNLOCKED.value,
            actor_id=None,
            target_user_id=target_user_id,
            target_post_id=None,
            deeplink="/passport",
            payload=payload,
        )
        await self._notifications.add(row)
        await self._session.commit()
        logger.info(
            "social_notification_created",
            extra={
                "type": SocialNotificationType.PASSPORT_LEVEL_UNLOCKED.value,
                "target_user_id": str(target_user_id),
            },
        )
        try:
            await self._push.send_to_user(
                target_user_id,
                title="Yunicity",
                body=f"Vous avez atteint le niveau {tier_label}.",
                data={
                    "type": "passport",
                    "tier_code": tier_code,
                },
            )
        except Exception:
            logger.warning(
                "push_notification_failed",
                extra={"event": "passport_level_up", "user_id": str(target_user_id)},
                exc_info=True,
            )

    async def notify_local_stamp_earned(
        self,
        *,
        target_user_id: uuid.UUID,
        stamp_title: str,
        city: str,
    ) -> None:
        profile = await self._profiles.get_by_user_id(target_user_id)
        if profile is None:
            return
        if not is_notification_enabled(
            profile.notification_preferences,
            key=PREFERENCE_KEY_PASSPORT,
        ):
            return
        payload = {
            "stamp_title": stamp_title,
            "city": city,
            "category": "passport",
        }
        row = UserNotification(
            type=SocialNotificationType.LOCAL_STAMP_EARNED.value,
            actor_id=None,
            target_user_id=target_user_id,
            target_post_id=None,
            deeplink="/passport",
            payload=payload,
        )
        await self._notifications.add(row)
        await self._session.commit()
        logger.info(
            "social_notification_created",
            extra={
                "type": SocialNotificationType.LOCAL_STAMP_EARNED.value,
                "target_user_id": str(target_user_id),
            },
        )
        try:
            await self._push.send_to_user(
                target_user_id,
                title="Yunicity",
                body=_PUSH_BODIES[SocialNotificationType.LOCAL_STAMP_EARNED],
                data={
                    "type": "passport",
                    "stamp_title": stamp_title,
                    "city": city,
                },
            )
        except Exception:
            logger.warning(
                "push_notification_failed",
                extra={"event": "local_stamp_earned", "user_id": str(target_user_id)},
                exc_info=True,
            )

    async def notify_local_event_published(
        self,
        *,
        target_user_id: uuid.UUID,
        event_title: str,
        city: str,
    ) -> None:
        profile = await self._profiles.get_by_user_id(target_user_id)
        if profile is None:
            return
        if not is_notification_enabled(
            profile.notification_preferences,
            key=PREFERENCE_KEY_SOCIAL,
        ):
            return
        payload = {
            "event_title": event_title,
            "city": city,
            "category": "events",
        }
        row = UserNotification(
            type=SocialNotificationType.LOCAL_EVENT_PUBLISHED.value,
            actor_id=None,
            target_user_id=target_user_id,
            target_post_id=None,
            deeplink="/events",
            payload=payload,
        )
        await self._notifications.add(row)
        await self._session.commit()
        try:
            await self._push.send_to_user(
                target_user_id,
                title="Yunicity",
                body="Un nouvel événement local est disponible.",
                data={"type": "events", "event_title": event_title, "city": city},
            )
        except Exception:
            logger.warning(
                "push_notification_failed",
                extra={"event": "local_event_published", "user_id": str(target_user_id)},
                exc_info=True,
            )

    async def list_inbox(
        self,
        user: User,
        *,
        limit: int = 50,
    ) -> UserNotificationListResponse:
        limit = min(max(limit, 1), 100)
        rows = await self._notifications.list_for_user(user.id, limit=limit)
        unread = await self._notifications.count_unread(user.id)
        items = [self._to_item(row) for row in rows]
        return UserNotificationListResponse(
            items=items,
            unread_count=unread,
            total=len(items),
        )

    async def get_inbox_summary(self, user: User) -> UserNotificationSummaryResponse:
        now = datetime.now(UTC)
        week_start = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(
            days=now.weekday()
        )
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        counts = await self._notifications.fetch_inbox_summary_counts(
            user.id,
            week_start=week_start,
            month_start=month_start,
        )
        return UserNotificationSummaryResponse(**counts)

    async def mark_read(
        self,
        user: User,
        notification_id: uuid.UUID,
    ) -> MarkNotificationReadResponse:
        row = await self._notifications.get_by_id_for_user(notification_id, user.id)
        if row is None:
            from app.core.errors import AppError

            raise AppError(
                status_code=404,
                code="NOTIFICATION_NOT_FOUND",
                detail="Notification introuvable.",
            )
        await self._notifications.mark_read(row)
        await self._session.commit()
        return MarkNotificationReadResponse(id=row.id, is_read=True)

    async def mark_all_read(self, user: User) -> MarkAllNotificationsReadResponse:
        count = await self._notifications.mark_all_read(user.id)
        await self._session.commit()
        return MarkAllNotificationsReadResponse(marked_count=count)

    async def update_preferences(
        self,
        user: User,
        payload: UserNotificationPreferencesUpdate,
    ) -> UserNotificationPreferencesResponse:
        profile = await self._profiles.get_by_user_id(user.id)
        if profile is None:
            from app.core.errors import AppError

            raise AppError(
                status_code=404,
                code="PROFILE_NOT_FOUND",
                detail="Profil introuvable.",
            )
        current = dict(profile.notification_preferences or {})
        updates = payload.model_dump(exclude_unset=True)
        current.update(updates)
        await self._profiles.update_fields(profile, fields={"notification_preferences": current})
        await self._session.commit()
        return UserNotificationPreferencesResponse.from_raw(current)

    async def get_preferences(self, user: User) -> UserNotificationPreferencesResponse:
        profile = await self._profiles.get_by_user_id(user.id)
        raw = profile.notification_preferences if profile else {}
        return UserNotificationPreferencesResponse.from_raw(raw)

    async def _create_and_push(
        self,
        *,
        notification_type: SocialNotificationType,
        actor_id: uuid.UUID,
        target_user_id: uuid.UUID,
        post: Post,
        actor_name: str,
        preference_key: str,
        push_body: str,
        extra_payload: dict[str, object] | None = None,
    ) -> None:
        profile = await self._profiles.get_by_user_id(target_user_id)
        if profile is None:
            return
        if not is_notification_enabled(profile.notification_preferences, key=preference_key):
            return

        since = datetime.now(UTC) - timedelta(seconds=SOCIAL_NOTIFICATION_COOLDOWN_SECONDS)
        if await self._notifications.has_recent_duplicate(
            target_user_id=target_user_id,
            actor_id=actor_id,
            notification_type=notification_type.value,
            target_post_id=post.id,
            since=since,
        ):
            return

        excerpt = build_post_excerpt(post.body)
        payload: dict[str, object] = {
            "actor_name": actor_name,
            "post_excerpt": excerpt,
            "category": "social",
        }
        if extra_payload:
            payload.update(extra_payload)

        row = UserNotification(
            type=notification_type.value,
            actor_id=actor_id,
            target_user_id=target_user_id,
            target_post_id=post.id,
            deeplink=build_feed_deeplink(post.id),
            payload=payload,
        )
        await self._notifications.add(row)
        await self._session.commit()

        logger.info(
            "social_notification_created",
            extra={
                "type": notification_type.value,
                "target_user_id": str(target_user_id),
                "actor_id": str(actor_id),
                "post_id": str(post.id),
            },
        )

        try:
            await self._push.send_to_user(
                target_user_id,
                title="Yunicity",
                body=push_body,
                data={
                    "type": "social",
                    "post_id": str(post.id),
                    "actor_name": actor_name,
                    "notification_type": notification_type.value,
                },
            )
        except Exception:
            logger.warning(
                "push_notification_failed",
                extra={
                    "event": notification_type.value,
                    "user_id": str(target_user_id),
                },
                exc_info=True,
            )

    @staticmethod
    def _citizen_author_user_id(post: Post) -> uuid.UUID | None:
        if post.author_type != PostAuthorType.CITIZEN.value:
            return None
        return post.author_id

    async def _actor_display_name(self, actor_id: uuid.UUID) -> str:
        profile = await self._profiles.get_by_user_id(actor_id)
        if profile and profile.display_name:
            return profile.display_name.strip()
        if profile and profile.username:
            return profile.username
        return "Un citoyen"

    @staticmethod
    def _to_item(row: UserNotification) -> UserNotificationItemResponse:
        payload = dict(row.payload or {})
        actor_name = payload.get("actor_name")
        if not actor_name and row.actor is not None:
            actor_name = row.actor.full_name
        return UserNotificationItemResponse(
            id=row.id,
            type=SocialNotificationType(row.type),
            actor_id=row.actor_id,
            actor_name=str(actor_name) if actor_name else None,
            target_post_id=row.target_post_id,
            deeplink=row.deeplink,
            payload=payload,
            is_read=row.is_read,
            created_at=row.created_at,
        )
