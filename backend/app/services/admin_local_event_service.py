"""Admin local event read service (ADMIN-05C)."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.repositories.admin_local_event_repository import AdminLocalEventRepository
from app.schemas.admin_local_event import (
    AdminLocalEventDetailResponse,
    AdminLocalEventOrganizationDetail,
)


class AdminLocalEventService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = AdminLocalEventRepository(session)

    async def get_event_detail(self, event_id: uuid.UUID) -> AdminLocalEventDetailResponse:
        event = await self._repo.get_by_id(event_id)
        if event is None:
            raise AppError(
                status_code=404,
                code="EVENT_NOT_FOUND",
                detail="Événement introuvable.",
            )
        interest_count = await self._repo.count_interests(event_id)
        org = event.organization
        org_detail = None
        if org is not None:
            org_detail = AdminLocalEventOrganizationDetail(
                id=org.id,
                name=org.name,
                slug=org.slug,
                verification_status=org.verification_status,
                visibility=org.visibility,
            )
        return AdminLocalEventDetailResponse(
            id=event.id,
            title=event.title,
            description=event.description,
            city=event.city,
            location_name=event.location_name,
            address=event.address,
            starts_at=event.starts_at,
            ends_at=event.ends_at,
            timezone=event.timezone,
            visibility=event.visibility,
            moderation_status=event.moderation_status,
            is_cancelled=event.is_cancelled,
            interest_count=interest_count,
            rejection_reason=event.rejection_reason,
            organization=org_detail,
            created_at=event.created_at,
            updated_at=event.updated_at,
        )
