"""Post CRUD (TICKET-402)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.feed_constants import PostAuthorType, PostType
from app.core.organization_constants import OrganizationMemberRole
from app.models.post import Post
from app.models.user import User
from app.repositories.like_repository import LikeRepository
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.passport_repository import PassportRepository
from app.repositories.post_repository import PostRepository
from app.repositories.post_visibility import can_view_post
from app.repositories.profile_repository import ProfileRepository
from app.repositories.tribe_member_repository import TribeMemberRepository
from app.repositories.tribe_repository import TribeRepository
from app.schemas.post import PostCreateRequest, PostResponse, PostUpdateRequest
from app.services.feed_author_resolver import FeedAuthorResolver
from app.services.feed_post_mapper import to_post_response
from app.services.organization_membership_service import OrganizationMembershipService
from app.services.passport_level_hooks import evaluate_passport_level_after_activity
from app.services.post_composer_mapper import apply_composer_create_payload
from app.services.post_idempotency import compute_request_fingerprint
from app.services.rbac_service import RbacService


@dataclass(frozen=True)
class PostCreateOutcome:
    """Issue d'une tentative de creation.

    `created` est False quand la tentative etait un REJEU : rien n'a ete insere, la
    publication renvoyee est celle de la premiere tentative. La route s'en sert pour
    choisir son code HTTP -- le service, lui, ne connait pas HTTP.
    """

    response: PostResponse
    created: bool


@dataclass(frozen=True)
class _PersistedPost:
    post: Post
    created: bool


class PostService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._posts = PostRepository(session)
        self._likes = LikeRepository(session)
        self._profiles = ProfileRepository(session)
        self._orgs = OrganizationRepository(session)
        self._membership = OrganizationMembershipService(session)
        self._authors = FeedAuthorResolver(session)
        self._rbac = RbacService(session)
        self._tribes = TribeRepository(session)
        self._tribe_members = TribeMemberRepository(session)

    async def create_post(self, user: User, payload: PostCreateRequest) -> PostCreateOutcome:
        # linked_tribe_id comes straight from the client. Validate membership the
        # same way create_discussion does, otherwise the composer path lets a user
        # associate a post with any (even private) tribe they don't belong to, and
        # a non-existent id would violate the FK and 500 on commit.
        if payload.linked_tribe_id is not None:
            await self._require_linked_tribe_membership(user, payload.linked_tribe_id)

        if payload.author_type == PostAuthorType.CITIZEN.value:
            profile = await self._profiles.get_by_user_id(user.id)
            city = (profile.city if profile and profile.city else user.city) or None
            post = Post(
                author_type=PostAuthorType.CITIZEN.value,
                author_id=user.id,
                type=PostType.POST.value,
                city=city,
                title=None,
                body=payload.body,
                media_url=payload.media_url,
            )
            apply_composer_create_payload(post, payload)
            if payload.location:
                post.set_location(payload.location.latitude, payload.location.longitude)
            persisted = await self._persist_with_idempotency(post, payload, user=user)
            if not persisted.created:
                return PostCreateOutcome(
                    response=await self._to_response(persisted.post, user),
                    created=False,
                )
            passport = await PassportRepository(self._session).get_active_for_user(user.id)
            if passport is not None:
                await evaluate_passport_level_after_activity(self._session, passport.id)
            author = await self._authors.resolve_user(user.id)
            return PostCreateOutcome(
                response=to_post_response(post, author=author, liked_by_me=False),
                created=True,
            )

        assert payload.organization_id is not None
        await self._membership.require_admin_or_owner(
            organization_id=payload.organization_id,
            user_id=user.id,
        )
        org = await self._orgs.get_by_id(payload.organization_id)
        if org is None:
            raise AppError(
                status_code=404,
                code="ORGANIZATION_NOT_FOUND",
                detail="Lieu introuvable.",
            )
        post = Post(
            author_type=PostAuthorType.ORGANIZATION.value,
            author_id=org.id,
            type=PostType.POST.value,
            city=org.city,
            title=None,
            body=payload.body,
            media_url=payload.media_url,
        )
        apply_composer_create_payload(post, payload)
        if payload.location:
            post.set_location(payload.location.latitude, payload.location.longitude)
        persisted = await self._persist_with_idempotency(post, payload, user=user)
        if not persisted.created:
            return PostCreateOutcome(
                response=await self._to_response(persisted.post, user),
                created=False,
            )
        author = await self._authors.resolve_organization(org)
        return PostCreateOutcome(
            response=to_post_response(post, author=author, liked_by_me=False),
            created=True,
        )

    async def _persist_with_idempotency(
        self, post: Post, payload: PostCreateRequest, *, user: User
    ) -> _PersistedPost:
        """Insere la publication en honorant la cle d'idempotence du client.

        Sans cle, le comportement historique est inchange : insertion seche. Avec une
        cle, la meme tentative rejouee ne cree rien et renvoie la publication deja
        enregistree -- ou refuse si son contenu differe.

        Le scope est `post.author_id`, exactement celui de l'index unique : pour une
        publication d'organisation c'est l'organisation, pas l'utilisateur courant.
        Chercher ailleurs ferait echouer la relecture la ou l'index, lui, refuserait.
        """
        empreinte: str | None = None
        if payload.client_request_id is not None:
            empreinte = compute_request_fingerprint(payload)
            existant = await self._posts.get_by_client_request(
                author_id=post.author_id, client_request_id=payload.client_request_id
            )
            if existant is not None:
                return self._replay(existant, empreinte)
            post.client_request_id = payload.client_request_id
            post.client_request_fingerprint = empreinte

        try:
            await self._posts.add(post)
            await self._session.commit()
        except IntegrityError:
            # Course : une requete simultanee a insere la meme cle entre notre lecture
            # et notre ecriture. L'unicite est tenue par l'index, pas par le test
            # ci-dessus -- qui n'est qu'un raccourci du cas courant.
            await self._session.rollback()
            if payload.client_request_id is None or empreinte is None:
                raise
            # `rollback()` EXPIRE tous les objets de la session, y compris le
            # `current_user` chargé par la dépendance d'authentification : son dict
            # d'attributs est vidé. Le prochain accès synchrone à `user.id` -- dans
            # `_to_response`, que l'appelant invoque sur un rejeu -- tenterait une IO
            # paresseuse hors contexte async : `MissingGreenlet`, donc un 500 sur le
            # chemin même qui est censé rattraper la course. On le recharge
            # explicitement ici, avant que quiconque y touche.
            await self._session.refresh(user)
            existant = await self._posts.get_by_client_request(
                author_id=post.author_id, client_request_id=payload.client_request_id
            )
            if existant is None:
                raise
            return self._replay(existant, empreinte)

        await self._session.refresh(post)
        return _PersistedPost(post=post, created=True)

    def _replay(self, existant: Post, empreinte: str) -> _PersistedPost:
        if existant.client_request_fingerprint != empreinte:
            raise AppError(
                status_code=409,
                code="POST_REQUEST_CONFLICT",
                detail="Cette publication a déjà été envoyée avec un contenu différent.",
            )
        return _PersistedPost(post=existant, created=False)

    async def update_post(
        self,
        user: User,
        post_id: uuid.UUID,
        payload: PostUpdateRequest,
    ) -> PostResponse:
        post = await self._require_mutable_post(user, post_id)
        if post.type == PostType.OFFER.value:
            raise AppError(
                status_code=400,
                code="OFFER_POST_READONLY",
                detail="Les posts d'offre se synchronisent depuis la modération.",
            )
        if payload.body is not None:
            post.body = payload.body.strip()
        if payload.media_url is not None:
            post.media_url = payload.media_url
        if payload.is_active is not None:
            post.is_active = payload.is_active
        if payload.location is not None:
            post.set_location(payload.location.latitude, payload.location.longitude)
        await self._session.commit()
        await self._session.refresh(post)
        return await self._to_response(post, user)

    async def soft_delete_post(self, user: User, post_id: uuid.UUID) -> None:
        post = await self._posts.get_by_id(post_id)
        if post is None:
            raise AppError(
                status_code=404,
                code="POST_NOT_FOUND",
                detail="Publication introuvable.",
            )
        if not await self._can_moderate_post(user, post):
            raise AppError(
                status_code=403,
                code="FORBIDDEN",
                detail="Action non autorisée.",
            )
        post.is_active = False
        await self._session.commit()

    async def get_post(self, user: User, post_id: uuid.UUID) -> PostResponse:
        post = await self._posts.get_by_id(post_id, active_only=True)
        if post is not None and post.tribe_id is not None:
            raise AppError(
                status_code=404,
                code="POST_NOT_FOUND",
                detail="Publication introuvable.",
            )
        if post is None:
            raise AppError(
                status_code=404,
                code="POST_NOT_FOUND",
                detail="Publication introuvable.",
            )
        if not can_view_post(post, user.id):
            raise AppError(
                status_code=404,
                code="POST_NOT_FOUND",
                detail="Publication introuvable.",
            )
        return await self._to_response(post, user)

    async def _to_response(self, post: Post, user: User) -> PostResponse:
        liked = await self._likes.get(user_id=user.id, post_id=post.id)
        if post.author_type == PostAuthorType.ORGANIZATION.value:
            org = await self._orgs.get_by_id(post.author_id)
            author = (
                await self._authors.resolve_organization(org)
                if org
                else await self._authors.resolve_user(user.id)
            )
        else:
            author = await self._authors.resolve_user(post.author_id)
        return to_post_response(post, author=author, liked_by_me=liked is not None)

    async def _require_linked_tribe_membership(
        self, user: User, tribe_id: uuid.UUID
    ) -> None:
        tribe = await self._tribes.get_by_id(tribe_id)
        if tribe is None or tribe.archived_at is not None:
            raise AppError(
                status_code=404,
                code="TRIBE_NOT_FOUND",
                detail="Tribu introuvable.",
            )
        membership = await self._tribe_members.get_membership(tribe.id, user.id)
        if membership is None or membership.left_at is not None:
            raise AppError(
                status_code=403,
                code="FORBIDDEN",
                detail="Vous devez être membre de cette tribu.",
            )

    async def _require_mutable_post(self, user: User, post_id: uuid.UUID) -> Post:
        post = await self._posts.get_by_id(post_id)
        if post is None or not post.is_active:
            raise AppError(
                status_code=404,
                code="POST_NOT_FOUND",
                detail="Publication introuvable.",
            )
        if not await self._is_author(user, post):
            raise AppError(
                status_code=403,
                code="FORBIDDEN",
                detail="Action non autorisée.",
            )
        return post

    async def _is_author(self, user: User, post: Post) -> bool:
        if post.author_type == PostAuthorType.CITIZEN.value:
            return post.author_id == user.id
        if post.author_type == PostAuthorType.ORGANIZATION.value:
            member = await self._membership.get_active_membership(
                organization_id=post.author_id,
                user_id=user.id,
            )
            return member is not None and member.role in (
                OrganizationMemberRole.OWNER.value,
                OrganizationMemberRole.ADMIN.value,
            )
        return False

    async def _can_moderate_post(self, user: User, post: Post) -> bool:
        if await self._is_author(user, post):
            return True
        ctx = await self._rbac.get_user_rbac_context(user.id)
        return "moderation.manage" in ctx.permissions or "system.admin" in ctx.permissions
