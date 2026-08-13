"""Unit tests for the QA anti-production guard (C3-F0-T1).

These tests are pure decision tests: they build env mappings and assert the
guard's verdict. No forbidden target is ever contacted because the guard opens
no socket/DB connection — see the network-free assertion below.
"""

from __future__ import annotations

import socket
from collections.abc import Mapping

import pytest
from app.qa.guard import (
    QA_DB_NAME,
    QaGuardError,
    QaTarget,
    evaluate_qa_database_target,
    evaluate_qa_guard,
)

_VALID_QA_URL = f"postgresql+asyncpg://qa_user:qa_pass@localhost:5455/{QA_DB_NAME}"


def _base_env(**overrides: str) -> dict[str, str]:
    """A fully valid QA env; individual tests override one dimension at a time."""
    env: dict[str, str] = {
        "YUNICITY_QA_MODE": "1",
        "YUNICITY_QA_RUN_TOKEN": "qa-run-token-fixture",
        "TEST_DATABASE_URL": _VALID_QA_URL,
        "EMAIL_PROVIDER": "console",
        "EXPO_PUSH_ENABLED": "false",
        "LOCAL_VIDEO_STORAGE_BACKEND": "filesystem",
    }
    env.update(overrides)
    return env


# 1. Full valid local yunicity_qa -> authorized.
def test_valid_qa_target_is_authorized() -> None:
    target = evaluate_qa_guard(_base_env())
    assert isinstance(target, QaTarget)
    assert target.host == "localhost"
    assert target.port == 5455
    assert target.dbname == QA_DB_NAME
    # confirmation exposes no credentials
    assert "qa_pass" not in target.confirmation()
    assert "qa_user" not in target.confirmation()


def test_valid_docker_service_triplet_is_authorized() -> None:
    env = _base_env(TEST_DATABASE_URL=f"postgresql+asyncpg://u:p@postgres-qa:5432/{QA_DB_NAME}")
    target = evaluate_qa_guard(env)
    assert (target.host, target.port, target.dbname) == ("postgres-qa", 5432, QA_DB_NAME)


# 2. yunicity_dev -> refused.
def test_yunicity_dev_is_refused() -> None:
    env = _base_env(TEST_DATABASE_URL="postgresql+asyncpg://u:p@localhost:5434/yunicity_dev")
    with pytest.raises(QaGuardError, match="DBNAME_FORBIDDEN:yunicity_dev"):
        evaluate_qa_guard(env)


# 3. yunicity_test -> refused.
def test_yunicity_test_is_refused() -> None:
    env = _base_env(TEST_DATABASE_URL="postgresql+asyncpg://u:p@localhost:5455/yunicity_test")
    with pytest.raises(QaGuardError, match="DBNAME_FORBIDDEN:yunicity_test"):
        evaluate_qa_guard(env)


# 4. Remote host -> refused.
def test_remote_host_is_refused() -> None:
    env = _base_env(
        TEST_DATABASE_URL=f"postgresql+asyncpg://u:p@db.internal.example.com:5455/{QA_DB_NAME}"
    )
    with pytest.raises(QaGuardError, match="HOST_PORT_NOT_ALLOWED"):
        evaluate_qa_guard(env)


# 5. Railway URL -> refused.
def test_railway_url_is_refused() -> None:
    env = _base_env(
        TEST_DATABASE_URL=(
            f"postgresql+asyncpg://u:p@containers-us-west.railway.app:5455/{QA_DB_NAME}"
        )
    )
    with pytest.raises(QaGuardError, match="HOST_FORBIDDEN:railway"):
        evaluate_qa_guard(env)


def test_railway_env_var_is_refused() -> None:
    env = _base_env()
    env["RAILWAY_ENVIRONMENT"] = "production"
    with pytest.raises(QaGuardError, match="RAILWAY_ENV_PRESENT"):
        evaluate_qa_guard(env)


# 6. Dev port 5434 -> refused (even with a qa-looking dbname).
def test_dev_port_is_refused() -> None:
    env = _base_env(TEST_DATABASE_URL=f"postgresql+asyncpg://u:p@localhost:5434/{QA_DB_NAME}")
    with pytest.raises(QaGuardError, match="DEV_PORT_5434"):
        evaluate_qa_guard(env)


# 7. Resend provider active -> refused.
def test_resend_provider_is_refused() -> None:
    env = _base_env(EMAIL_PROVIDER="resend")
    with pytest.raises(QaGuardError, match="EMAIL_PROVIDER_EXTERNAL"):
        evaluate_qa_guard(env)


# 8. Push enabled -> refused.
def test_push_enabled_is_refused() -> None:
    env = _base_env(EXPO_PUSH_ENABLED="true")
    with pytest.raises(QaGuardError, match="PUSH_ENABLED"):
        evaluate_qa_guard(env)


