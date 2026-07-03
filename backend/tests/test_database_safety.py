"""Unit tests for test database safety guards."""

from __future__ import annotations

import pytest

from tests.database_safety import (
    DESTRUCTIVE_BLOCKED_MESSAGE,
    REFUSAL_SAME_DATABASE_MESSAGE,
    TEST_DATABASE_URL_REQUIRED_MESSAGE,
    assert_destructive_operation_allowed,
    configure_integration_database,
    is_test_database_name,
    parse_database_url,
    require_integration_database_url,
    urls_point_to_same_database,
    validate_test_database_isolation,
)

DEV_URL = "postgresql+asyncpg://yunicity:secret@localhost:5434/yunicity_dev"
TEST_URL = "postgresql+asyncpg://yunicity:secret@localhost:5434/yunicity_test"
OTHER_TEST_URL = "postgresql+asyncpg://yunicity:secret@localhost:5435/yunicity_test"


def test_parse_database_url_asyncpg_driver() -> None:
    parsed = parse_database_url(TEST_URL)
    assert parsed.host == "localhost"
    assert parsed.port == 5434
    assert parsed.database == "yunicity_test"


def test_is_test_database_name() -> None:
    assert is_test_database_name("yunicity_test") is True
    assert is_test_database_name("yunicity_dev") is False


def test_urls_point_to_same_database_exact_match() -> None:
    assert urls_point_to_same_database(DEV_URL, DEV_URL) is True


def test_urls_point_to_same_database_same_host_and_db() -> None:
    alias = "postgresql://yunicity:secret@localhost:5434/yunicity_dev"
    assert urls_point_to_same_database(DEV_URL, alias) is True


def test_urls_point_to_different_database_same_host() -> None:
    assert urls_point_to_same_database(DEV_URL, TEST_URL) is False


def test_isolation_refuses_same_database(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(RuntimeError, match=REFUSAL_SAME_DATABASE_MESSAGE):
        validate_test_database_isolation(DEV_URL, dev_database_url=DEV_URL)


def test_isolation_refuses_same_host_and_db(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(RuntimeError, match=REFUSAL_SAME_DATABASE_MESSAGE):
        validate_test_database_isolation(
            TEST_URL.replace("yunicity_test", "yunicity_dev"),
            dev_database_url=DEV_URL,
        )


def test_isolation_accepts_real_test_db(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", DEV_URL)
    validate_test_database_isolation(TEST_URL)


def test_validate_test_database_isolation_rejects_non_test_name() -> None:
    bad_test_url = "postgresql+asyncpg://yunicity:secret@localhost:5434/yunicity_dev"
    with pytest.raises(RuntimeError, match="ends with '_test'"):
        validate_test_database_isolation(bad_test_url, dev_database_url=OTHER_TEST_URL)


def test_require_integration_database_url_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("TEST_DATABASE_URL", raising=False)
    with pytest.raises(RuntimeError, match=TEST_DATABASE_URL_REQUIRED_MESSAGE):
        require_integration_database_url()


def test_require_integration_database_url_accepts_test_db(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TEST_DATABASE_URL", TEST_URL)
    monkeypatch.setenv("DATABASE_URL", DEV_URL)
    assert require_integration_database_url() == TEST_URL


def test_configure_integration_database_sets_database_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TEST_DATABASE_URL", TEST_URL)
    monkeypatch.setenv("DATABASE_URL", DEV_URL)
    url = configure_integration_database(monkeypatch)
    assert url == TEST_URL
    import os

    assert os.environ["DATABASE_URL"] == TEST_URL


def test_configure_integration_database_skips_when_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("TEST_DATABASE_URL", raising=False)
    with pytest.raises(Exception, match="TEST_DATABASE_URL not set"):
        configure_integration_database(monkeypatch)


def test_destructive_blocks_dev_db(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", DEV_URL)
    with pytest.raises(RuntimeError, match=DESTRUCTIVE_BLOCKED_MESSAGE):
        assert_destructive_operation_allowed()


def test_destructive_accepts_test_db(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", TEST_URL)
    assert_destructive_operation_allowed()
