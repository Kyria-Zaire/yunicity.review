"""Admin activation waves persistence (ADMIN-02C-B)."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.activation_wave_constants import ActivationWaveItemStatus
from app.models.activation_wave import ActivationWave, ActivationWaveItem


@dataclass(frozen=True, slots=True)
class ActivationWaveItemCounts:
    items_total: int
    items_ready: int
    items_activated: int


@dataclass(frozen=True, slots=True)
class ActivationWaveListRow:
    wave: ActivationWave
    counts: ActivationWaveItemCounts


class AdminActivationWaveRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_waves(self) -> list[ActivationWaveListRow]:
        waves = (
            (
                await self._session.execute(
                    select(ActivationWave).order_by(
                        ActivationWave.sort_order,
                        ActivationWave.name,
                    )
                )
            )
            .scalars()
            .all()
        )
        if not waves:
            return []

        wave_ids = [wave.id for wave in waves]
        counts_by_wave = await self._fetch_counts_by_wave(wave_ids)
        return [
            ActivationWaveListRow(
                wave=wave,
                counts=counts_by_wave.get(
                    wave.id,
                    ActivationWaveItemCounts(items_total=0, items_ready=0, items_activated=0),
                ),
            )
            for wave in waves
        ]

    async def _fetch_counts_by_wave(
        self,
        wave_ids: list[UUID],
    ) -> dict[UUID, ActivationWaveItemCounts]:
        ready_case = case(
            (ActivationWaveItem.status == ActivationWaveItemStatus.READY.value, 1),
            else_=0,
        )
        activated_case = case(
            (ActivationWaveItem.status == ActivationWaveItemStatus.ACTIVATED.value, 1),
            else_=0,
        )
        stmt = (
            select(
                ActivationWaveItem.wave_id,
                func.count(ActivationWaveItem.id),
                func.coalesce(func.sum(ready_case), 0),
                func.coalesce(func.sum(activated_case), 0),
            )
            .where(ActivationWaveItem.wave_id.in_(wave_ids))
            .group_by(ActivationWaveItem.wave_id)
        )
        result = await self._session.execute(stmt)
        return {
            wave_id: ActivationWaveItemCounts(
                items_total=int(total or 0),
                items_ready=int(ready or 0),
                items_activated=int(activated or 0),
            )
            for wave_id, total, ready, activated in result.all()
        }

    async def get_wave_with_items(self, wave_id: UUID) -> ActivationWave | None:
        stmt = (
            select(ActivationWave)
            .options(selectinload(ActivationWave.items))
            .where(ActivationWave.id == wave_id)
        )
        result = await self._session.execute(stmt)
        return result.unique().scalar_one_or_none()

    async def get_item_by_id(self, item_id: UUID) -> ActivationWaveItem | None:
        return await self._session.get(ActivationWaveItem, item_id)
