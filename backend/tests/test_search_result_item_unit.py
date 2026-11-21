"""SEARCH-EVENT-PAST-STATUS-01 — `ends_at` in search results (unit, no database).

The web card decides "Terminé" from `starts_at` + `ends_at`. The response must therefore carry
`ends_at` for every item, serialized as an explicit `null` when unknown: a missing key and a
`null` value do not mean the same thing to the client.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from app.repositories.search_repository import SearchRow
from app.schemas.search import SearchResultItem
from app.services.search_service import _row_to_item

_STARTS = datetime(2026, 11, 10, 18, 0, tzinfo=UTC)
_ENDS = datetime(2026, 11, 12, 22, 0, tzinfo=UTC)


def test_row_to_item_copies_ends_at_when_set() -> None:
    row = SearchRow(
        entity_id=uuid.uuid4(), rank=0.5, title="Festival", starts_at=_STARTS, ends_at=_ENDS
    )

    item = _row_to_item(row)

    assert item.starts_at == _STARTS
    assert item.ends_at == _ENDS


def test_row_to_item_keeps_ends_at_none_when_unset() -> None:
    row = SearchRow(entity_id=uuid.uuid4(), rank=0.5, title="Concert", starts_at=_STARTS)

    item = _row_to_item(row)

    assert item.ends_at is None


def test_search_result_item_serializes_ends_at_as_explicit_null() -> None:
    payload = SearchResultItem(id=uuid.uuid4(), rank=0.1).model_dump(mode="json")

    assert "ends_at" in payload
    assert payload["ends_at"] is None


def test_search_result_item_serializes_ends_at_as_iso_datetime() -> None:
    payload = SearchResultItem(
        id=uuid.uuid4(), rank=0.1, starts_at=_STARTS, ends_at=_ENDS
    ).model_dump(mode="json")

    assert datetime.fromisoformat(payload["ends_at"]) == _ENDS
