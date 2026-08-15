"""Destructive-target policy tests (C3-F0-T1-R1).

Prove the shared resolver used by every destructive fixture is fail-closed and
never falls back to ``DATABASE_URL``. Pure decision tests: the resolver opens no
connection, so no forbidden target is ever contacted.
"""

from __future__ import annotations

import pytest
from app.qa.guard import QaGuardError

from tests import conftest_auth, conftest_migration
from tests.qa_support import configure_destructive_qa_db, resolve_destructive_qa_url

_QA_URL = "postgresql+asyncpg://u:p@postgres-qa:5432/yunicity_qa"

# External env that could make the guard refuse; scrubbed so the valid case is deterministic.
_SCRUB = (
    "DATABASE_URL",
    "STRIPE_SECRET_KEY",
    "RESEND_API_KEY",
    "SENTRY_DSN",
    "OPENWEATHER_API_KEY",
    "LOCAL_VIDEO_R2_ACCESS_KEY_ID",
    "LOCAL_VIDEO_R2_SECRET_ACCESS_KEY",
    "LOCAL_VIDEO_R2_ENDPOINT",
    "LOCAL_VIDEO_R2_BUCKET",
    "EXPO_ACCESS_TOKEN",
    "GRAND_REIMS_GTFS_URL",
    "GRAND_REIMS_GTFS_RT_URL",
)


def _valid_qa_env(monkeypatch: pytest.MonkeyPatch, *, url: str = _QA_URL) -> None:
    for key in _SCRUB:
        monkeypatch.delenv(key, raising=False)
    monkeypatch.setenv("YUNICITY_QA_MODE", "1")
    monkeypatch.setenv("YUNICITY_QA_RUN_TOKEN", "qa-token-test")
    monkeypatch.setenv("TEST_DATABASE_URL", url)
    monkeypatch.setenv("EMAIL_PROVIDER", "console")
    monkeypatch.setenv("EXPO_PUSH_ENABLED", "false")
    monkeypatch.setenv("LOCAL_VIDEO_STORAGE_BACKEND", "filesystem")


# 1a. TEST absent + no DATABASE_URL → skip (unit-only env, nothing destructive happens).
def test_absent_test_url_and_absent_database_url_skips(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("TEST_DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(pytest.skip.Exception):
        resolve_destructive_qa_url()


# 1b/2. TEST absent + DATABASE_URL=dev → refuse, NO fallback to DATABASE_URL.
def test_absent_test_url_with_database_url_refuses(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("TEST_DATABASE_URL", raising=False)
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://u:p@localhost:5434/yunicity_dev")
    with pytest.raises(QaGuardError, match="TEST_DATABASE_URL_ABSENT"):
        resolve_destructive_qa_url()


# 3. TEST=yunicity_dev → refuse.
def test_test_url_dev_refuses(monkeypatch: pytest.MonkeyPatch) -> None:
    _valid_qa_env(monkeypatch, url="postgresql+asyncpg://u:p@localhost:5434/yunicity_dev")
    with pytest.raises(QaGuardError, match="DBNAME_FORBIDDEN:yunicity_dev"):
        resolve_destructive_qa_url()


# 4. TEST=yunicity_test → refuse.
def test_test_url_test_refuses(monkeypatch: pytest.MonkeyPatch) -> None:
    _valid_qa_env(monkeypatch, url="postgresql+asyncpg://u:p@localhost:5455/yunicity_test")
    with pytest.raises(QaGuardError, match="DBNAME_FORBIDDEN:yunicity_test"):
        resolve_destructive_qa_url()


# 5. Remote target → refuse without network.
def test_remote_target_refuses(monkeypatch: pytest.MonkeyPatch) -> None:
    _valid_qa_env(
        monkeypatch, url="postgresql+asyncpg://u:p@db.remote.example.com:5455/yunicity_qa"
    )
    with pytest.raises(QaGuardError, match="HOST_PORT_NOT_ALLOWED"):
        resolve_destructive_qa_url()


# 6. QA marker absent → refuse.
def test_missing_qa_marker_refuses(monkeypatch: pytest.MonkeyPatch) -> None:
    _valid_qa_env(monkeypatch)
    monkeypatch.delenv("YUNICITY_QA_MODE", raising=False)
    with pytest.raises(QaGuardError, match="QA_MODE_ABSENT"):
        resolve_destructive_qa_url()


# 7. Valid yunicity_qa → authorized.
def test_valid_qa_target_authorized(monkeypatch: pytest.MonkeyPatch) -> None:
    _valid_qa_env(monkeypatch)
    assert resolve_destructive_qa_url() == _QA_URL


def test_configure_sets_database_url_only_after_guard(monkeypatch: pytest.MonkeyPatch) -> None:
    _valid_qa_env(monkeypatch)
    url = configure_destructive_qa_db(monkeypatch)
    assert url == _QA_URL
    import os

    assert os.environ["DATABASE_URL"] == _QA_URL


def test_configure_does_not_set_database_url_when_refused(monkeypatch: pytest.MonkeyPatch) -> None:
    _valid_qa_env(monkeypatch, url="postgresql+asyncpg://u:p@localhost:5434/yunicity_dev")
    with pytest.raises(QaGuardError):
        configure_destructive_qa_db(monkeypatch)
    import os

    # DATABASE_URL was scrubbed and must not have been set to a forbidden target.
    assert os.environ.get("DATABASE_URL", "") == ""


# 8. The auth/migration fixtures route through the shared guarded helper.
def test_auth_and_migration_fixtures_use_shared_helper() -> None:
    assert (
        getattr(conftest_auth, "configure_destructive_qa_db", None) is configure_destructive_qa_db
    )
    assert (
        getattr(conftest_migration, "configure_destructive_qa_db", None)
        is configure_destructive_qa_db
    )
