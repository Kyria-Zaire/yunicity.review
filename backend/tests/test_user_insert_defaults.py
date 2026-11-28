"""Deployment-window compatibility of ``users`` inserts (PASSPORT-PRESENCE-01, 01A).

Railway runs ``alembic upgrade head`` while the previous application still serves:

- after 20261126_0068, ``is_system_account`` and ``force_password_reset`` have no server
  default, so every INSERT must carry them. The ORM does, through its Python-side
  ``default=False`` (also declared by the deployed model at ``ea1edf11``), even when the
  caller never sets them;
- after 20261126_0067, the previous application does not know ``is_test``; its INSERTs
  omit the column, so ``is_test`` MUST keep a server default.
"""

from __future__ import annotations

import pytest
from app.models.user import User
from sqlalchemy import insert

pytestmark = pytest.mark.unit

_CALLER_KEYS = ["id", "email", "hashed_password", "full_name"]


@pytest.mark.parametrize("name", ["is_system_account", "force_password_reset"])
def test_orm_insert_always_carries_flags_without_server_default(name: str) -> None:
    column = User.__table__.c[name]
    assert column.server_default is None
    assert column.default is not None and column.default.is_scalar
    assert column.default.arg is False

    # The caller sets only these keys; the column must still be rendered in the INSERT
    # (its Python default is evaluated at execution time, hence not in compiled params).
    compiled = insert(User).compile(column_keys=_CALLER_KEYS)
    assert name in str(compiled)


def test_is_test_keeps_a_server_default_for_the_previous_application() -> None:
    column = User.__table__.c.is_test
    assert column.server_default is not None
    assert str(column.server_default.arg) == "false"
    assert column.nullable is False
