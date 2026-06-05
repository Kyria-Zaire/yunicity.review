"""Seed bootstrap SUPER_ADMIN account (PLATFORM-AUTH-RECOVERY-01)."""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.services.bootstrap_admin_service import (
    BootstrapAdminResult,
    BootstrapCredentialsMissingError,
    bootstrap_admin_account,
)

logger = logging.getLogger(__name__)


async def seed_bootstrap_admin(
    session: AsyncSession,
    settings: Settings,
) -> BootstrapAdminResult | None:
    try:
        result = await bootstrap_admin_account(session, settings)
    except BootstrapCredentialsMissingError as exc:
        logger.warning("Bootstrap admin skipped: %s", exc)
        return None
    logger.info(
        "Bootstrap admin upserted email=%s user_id=%s created=%s",
        result.email,
        result.user_id,
        result.created,
    )
    return result
