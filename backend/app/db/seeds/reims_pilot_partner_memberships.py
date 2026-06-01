"""Reims pilot partner accounts — OWNER memberships (WEB-PARTNERS-08A).

Run via: python -m app.db.seeds --pilot
Blocked when APP_ENV is preprod or prod.

Login (recette/dev): see docs/recette/web-partners-08-pilot-accounts.md
Password: PilotReims1!Dev (same rotation policy as demo accounts).
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.organization_constants import (
    OrganizationMemberRole,
    OrganizationMemberStatus,
)
from app.core.security import hash_password
from app.db.seeds.reims_pilot_partner_public_data import PILOT_PARTNER_SLUGS
from app.db.seeds.reims_signed_partners import REIMS_SIGNED_PARTNERS_SEED
from app.models.organization import Organization, OrganizationMember
from app.models.partner_profile import PartnerProfile
from app.models.user import User
from app.repositories.rbac_repository import RbacRepository
from app.services.profile_service import ProfileService

logger = logging.getLogger(__name__)

PILOT_PARTNER_PASSWORD = "PilotReims1!Dev"

# Stable UUIDs for idempotent pilot users (one per pilot org slug).
_PILOT_USER_IDS: dict[str, uuid.UUID] = {
    "belga-queen": uuid.UUID("d6060000-0000-4000-8000-000000000001"),
    "pittaya": uuid.UUID("d6060000-0000-4000-8000-000000000002"),
    "centre-des-ressources": uuid.UUID("d6060000-0000-4000-8000-000000000003"),
    "garcon-barbiers": uuid.UUID("d6060000-0000-4000-8000-000000000004"),
}

REIMS_PILOT_PARTNER_ACCOUNTS_SEED: tuple[dict[str, Any], ...] = tuple(
    {
        "slug": slug,
        "user_id": _PILOT_USER_IDS[slug],
        "email": f"{slug}@partner.yunicity.dev",
        "full_name": next(
            entry["name"]
            for entry in REIMS_SIGNED_PARTNERS_SEED
            if entry["slug"] == slug
        ),
        "organization_id": next(
            entry["organization_id"]
            for entry in REIMS_SIGNED_PARTNERS_SEED
            if entry["slug"] == slug
        ),
    }
    for slug in sorted(PILOT_PARTNER_SLUGS)
)


async def _ensure_pilot_user(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    email: str,
    full_name: str,
) -> User:
    existing = await session.get(User, user_id)
    if existing is not None:
        existing.email = email
        existing.full_name = full_name
        existing.city = "Reims"
        existing.is_active = True
        existing.is_verified = True
        if not existing.hashed_password or existing.hashed_password == "!locked":
            existing.hashed_password = hash_password(PILOT_PARTNER_PASSWORD)
        await session.flush()
        return existing

    by_email = await session.execute(select(User).where(User.email == email))
    found = by_email.scalar_one_or_none()
    if found is not None:
        found.full_name = full_name
        found.city = "Reims"
        found.is_active = True
        found.is_verified = True
        found.hashed_password = hash_password(PILOT_PARTNER_PASSWORD)
        await session.flush()
        return found

    user = User(
        id=user_id,
        email=email,
        hashed_password=hash_password(PILOT_PARTNER_PASSWORD),
        full_name=full_name,
        city="Reims",
        is_active=True,
        is_verified=True,
    )
    session.add(user)
    await session.flush()
    await RbacRepository(session).assign_role_to_user(user.id, "USER")
    await ProfileService(session).create_profile_for_new_user(
        user_id=user.id,
        email=email,
        full_name=full_name,
        city="Reims",
    )
    return user


async def _ensure_owner_membership(
    session: AsyncSession,
    *,
    organization_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    result = await session.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if member is not None:
        member.role = OrganizationMemberRole.OWNER
        member.status = OrganizationMemberStatus.ACTIVE
        await session.flush()
        return
    session.add(
        OrganizationMember(
            organization_id=organization_id,
            user_id=user_id,
            role=OrganizationMemberRole.OWNER,
            status=OrganizationMemberStatus.ACTIVE,
        )
    )
    await session.flush()


async def seed_reims_pilot_partner_memberships(session: AsyncSession) -> None:
    """Create pilot partner users and OWNER memberships for ACTIVE public pilots."""
    for entry in REIMS_PILOT_PARTNER_ACCOUNTS_SEED:
        slug = entry["slug"]
        org = await session.execute(
            select(Organization).where(Organization.slug == slug)
        )
        organization = org.scalar_one_or_none()
        if organization is None:
            logger.warning("pilot_membership_skip org_missing slug=%s", slug)
            continue

        profile_row = await session.execute(
            select(PartnerProfile).where(PartnerProfile.organization_id == organization.id)
        )
        profile = profile_row.scalar_one_or_none()
        if profile is None:
            logger.warning("pilot_membership_skip profile_missing slug=%s", slug)
            continue

        user = await _ensure_pilot_user(
            session,
            user_id=entry["user_id"],
            email=entry["email"],
            full_name=entry["full_name"],
        )
        await _ensure_owner_membership(
            session,
            organization_id=organization.id,
            user_id=user.id,
        )

    logger.info(
        "reims_pilot_partner_memberships_seed_completed count=%s",
        len(REIMS_PILOT_PARTNER_ACCOUNTS_SEED),
    )
