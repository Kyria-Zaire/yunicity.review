"""Admin activation waves staff API (ADMIN-02C-B)."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.activation_wave import ActivationWave, ActivationWaveItem
from app.repositories.admin_activation_wave_repository import AdminActivationWaveRepository
from app.schemas.admin_activation_wave import (
    ActivationWaveChecklistV1,
    AdminActivationWaveDetailResponse,
    AdminActivationWaveItemPatchRequest,
    AdminActivationWaveItemResponse,
    AdminActivationWaveListItem,
    AdminActivationWaveSummary,
    checklist_v1_to_dict,
)


class AdminActivationWaveService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = AdminActivationWaveRepository(session)

    async def list_waves(self) -> list[AdminActivationWaveListItem]:
        rows = await self._repo.list_waves()
        return [
            AdminActivationWaveListItem(
                id=row.wave.id,
                city=row.wave.city,
                code=row.wave.code,
                name=row.wave.name,
                status=row.wave.status,
                items_total=row.counts.items_total,
                items_ready=row.counts.items_ready,
                items_activated=row.counts.items_activated,
            )
            for row in rows
        ]

    async def get_wave_detail(self, wave_id: UUID) -> AdminActivationWaveDetailResponse:
        wave = await self._require_wave(wave_id)
        items = sorted(wave.items, key=lambda item: (item.sort_order, item.partner_name_snapshot))
        return AdminActivationWaveDetailResponse(
            wave=self._wave_summary(wave),
            items=[self._item_response(item) for item in items],
        )

    async def patch_item(
        self,
        item_id: UUID,
        payload: AdminActivationWaveItemPatchRequest,
    ) -> AdminActivationWaveItemResponse:
        if payload.status is None and payload.checklist is None and payload.notes is None:
            raise AppError(
                status_code=422,
                code="EMPTY_PATCH_PAYLOAD",
                detail="Au moins un champ doit être fourni (status, checklist, notes).",
            )

        item = await self._require_item(item_id)
        if payload.status is not None:
            item.status = payload.status
        if payload.checklist is not None:
            item.checklist = checklist_v1_to_dict(payload.checklist)
        if payload.notes is not None:
            item.notes = payload.notes.strip() or None

        await self._session.commit()
        await self._session.refresh(item)
        return self._item_response(item)

    async def _require_wave(self, wave_id: UUID) -> ActivationWave:
        wave = await self._repo.get_wave_with_items(wave_id)
        if wave is None:
            raise AppError(
                status_code=404,
                code="ACTIVATION_WAVE_NOT_FOUND",
                detail="Vague d'activation introuvable.",
            )
        return wave

    async def _require_item(self, item_id: UUID) -> ActivationWaveItem:
        item = await self._repo.get_item_by_id(item_id)
        if item is None:
            raise AppError(
                status_code=404,
                code="ACTIVATION_WAVE_ITEM_NOT_FOUND",
                detail="Élément de vague introuvable.",
            )
        return item

    @staticmethod
    def _wave_summary(wave: ActivationWave) -> AdminActivationWaveSummary:
        return AdminActivationWaveSummary(
            id=wave.id,
            city=wave.city,
            code=wave.code,
            name=wave.name,
            description=wave.description,
            status=wave.status,
            sort_order=wave.sort_order,
        )

    @staticmethod
    def _item_response(item: ActivationWaveItem) -> AdminActivationWaveItemResponse:
        return AdminActivationWaveItemResponse(
            id=item.id,
            organization_id=item.organization_id,
            partner_profile_id=item.partner_profile_id,
            partner_name_snapshot=item.partner_name_snapshot,
            partner_slug_snapshot=item.partner_slug_snapshot,
            status=item.status,
            checklist=ActivationWaveChecklistV1.model_validate(item.checklist),
            notes=item.notes,
        )
