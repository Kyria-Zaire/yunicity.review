"""Idempotent seed for Passport V2 challenge catalog (PASSPORT-04A)."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.passport_challenge_constants import MVP_PASSPORT_CHALLENGE_SEED
from app.models.passport_challenge import PassportChallenge


def _apply_challenge_fields(challenge: PassportChallenge, row: dict[str, Any]) -> None:
    challenge.name = str(row["name"])
    challenge.description = str(row["description"])
    challenge.family = str(row["family"])
    challenge.rarity = str(row["rarity"])
    challenge.challenge_type = str(row["challenge_type"])
    challenge.target_value = int(row["target_value"])
    challenge.ym_reward = int(row["ym_reward"])
    badge_code = row.get("badge_code")
    challenge.badge_code = str(badge_code) if badge_code is not None else None
    challenge.is_active = bool(row["is_active"])
    challenge.display_order = int(row["display_order"])


async def seed_passport_challenges(session: AsyncSession) -> None:
    """Upsert MVP Reims challenges — relançable, never deletes existing rows."""
    for row in MVP_PASSPORT_CHALLENGE_SEED:
        code = str(row["code"])
        existing = await session.scalar(
            select(PassportChallenge).where(PassportChallenge.code == code).limit(1)
        )
        if existing is not None:
            _apply_challenge_fields(existing, row)
            continue
        challenge = PassportChallenge(code=code, target_value=int(row["target_value"]))
        _apply_challenge_fields(challenge, row)
        session.add(challenge)
    await session.flush()
