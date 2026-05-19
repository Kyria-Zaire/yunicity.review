"""Best-effort passport level evaluation after citizen activity (TICKET-502)."""

from __future__ import annotations

import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.passport_level_service import PassportLevelService

logger = logging.getLogger(__name__)


async def evaluate_passport_level_after_activity(
    session: AsyncSession,
    passport_id: uuid.UUID,
) -> None:
    try:
        await PassportLevelService(session).evaluate_and_maybe_promote(passport_id)
    except Exception:
        logger.warning(
            "passport_level_evaluation_failed",
            extra={"passport_id": str(passport_id)},
            exc_info=True,
        )