# 9. R2 storage -> refused.
def test_r2_storage_is_refused() -> None:
    env = _base_env(LOCAL_VIDEO_STORAGE_BACKEND="r2")
    with pytest.raises(QaGuardError, match="STORAGE_NOT_FILESYSTEM"):
        evaluate_qa_guard(env)


# 10. Non-empty external key -> refused.
def test_external_key_present_is_refused() -> None:
    env = _base_env(STRIPE_SECRET_KEY="sk_live_something")
    with pytest.raises(QaGuardError, match="EXTERNAL_KEY_PRESENT:STRIPE_SECRET_KEY"):
        evaluate_qa_guard(env)


# 11. QA marker absent -> refused.
def test_missing_qa_mode_is_refused() -> None:
    env = _base_env()
    del env["YUNICITY_QA_MODE"]
    with pytest.raises(QaGuardError, match="QA_MODE_ABSENT"):
        evaluate_qa_guard(env)


def test_missing_qa_run_token_is_refused() -> None:
    env = _base_env(YUNICITY_QA_RUN_TOKEN="")
    with pytest.raises(QaGuardError, match="QA_RUN_TOKEN_ABSENT"):
        evaluate_qa_guard(env)


# 12. Valid but incomplete configuration -> refused.
def test_missing_test_database_url_is_refused() -> None:
    env = _base_env()
    del env["TEST_DATABASE_URL"]
    with pytest.raises(QaGuardError, match="TEST_DATABASE_URL_ABSENT"):
        evaluate_qa_guard(env)


def test_unparseable_url_is_refused() -> None:
    env = _base_env(TEST_DATABASE_URL="::::not-a-url::::")
    with pytest.raises(QaGuardError):
        evaluate_qa_guard(env)


def test_no_fallback_to_database_url() -> None:
    """Even a perfectly valid DATABASE_URL must not authorize when TEST_DATABASE_URL is absent."""
    env = _base_env()
    del env["TEST_DATABASE_URL"]
    env["DATABASE_URL"] = _VALID_QA_URL
    with pytest.raises(QaGuardError, match="TEST_DATABASE_URL_ABSENT"):
        evaluate_qa_guard(env)


def test_guard_opens_no_socket(monkeypatch: pytest.MonkeyPatch) -> None:
    """Structural proof the negative paths are network-free: fail the test if the guard
    tries to open any socket, for both an authorized and a refused configuration."""

    def _boom(*_args: object, **_kwargs: object) -> None:
        raise AssertionError("guard must not open a socket")

    monkeypatch.setattr(socket.socket, "connect", _boom)
    monkeypatch.setattr(socket, "create_connection", _boom)

    evaluate_qa_guard(_base_env())  # authorized path
    for bad in (
        _base_env(TEST_DATABASE_URL="postgresql+asyncpg://u:p@localhost:5434/yunicity_dev"),
        _base_env(LOCAL_VIDEO_STORAGE_BACKEND="r2"),
    ):
        with pytest.raises(QaGuardError):
            evaluate_qa_guard(bad)


def _assert_is_mapping(env: Mapping[str, str]) -> None:
    assert isinstance(env, Mapping)


# --- DB-target vs full guard decoupling (C3-F0-T1-R1) ---------------------------------


def test_database_target_allows_mocked_external_key() -> None:
    """A per-test DB fixture may set a mocked provider key; the DB target stays valid."""
    env = _base_env(LOCAL_VIDEO_R2_ACCESS_KEY_ID="r2-mock-key")
    target = evaluate_qa_database_target(env)
    assert (target.host, target.port, target.dbname) == ("localhost", 5455, QA_DB_NAME)


def test_database_target_still_enforces_dbname() -> None:
    env = _base_env(TEST_DATABASE_URL="postgresql+asyncpg://u:p@localhost:5455/yunicity_test")
    with pytest.raises(QaGuardError, match="DBNAME_FORBIDDEN:yunicity_test"):
        evaluate_qa_database_target(env)


def test_database_target_still_requires_marker() -> None:
    env = _base_env()
    del env["YUNICITY_QA_MODE"]
    with pytest.raises(QaGuardError, match="QA_MODE_ABSENT"):
        evaluate_qa_database_target(env)


def test_full_guard_still_rejects_external_key() -> None:
    """The full guard (reset/seed/launcher) remains hermetic and refuses live keys."""
    env = _base_env(LOCAL_VIDEO_R2_ACCESS_KEY_ID="r2-mock-key")
    with pytest.raises(QaGuardError, match="EXTERNAL_KEY_PRESENT"):
        evaluate_qa_guard(env)
