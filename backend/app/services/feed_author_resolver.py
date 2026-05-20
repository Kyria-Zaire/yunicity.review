"""Resolve feed author display metadata (TICKET-402)."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.feed_constants import PostAuthorType
from app.models.organization import Organization
from app.models.post import Post
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.feed import FeedAuthor


class FeedAuthorResolver:
    def __init__(self, session: AsyncSession) -> None:
        self._profiles = ProfileRepository(session)
        self._orgs = OrganizationRepository(session)

    async def resolve_posts(self, posts: list[Post]) -> dict[uuid.UUID, FeedAuthor]:
        citizen_ids = [p.author_id for p in posts if p.author_type == PostAuthorType.CITIZEN.value]
        org_ids = [p.author_id for p in posts if p.author_type == PostAuthorType.ORGANIZATION.value]
        authors: dict[uuid.UUID, FeedAuthor] = {}

        for user_id in set(citizen_ids):
            profile = await self._profiles.get_by_user_id(user_id)
            display = profile.display_name if profile and profile.display_name else "Citoyen"
            username = profile.username if profile else None
            authors[user_id] = FeedAuthor(
                type=PostAuthorType.CITIZEN.value,
                id=user_id,
                display_name=display,
                username=username,
            )

        for org_id in set(org_ids):
            org = await self._orgs.get_by_id(org_id)
            if org is None:
                continue
            authors[org_id] = FeedAuthor(
                type=PostAuthorType.ORGANIZATION.value,
                id=org_id,
                display_name=org.name,
                logo_url=org.logo_url,
            )

        return authors

    async def resolve_user(self, user_id: uuid.UUID) -> FeedAuthor:
        profile = await self._profiles.get_by_user_id(user_id)
        display = profile.display_name if profile and profile.display_name else "Citoyen"
        return FeedAuthor(
            type=PostAuthorType.CITIZEN.value,
            id=user_id,
            display_name=display,
            username=profile.username if profile else None,
        )

    async def resolve_organization(self, org: Organization) -> FeedAuthor:
        return FeedAuthor(
            type=PostAuthorType.ORGANIZATION.value,
            id=org.id,
            display_name=org.name,
            logo_url=org.logo_url,
        )
