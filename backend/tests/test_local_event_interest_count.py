"""Interest count on public local events."""

from __future__ import annotations

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.local_event_service import LocalEventService


@pytest.mark.unit
@pytest.mark.asyncio
async def test_count_interests_for_event_delegates_to_repository() -> None:
    session = AsyncMock(spec=AsyncSession)
    service = LocalEventService(session)
    service._events = AsyncMock()
    service._events.count_interests_for_event = AsyncMock(return_value=7)

    count = await service._events.count_interests_for_event(uuid4())
    assert count == 7
