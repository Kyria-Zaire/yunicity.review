"""Passport V2 reputation service — event journal + snapshot (PASSPORT-01A).

PASSPORT-01B will connect existing passport_stamps and redemptions to reputation
attribution via hooks; no backfill script in this ticket.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.passport_reputation_constants import (
    PASSPORT_REPUTATION_EVENT_TYPES,
    PASSPORT_REPUTATION_SOURCE_TYPES,
)
from app.models.passport_reputation import ReputationEvent, UserReputationSnapshot


class PassportReputationService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def award_points(
        self,
        user_id: uuid.UUID,
        event_type: str,
        source_type: str,
        points: int,
        *,
        source_id: uuid.UUID | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> ReputationEvent:
        normalized_event_type = self._validate_event_type(event_type)
        normalized_source_type = self._validate_source_type(source_type)
        self._validate_points(points)

        event = ReputationEvent(
            user_id=user_id,
            event_type=normalized_event_type,
            source_type=normalized_source_type,
            source_id=source_id,
            points=points,
            metadata_=metadata,
        )
        self._session.add(event)
        try:
            await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            if source_id is None:
                raise AppError(
                    status_code=409,
                    code="REPUTATION_EVENT_CONFLICT",
                    detail="Conflit lors de l'attribution de réputation.",
                ) from exc
            existing = await self._find_existing_event(
                user_id=user_id,
                event_type=normalized_event_type,
                source_type=normalized_source_type,
                source_id=source_id,
            )
            if existing is None:
                raise AppError(
                    status_code=409,
                    code="REPUTATION_EVENT_CONFLICT",
                    detail="Conflit lors de l'attribution de réputation.",
                ) from exc
            return existing

        await self._apply_snapshot_delta(
            user_id=user_id,
            points=points,
            last_event_at=event.created_at,
        )
        await self._session.commit()
        await self._session.refresh(event)
        return event

    async def get_reputation(self, user_id: uuid.UUID) -> UserReputationSnapshot:
        snapshot = await self._session.get(UserReputationSnapshot, user_id)
        if snapshot is not None:
            return snapshot
        return UserReputationSnapshot(
            user_id=user_id,
            total_points=0,
            last_event_at=None,
        )

    async def has_existing_event(
        self,
        user_id: uuid.UUID,
        event_type: str,
        source_type: str,
        source_id: uuid.UUID,
    ) -> bool:
        normalized_event_type = self._validate_event_type(event_type)
        normalized_source_type = self._validate_source_type(source_type)
        existing = await self._find_existing_event(
            user_id=user_id,
            event_type=normalized_event_type,
            source_type=normalized_source_type,
            source_id=source_id,
        )
        return existing is not None

    async def rebuild_snapshot(self, user_id: uuid.UUID) -> UserReputationSnapshot:
        totals = await self._session.execute(
            select(
                func.coalesce(func.sum(ReputationEvent.points), 0),
                func.max(ReputationEvent.created_at),
            ).where(ReputationEvent.user_id == user_id)
        )
        total_points, last_event_at = totals.one()

        stmt = (
            select(UserReputationSnapshot)
            .where(UserReputationSnapshot.user_id == user_id)
            .with_for_update()
        )
        result = await self._session.execute(stmt)
        snapshot = result.scalar_one_or_none()
        if snapshot is None:
            snapshot = UserReputationSnapshot(
                user_id=user_id,
                total_points=int(total_points),
                last_event_at=last_event_at,
            )
            self._session.add(snapshot)
        else:
            snapshot.total_points = int(total_points)
            snapshot.last_event_at = last_event_at
            snapshot.updated_at = datetime.now(UTC)

        await self._session.commit()
        await self._session.refresh(snapshot)
        return snapshot

    async def _apply_snapshot_delta(
        self,
        *,
        user_id: uuid.UUID,
        points: int,
        last_event_at: datetime,
    ) -> None:
        insert_stmt = pg_insert(UserReputationSnapshot).values(
            user_id=user_id,
            total_points=points,
            last_event_at=last_event_at,
        )
        upsert = insert_stmt.on_conflict_do_update(
            index_elements=["user_id"],
            set_={
                "total_points": UserReputationSnapshot.total_points
                + insert_stmt.excluded.total_points,
                "last_event_at": func.coalesce(
                    func.greatest(
                        UserReputationSnapshot.last_event_at,
                        insert_stmt.excluded.last_event_at,
                    ),
                    insert_stmt.excluded.last_event_at,
                    UserReputationSnapshot.last_event_at,
                ),
                "updated_at": datetime.now(UTC),
            },
        )
        await self._session.execute(upsert)

    async def _find_existing_event(
        self,
        *,
        user_id: uuid.UUID,
        event_type: str,
        source_type: str,
        source_id: uuid.UUID,
    ) -> ReputationEvent | None:
        result = await self._session.execute(
            select(ReputationEvent).where(
                ReputationEvent.user_id == user_id,
                ReputationEvent.event_type == event_type,
                ReputationEvent.source_type == source_type,
                ReputationEvent.source_id == source_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    def _validate_event_type(event_type: str) -> str:
        normalized = event_type.strip()
        if normalized not in PASSPORT_REPUTATION_EVENT_TYPES:
            raise AppError(
                status_code=400,
                code="REPUTATION_INVALID_EVENT_TYPE",
                detail="Type d'événement de réputation invalide.",
            )
        return normalized

    @staticmethod
    def _validate_source_type(source_type: str) -> str:
        normalized = source_type.strip()
        if normalized not in PASSPORT_REPUTATION_SOURCE_TYPES:
            raise AppError(
                status_code=400,
                code="REPUTATION_INVALID_SOURCE_TYPE",
                detail="Type de source de réputation invalide.",
            )
        return normalized

    @staticmethod
    def _validate_points(points: int) -> None:
        if points <= 0:
            raise AppError(
                status_code=400,
                code="REPUTATION_INVALID_POINTS",
                detail="Les points de réputation doivent être strictement positifs.",
            )
