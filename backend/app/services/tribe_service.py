"""Tribe catalog and membership (TICKET-A.2)."""

from __future__ import annotations

import hashlib
import re
import secrets
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.organization_slug import slugify_organization_name
from app.core.tribe_constants import (
    TRIBE_CATEGORIES,
    TRIBE_CHARTER_VERSION,
    TRIBE_INVITATION_TTL_DAYS,
    TRIBE_MAX_ACTIVE_PER_USER,
    TRIBE_MEMBER_LIMIT_DEFAULT,
    TRIBE_PERSISTENCE_KINDS,
    TRIBE_SLUG_MAX_LENGTH,
    TRIBE_VISIBILITYS,
    TribeMemberRole,
    TribeModerationAction,
    TribeVisibility,
)
from app.models.tribe import Tribe, TribeInvitation, TribeJoinRequest, TribeMember
from app.models.user import User
from app.repositories.profile_repository import ProfileRepository
from app.repositories.tribe_invitation_repository import TribeInvitationRepository
from app.repositories.tribe_join_request_repository import TribeJoinRequestRepository
from app.repositories.tribe_member_repository import TribeMemberRepository
from app.repositories.tribe_repository import TribeRepository
from app.schemas.tribe import (
    TribeCreateRequest,
    TribeInvitationCreateRequest,
    TribeInvitationCreateResponse,
    TribeInvitationListResponse,
    TribeInvitationPendingItem,
    TribeJoinRequestCreateRequest,
    TribeJoinRequestItem,
    TribeJoinRequestListResponse,
    TribeListResponse,
    TribeMemberListResponse,
    TribeMemberResponse,
    TribeMemberRoleUpdateRequest,
    TribeResponse,
    TribeUpdateRequest,
    TribeUserCreateRequest,
    clamp_list_page_size,
)
from app.services.social_notification_service import SocialNotificationService
from app.services.tribe_authorization import TribeAuthorizationService
from app.services.tribe_moderation_log_service import TribeModerationLogService
from app.services.tribe_notification_hooks import (
    notify_tribe_invitation,
    notify_tribe_invitation_accepted,
)

_SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class TribeService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._tribes = TribeRepository(session)
        self._members = TribeMemberRepository(session)
        self._invitations = TribeInvitationRepository(session)
        self._join_requests = TribeJoinRequestRepository(session)
        self._profiles = ProfileRepository(session)
        self._authz = TribeAuthorizationService(session)
        self._audit = TribeModerationLogService(session)

    async def list_public(
        self,
        *,
        city: str,
        featured_only: bool,
        page: int,
        page_size: int,
        viewer: User | None,
    ) -> TribeListResponse:
        page_size = clamp_list_page_size(page_size)
        offset = (max(page, 1) - 1) * page_size
        rows, total = await self._tribes.list_public(
            city=city,
            featured_only=featured_only,
            offset=offset,
            limit=page_size,
        )
        items = [await self._to_response(row, viewer) for row in rows]
        return TribeListResponse(items=items, total=total, page=page, page_size=page_size)

    async def get_by_slug(self, *, city: str, slug: str, viewer: User | None) -> TribeResponse:
        tribe = await self._authz.require_active_tribe(city, slug)
        return await self._to_response(tribe, viewer)

    async def to_response(self, tribe: Tribe, viewer: User | None) -> TribeResponse:
        return await self._to_response(tribe, viewer)

    async def create(self, actor: User, payload: TribeCreateRequest) -> TribeResponse:
        await self._authz.require_staff(actor)
        self._validate_create(payload)
        tribe = Tribe(
            slug=payload.slug.strip().lower(),
            name=payload.name.strip(),
            description=payload.description.strip(),
            city=payload.city.strip(),
            category=payload.category,
            visibility=payload.visibility,
            persistence_kind=payload.persistence_kind,
            cover_image_url=payload.cover_image_url,
            created_by_user_id=actor.id,
            organization_id=payload.organization_id,
            charter_version=TRIBE_CHARTER_VERSION,
            member_limit=payload.member_limit,
            is_featured=payload.is_featured,
        )
        return await self._persist_tribe_with_owner(tribe, actor)

    async def create_for_member(
        self, actor: User, payload: TribeUserCreateRequest
    ) -> TribeResponse:
        """Création citoyenne (authentifié, pas staff) : le créateur devient owner.

        Champs privilégiés forcés serveur-side (organization_id/is_featured/member_limit/
        persistence_kind) — un citoyen ne peut pas les fixer. Slug dérivé du nom.
        """
        if not payload.charter_accepted:
            raise AppError(
                status_code=422,
                code="TRIBE_CHARTER_REQUIRED",
                detail="Vous devez accepter la charte pour créer une tribu.",
            )
        if payload.category not in TRIBE_CATEGORIES:
            raise AppError(status_code=422, code="INVALID_CATEGORY", detail="Catégorie invalide.")
        if payload.visibility not in TRIBE_VISIBILITYS:
            raise AppError(
                status_code=422, code="INVALID_VISIBILITY", detail="Visibilité invalide."
            )
        if await self._members.is_at_user_tribe_limit(actor.id):
            raise AppError(
                status_code=429,
                code="TRIBE_LIMIT_REACHED",
                detail=f"Limite de {TRIBE_MAX_ACTIVE_PER_USER} tribus actives atteinte.",
            )
        city = payload.city.strip()
        tribe = Tribe(
            slug=await self._unique_slug_for(city, payload.name),
            name=payload.name.strip(),
            description=payload.description.strip(),
            city=city,
            category=payload.category,
            visibility=payload.visibility,
            persistence_kind="persistent",
            cover_image_url=payload.cover_image_url,
            created_by_user_id=actor.id,
            organization_id=None,
            charter_version=TRIBE_CHARTER_VERSION,
            member_limit=TRIBE_MEMBER_LIMIT_DEFAULT,
            is_featured=False,
        )
        return await self._persist_tribe_with_owner(tribe, actor)

    async def _persist_tribe_with_owner(self, tribe: Tribe, actor: User) -> TribeResponse:
        """Cœur commun staff/citoyen : insère la tribu + le créateur en OWNER."""
        now = datetime.now(UTC)
        try:
            await self._tribes.add(tribe)
            await self._members.add(
                TribeMember(
                    tribe_id=tribe.id,
                    user_id=actor.id,
                    role=TribeMemberRole.OWNER.value,
                    joined_at=now,
                    charter_accepted_at=now,
                )
            )
            await self._session.commit()
            await self._session.refresh(tribe)
        except IntegrityError as exc:
            await self._session.rollback()
            raise AppError(
                status_code=409,
                code="TRIBE_ALREADY_EXISTS",
                detail="Une tribu avec ce slug existe déjà dans cette ville.",
            ) from exc
        return await self._to_response(tribe, actor)

    async def _unique_slug_for(self, city: str, name: str) -> str:
        """Slug dérivé du nom, unique dans la ville (suffixe -2/-3… sur conflit)."""
        base = slugify_organization_name(name)[:TRIBE_SLUG_MAX_LENGTH] or "tribu"
        candidate = base
        suffix = 2
        while await self._tribes.get_by_slug(city=city, slug=candidate) is not None:
            tail = f"-{suffix}"
            candidate = f"{base[: TRIBE_SLUG_MAX_LENGTH - len(tail)]}{tail}"
            suffix += 1
            if suffix > 200:
                candidate = f"{base[: TRIBE_SLUG_MAX_LENGTH - 7]}-{secrets.token_hex(3)}"
                break
        return candidate

    async def set_notifications_muted(
        self, user: User, *, city: str, slug: str, muted: bool
    ) -> None:
        tribe = await self._authz.require_active_tribe(city, slug)
        member = await self._members.get_active_membership(tribe.id, user.id)
        if member is None:
            raise AppError(
                status_code=403,
                code="TRIBE_NOT_MEMBER",
                detail="Vous n'êtes pas membre de cette tribu.",
            )
        member.notifications_muted = muted
        await self._session.commit()

    async def update(
        self,
        actor: User,
        *,
        city: str,
        slug: str,
        payload: TribeUpdateRequest,
    ) -> TribeResponse:
        tribe = await self._authz.require_active_tribe(city, slug)
        await self._authz.require_role_at_least(tribe, actor, min_role=TribeMemberRole.OWNER)
        if payload.name is not None:
            tribe.name = payload.name.strip()
        if payload.description is not None:
            tribe.description = payload.description.strip()
        if payload.cover_image_url is not None:
            tribe.cover_image_url = payload.cover_image_url
        if payload.is_featured is not None:
            # Mise en avant = décision éditoriale STAFF, jamais self-service par un owner citoyen.
            # Rejet explicite (anti fuite de privilège) — pas seulement absent de l'UI.
            if not await self._authz.is_staff(actor.id):
                raise AppError(
                    status_code=403,
                    code="TRIBE_FEATURED_STAFF_ONLY",
                    detail="La mise en avant d'une tribu est réservée au staff.",
                )
            tribe.is_featured = payload.is_featured
        if payload.member_limit is not None:
            tribe.member_limit = payload.member_limit
        await self._session.commit()
        await self._session.refresh(tribe)
        return await self._to_response(tribe, actor)

    async def archive(self, actor: User, *, city: str, slug: str) -> TribeResponse:
        # TODO(debt): archivage one-way — aucun unarchive n'existe (ni owner ni staff). Différé
        # consciemment (même doctrine que PgBouncer/ARQ) : pas de signal d'usage justifiant un
        # flux de restauration aujourd'hui. À rouvrir si des owners demandent à revenir en arrière.
        tribe = await self._authz.require_active_tribe(city, slug)
        is_staff = await self._authz.is_staff(actor.id)
        if not is_staff:
            await self._authz.require_role_at_least(tribe, actor, min_role=TribeMemberRole.OWNER)
        tribe.archived_at = datetime.now(UTC)
        await self._audit.log(
            tribe_id=tribe.id,
            actor_user_id=actor.id,
            action=TribeModerationAction.ARCHIVE_TRIBE.value,
        )
        await self._session.commit()
        await self._session.refresh(tribe)
        return await self._to_response(tribe, actor)

    async def join(
        self, user: User, *, city: str, slug: str, charter_accepted: bool
    ) -> TribeMemberResponse:
        if not charter_accepted:
            raise AppError(
                status_code=422,
                code="CHARTER_REQUIRED",
                detail="Vous devez accepter la charte de la tribu.",
            )
        tribe = await self._authz.require_active_tribe(city, slug)
        if tribe.visibility != TribeVisibility.PUBLIC.value:
            raise AppError(
                status_code=403,
                code="TRIBE_INVITE_REQUIRED",
                detail="Cette tribu est accessible sur invitation uniquement.",
            )
        return await self._add_member(user, tribe, invited_by=None)

    async def leave(self, user: User, *, city: str, slug: str) -> None:
        tribe = await self._authz.require_active_tribe(city, slug)
        member = await self._authz.require_active_member(tribe, user)
        if member.role == TribeMemberRole.OWNER.value:
            owner_count = await self._count_active_owners(tribe.id)
            if owner_count <= 1:
                raise AppError(
                    status_code=409,
                    code="TRIBE_OWNER_CANNOT_LEAVE",
                    detail=("Transférez la responsabilité ou archivez la tribu avant de partir."),
                )
        member.left_at = datetime.now(UTC)
        await self._session.commit()

    async def list_members(
        self,
        actor: User,
        *,
        city: str,
        slug: str,
        page: int,
        page_size: int,
    ) -> TribeMemberListResponse:
        tribe = await self._authz.require_active_tribe(city, slug)
        await self._authz.require_active_member(tribe, actor)
        page_size = clamp_list_page_size(page_size)
        offset = (max(page, 1) - 1) * page_size
        rows = await self._members.list_active_members(tribe.id, offset=offset, limit=page_size)
        total = await self._members.count_active_members(tribe.id)
        return TribeMemberListResponse(
            items=[
                TribeMemberResponse(user_id=row.user_id, role=row.role, joined_at=row.joined_at)
                for row in rows
            ],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def update_member_role(
        self,
        actor: User,
        *,
        city: str,
        slug: str,
        target_user_id: uuid.UUID,
        payload: TribeMemberRoleUpdateRequest,
    ) -> TribeMemberResponse:
        tribe = await self._authz.require_active_tribe(city, slug)
        await self._authz.require_role_at_least(tribe, actor, min_role=TribeMemberRole.OWNER)
        if payload.role not in (
            TribeMemberRole.MEMBER.value,
            TribeMemberRole.MODERATOR.value,
        ):
            raise AppError(
                status_code=422,
                code="INVALID_ROLE",
                detail="Rôle invalide.",
            )
        target = await self._members.get_active_membership(tribe.id, target_user_id)
        if target is None:
            raise AppError(
                status_code=404,
                code="TRIBE_MEMBER_NOT_FOUND",
                detail="Membre introuvable.",
            )
        if target.role == TribeMemberRole.OWNER.value:
            raise AppError(
                status_code=409,
                code="TRIBE_OWNER_ROLE_FIXED",
                detail="Le rôle du propriétaire ne peut pas être modifié ainsi.",
            )
        target.role = payload.role
        await self._audit.log(
            tribe_id=tribe.id,
            actor_user_id=actor.id,
            action=TribeModerationAction.CHANGE_ROLE.value,
            target_user_id=target_user_id,
            detail=payload.role,
        )
        await self._session.commit()
        return TribeMemberResponse(
            user_id=target.user_id, role=target.role, joined_at=target.joined_at
        )

    async def remove_member(
        self,
        actor: User,
        *,
        city: str,
        slug: str,
        target_user_id: uuid.UUID,
    ) -> None:
        tribe = await self._authz.require_active_tribe(city, slug)
        await self._authz.require_role_at_least(tribe, actor, min_role=TribeMemberRole.MODERATOR)
        target = await self._members.get_active_membership(tribe.id, target_user_id)
        if target is None:
            return
        if target.role == TribeMemberRole.OWNER.value:
            raise AppError(
                status_code=409,
                code="TRIBE_CANNOT_EXCLUDE_OWNER",
                detail="Le propriétaire ne peut pas être exclu.",
            )
        target.left_at = datetime.now(UTC)
        await self._audit.log(
            tribe_id=tribe.id,
            actor_user_id=actor.id,
            action=TribeModerationAction.EXCLUDE_MEMBER.value,
            target_user_id=target_user_id,
        )
        await self._session.commit()

    async def create_invitation(
        self,
        actor: User,
        *,
        city: str,
        slug: str,
        payload: TribeInvitationCreateRequest | None = None,
    ) -> TribeInvitationCreateResponse:
        tribe = await self._authz.require_active_tribe(city, slug)
        await self._authz.require_role_at_least(tribe, actor, min_role=TribeMemberRole.MODERATOR)
        invitee_id = payload.invitee_user_id if payload else None
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        now = datetime.now(UTC)
        invitation = TribeInvitation(
            tribe_id=tribe.id,
            token_hash=token_hash,
            invited_by=actor.id,
            invited_user_id=invitee_id,
            expires_at=now + timedelta(days=TRIBE_INVITATION_TTL_DAYS),
            created_at=now,
        )
        await self._invitations.add(invitation)
        await self._session.commit()
        if invitee_id is not None and invitee_id != actor.id:
            await notify_tribe_invitation(
                self._session,
                invitee_user_id=invitee_id,
                tribe_name=tribe.name,
                tribe_slug=tribe.slug,
            )
        return TribeInvitationCreateResponse(token=token, expires_at=invitation.expires_at)

    async def list_my_pending_invitations(self, user: User) -> TribeInvitationListResponse:
        rows = await self._invitations.list_pending_for_user(user.id)
        items: list[TribeInvitationPendingItem] = []
        for row in rows:
            tribe = row.tribe
            if tribe is None or tribe.archived_at is not None:
                continue
            items.append(
                TribeInvitationPendingItem(
                    id=row.id,
                    tribe_slug=tribe.slug,
                    tribe_name=tribe.name,
                    tribe_city=tribe.city,
                    expires_at=row.expires_at,
                )
            )
        return TribeInvitationListResponse(items=items)

    async def decline_invitation(self, user: User, *, invitation_id: uuid.UUID) -> None:
        invitation = await self._invitations.get_by_id(invitation_id)
        if invitation is None or invitation.invited_user_id != user.id:
            raise AppError(
                status_code=404,
                code="INVITATION_NOT_FOUND",
                detail="Invitation introuvable.",
            )
        if not TribeInvitationRepository.is_usable(invitation):
            raise AppError(
                status_code=409,
                code="INVITATION_INVALID",
                detail="Invitation expirée ou déjà traitée.",
            )
        invitation.revoked_at = datetime.now(UTC)
        await self._session.commit()

    async def accept_invitation_by_id(
        self, user: User, *, invitation_id: uuid.UUID, charter_accepted: bool
    ) -> TribeMemberResponse:
        if not charter_accepted:
            raise AppError(
                status_code=422,
                code="CHARTER_REQUIRED",
                detail="Vous devez accepter la charte de la tribu.",
            )
        invitation = await self._invitations.get_by_id(invitation_id)
        if invitation is None or invitation.invited_user_id != user.id:
            raise AppError(
                status_code=404,
                code="INVITATION_NOT_FOUND",
                detail="Invitation introuvable.",
            )
        if not TribeInvitationRepository.is_usable(invitation):
            raise AppError(
                status_code=404,
                code="INVITATION_INVALID",
                detail="Invitation invalide ou expirée.",
            )
        tribe = invitation.tribe
        if tribe is None or tribe.archived_at is not None:
            raise AppError(
                status_code=404,
                code="TRIBE_NOT_FOUND",
                detail="Cette tribu n'est pas disponible.",
            )
        member_resp = await self._add_member(user, tribe, invited_by=invitation.invited_by)
        invitation.accepted_at = datetime.now(UTC)
        invitation.accepted_by = user.id
        inviter_id = invitation.invited_by
        await self._session.commit()
        if inviter_id != user.id:
            await notify_tribe_invitation_accepted(
                self._session,
                inviter_user_id=inviter_id,
                tribe_name=tribe.name,
                acceptor_name=user.full_name or "Un membre",
            )
        return member_resp

    async def accept_invitation(
        self, user: User, *, token: str, charter_accepted: bool
    ) -> TribeMemberResponse:
        if not charter_accepted:
            raise AppError(
                status_code=422,
                code="CHARTER_REQUIRED",
                detail="Vous devez accepter la charte de la tribu.",
            )
        token_hash = hashlib.sha256(token.strip().encode()).hexdigest()
        invitation = await self._invitations.get_by_token_hash(token_hash)
        if invitation is None or not TribeInvitationRepository.is_usable(invitation):
            raise AppError(
                status_code=404,
                code="INVITATION_INVALID",
                detail="Invitation invalide ou expirée.",
            )
        tribe = await self._tribes.get_by_id(invitation.tribe_id)
        if tribe is None or tribe.archived_at is not None:
            raise AppError(
                status_code=404,
                code="TRIBE_NOT_FOUND",
                detail="Cette tribu n'est pas disponible.",
            )
        member_resp = await self._add_member(user, tribe, invited_by=invitation.invited_by)
        invitation.accepted_at = datetime.now(UTC)
        invitation.accepted_by = user.id
        inviter_id = invitation.invited_by
        await self._session.commit()
        if inviter_id != user.id:
            await notify_tribe_invitation_accepted(
                self._session,
                inviter_user_id=inviter_id,
                tribe_name=tribe.name,
                acceptor_name=user.full_name or "Un membre",
            )
        return member_resp

    async def create_join_request(
        self, user: User, *, city: str, slug: str, payload: TribeJoinRequestCreateRequest
    ) -> None:
        tribe = await self._authz.require_active_tribe(city, slug)
        if tribe.visibility == TribeVisibility.PUBLIC.value:
            raise AppError(
                status_code=400,
                code="TRIBE_ALREADY_PUBLIC",
                detail="Cette tribu est publique — rejoignez-la directement.",
            )
        if await self._members.get_active_membership(tribe.id, user.id) is not None:
            raise AppError(
                status_code=409,
                code="TRIBE_ALREADY_MEMBER",
                detail="Vous êtes déjà membre de cette tribu.",
            )
        # Cooldown re-join vérifié DÈS la création (défense en profondeur : _add_member le
        # re-vérifie à l'accept, au cas où le délai expire entre-temps).
        if not await self._members.can_rejoin(tribe.id, user.id):
            raise AppError(
                status_code=409,
                code="TRIBE_REJOIN_COOLDOWN",
                detail="Vous pourrez demander à rejoindre cette tribu plus tard.",
            )
        if await self._join_requests.get_pending_for_user_tribe(tribe.id, user.id) is not None:
            raise AppError(
                status_code=409,
                code="TRIBE_REQUEST_PENDING",
                detail="Vous avez déjà une demande en attente pour cette tribu.",
            )
        message = payload.message.strip() if payload.message else None
        request = TribeJoinRequest(tribe_id=tribe.id, requested_by=user.id, message=message or None)
        await self._join_requests.add(request)
        await self._session.commit()
        recipients = await self._members.list_manager_user_ids(tribe.id)
        if recipients:
            await SocialNotificationService(self._session).notify_tribe_join_request(
                tribe=tribe, requester_id=user.id, recipient_user_ids=recipients
            )

    async def list_join_requests(
        self, actor: User, *, city: str, slug: str
    ) -> TribeJoinRequestListResponse:
        tribe = await self._authz.require_active_tribe(city, slug)
        await self._authz.require_role_at_least(tribe, actor, min_role=TribeMemberRole.MODERATOR)
        rows = await self._join_requests.list_pending_for_tribe(tribe.id)
        items = [
            TribeJoinRequestItem(
                id=row.id,
                requested_by=row.requested_by,
                requester_name=await self._resolve_requester_name(row.requested_by),
                message=row.message,
                created_at=row.created_at,
            )
            for row in rows
        ]
        return TribeJoinRequestListResponse(items=items)

    async def accept_join_request(
        self, actor: User, *, city: str, slug: str, request_id: uuid.UUID
    ) -> TribeMemberResponse:
        tribe = await self._authz.require_active_tribe(city, slug)
        await self._authz.require_role_at_least(tribe, actor, min_role=TribeMemberRole.MODERATOR)
        request = await self._pending_join_request(tribe, request_id)
        requester = await self._session.get(User, request.requested_by)
        if requester is None:
            raise AppError(
                status_code=404, code="TRIBE_REQUEST_NOT_FOUND", detail="Demande introuvable."
            )
        member_resp = await self._add_member(requester, tribe, invited_by=actor.id)
        request.accepted_at = datetime.now(UTC)
        request.decided_by = actor.id
        await self._session.commit()
        await SocialNotificationService(self._session).notify_tribe_join_request_accepted(
            tribe=tribe, target_user_id=request.requested_by
        )
        return member_resp

    async def decline_join_request(
        self, actor: User, *, city: str, slug: str, request_id: uuid.UUID
    ) -> None:
        # TODO(debt): pas de cooldown après un refus (MVP, ~15 utilisateurs). Si un pattern de
        # demandes répétées abusives apparaît en usage réel, ajouter un cooldown post-decline
        # (ex: 24-48h) à ce moment-là — différé faute de signal, l'owner garde le contrôle.
        tribe = await self._authz.require_active_tribe(city, slug)
        await self._authz.require_role_at_least(tribe, actor, min_role=TribeMemberRole.MODERATOR)
        request = await self._pending_join_request(tribe, request_id)
        request.declined_at = datetime.now(UTC)
        request.decided_by = actor.id
        await self._session.commit()

    async def _pending_join_request(
        self, tribe: Tribe, request_id: uuid.UUID
    ) -> TribeJoinRequest:
        request = await self._join_requests.get_by_id(request_id)
        if (
            request is None
            or request.tribe_id != tribe.id
            or request.accepted_at is not None
            or request.declined_at is not None
        ):
            raise AppError(
                status_code=404,
                code="TRIBE_REQUEST_NOT_FOUND",
                detail="Demande introuvable ou déjà traitée.",
            )
        return request

    async def _resolve_requester_name(self, user_id: uuid.UUID) -> str:
        profile = await self._profiles.get_by_user_id(user_id)
        if profile is not None and profile.display_name:
            return profile.display_name.strip()
        if profile is not None and profile.username:
            return profile.username
        return "Un citoyen"

    async def _add_member(
        self,
        user: User,
        tribe: Tribe,
        *,
        invited_by: uuid.UUID | None,
    ) -> TribeMemberResponse:
        existing = await self._members.get_active_membership(tribe.id, user.id)
        if existing is not None:
            return self._to_member_response(tribe, existing)
        if not await self._members.can_rejoin(tribe.id, user.id):
            raise AppError(
                status_code=409,
                code="TRIBE_REJOIN_COOLDOWN",
                detail="Vous pourrez rejoindre cette tribu plus tard.",
            )
        if await self._members.is_at_user_tribe_limit(user.id):
            raise AppError(
                status_code=409,
                code="TRIBE_USER_LIMIT",
                detail="Vous participez déjà à plusieurs tribus actives.",
            )
        if await self._members.is_at_member_limit(tribe.id, tribe.member_limit):
            raise AppError(
                status_code=409,
                code="TRIBE_MEMBER_LIMIT",
                detail="Cette tribu a atteint sa taille maximale.",
            )
        now = datetime.now(UTC)
        row = await self._members.get_membership(tribe.id, user.id)
        if row is not None and row.left_at is not None:
            row.left_at = None
            row.joined_at = now
            row.charter_accepted_at = now
            row.role = TribeMemberRole.MEMBER.value
            row.invited_by = invited_by
            member = row
        else:
            member = await self._members.add(
                TribeMember(
                    tribe_id=tribe.id,
                    user_id=user.id,
                    role=TribeMemberRole.MEMBER.value,
                    joined_at=now,
                    invited_by=invited_by,
                    charter_accepted_at=now,
                )
            )
        await self._session.commit()
        return self._to_member_response(tribe, member)

    @staticmethod
    def _to_member_response(tribe: Tribe, member: TribeMember) -> TribeMemberResponse:
        return TribeMemberResponse(
            user_id=member.user_id,
            role=member.role,
            joined_at=member.joined_at,
            tribe_slug=tribe.slug,
            tribe_city=tribe.city,
            tribe_name=tribe.name,
        )

    async def _to_response(self, tribe: Tribe, viewer: User | None) -> TribeResponse:
        count = await self._members.count_active_members(tribe.id)
        viewer_role = None
        is_member = False
        viewer_notifications_muted = False
        viewer_has_pending_join_request = False
        if viewer is not None:
            member = await self._members.get_active_membership(tribe.id, viewer.id)
            if member is not None:
                is_member = True
                viewer_role = member.role
                viewer_notifications_muted = member.notifications_muted
            elif await self._authz.is_staff(viewer.id):
                is_member = True
            elif tribe.visibility != TribeVisibility.PUBLIC.value:
                # Non-membre d'une tribu privée : a-t-il une demande en attente ? (état du bouton)
                pending = await self._join_requests.get_pending_for_user_tribe(tribe.id, viewer.id)
                viewer_has_pending_join_request = pending is not None
        return TribeResponse(
            id=tribe.id,
            slug=tribe.slug,
            name=tribe.name,
            description=tribe.description,
            city=tribe.city,
            category=tribe.category,
            visibility=tribe.visibility,
            persistence_kind=tribe.persistence_kind,
            cover_image_url=tribe.cover_image_url,
            is_featured=tribe.is_featured,
            member_limit=tribe.member_limit,
            active_member_count=count,
            is_archived=tribe.archived_at is not None,
            viewer_is_member=is_member,
            viewer_role=viewer_role,
            viewer_notifications_muted=viewer_notifications_muted,
            viewer_has_pending_join_request=viewer_has_pending_join_request,
            created_at=tribe.created_at,
            updated_at=tribe.updated_at,
        )

    async def _count_active_owners(self, tribe_id: uuid.UUID) -> int:
        from sqlalchemy import func, select

        result = await self._session.execute(
            select(func.count())
            .select_from(TribeMember)
            .where(
                TribeMember.tribe_id == tribe_id,
                TribeMember.role == TribeMemberRole.OWNER.value,
                TribeMember.left_at.is_(None),
            )
        )
        return int(result.scalar_one())

    @staticmethod
    def _validate_create(payload: TribeCreateRequest) -> None:
        slug = payload.slug.strip().lower()
        if not _SLUG_PATTERN.match(slug):
            raise AppError(
                status_code=422,
                code="INVALID_TRIBE_SLUG",
                detail="Slug invalide.",
            )
        if payload.category not in TRIBE_CATEGORIES:
            raise AppError(status_code=422, code="INVALID_CATEGORY", detail="Catégorie invalide.")
        if payload.visibility not in TRIBE_VISIBILITYS:
            raise AppError(
                status_code=422, code="INVALID_VISIBILITY", detail="Visibilité invalide."
            )
        if payload.persistence_kind not in TRIBE_PERSISTENCE_KINDS:
            raise AppError(
                status_code=422,
                code="INVALID_PERSISTENCE",
                detail="Type de persistance invalide.",
            )
