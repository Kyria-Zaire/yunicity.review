"""Central guards — integration tests must never touch the development database."""

from __future__ import annotations

import os
from dataclasses import dataclass
from urllib.parse import unquote, urlparse

import pytest

TEST_DATABASE_URL_ENV = "TEST_DATABASE_URL"
DEV_DATABASE_URL_ENV = "DATABASE_URL"
REQUIRED_TEST_DATABASE_SUFFIX = "_test"

REFUSAL_SAME_DATABASE_MESSAGE = (
    "Refusing to run destructive tests against development database."
)
DESTRUCTIVE_BLOCKED_MESSAGE = "Destructive operation blocked outside test database."
TEST_DATABASE_URL_REQUIRED_MESSAGE = (
    "TEST_DATABASE_URL is required for integration tests. "
    "See backend/docs/test-database-safety.md"
)
INVALID_TEST_DATABASE_NAME_MESSAGE = (
    "TEST_DATABASE_URL must point to a database whose name ends with "
    f"'{REQUIRED_TEST_DATABASE_SUFFIX}'."
)


@dataclass(frozen=True)
class ParsedDatabaseUrl:
    host: str
    port: int
    database: str
    raw: str

    @property
    def identity(self) -> tuple[str, int, str]:
        return (self.host.lower(), self.port, self.database.lower())


def parse_database_url(url: str) -> ParsedDatabaseUrl:
    """Parse SQLAlchemy-style PostgreSQL URLs (e.g. postgresql+asyncpg://…)."""
    normalized = url.strip()
    if not normalized:
        raise ValueError("Database URL is empty")

    parseable = normalized
    if "://" in normalized:
        scheme, rest = normalized.split("://", 1)
        if "+" in scheme:
            parseable = f"postgresql://{rest}"

    parsed = urlparse(parseable)
    if not parsed.hostname:
        raise ValueError(f"Could not parse database host from URL: {url}")

    database = unquote(parsed.path.lstrip("/")).split("?")[0]
    if not database:
        raise ValueError(f"Could not parse database name from URL: {url}")

    port = parsed.port or 5432
    return ParsedDatabaseUrl(
        host=parsed.hostname,
        port=port,
        database=database,
        raw=normalized,
    )


def is_test_database_name(database_name: str) -> bool:
    return database_name.lower().endswith(REQUIRED_TEST_DATABASE_SUFFIX)


def urls_point_to_same_database(url_a: str, url_b: str) -> bool:
    if url_a.strip() == url_b.strip():
        return True
    return parse_database_url(url_a).identity == parse_database_url(url_b).identity


def validate_test_database_isolation(
    test_database_url: str,
    *,
    dev_database_url: str | None = None,
) -> None:
    """Fail fast when test and dev databases are the same target."""
    if dev_database_url is not None:
        dev_url = dev_database_url.strip()
    else:
        dev_url = os.environ.get(DEV_DATABASE_URL_ENV, "").strip()
    if dev_url and urls_point_to_same_database(dev_url, test_database_url):
        raise RuntimeError(REFUSAL_SAME_DATABASE_MESSAGE)

    parsed = parse_database_url(test_database_url)
    if not is_test_database_name(parsed.database):
        raise RuntimeError(
            f"{INVALID_TEST_DATABASE_NAME_MESSAGE} Got '{parsed.database}'."
        )


def require_integration_database_url() -> str:
    """Return TEST_DATABASE_URL after validation (raises on misconfiguration)."""
    test_url = os.environ.get(TEST_DATABASE_URL_ENV, "").strip()
    if not test_url:
        raise RuntimeError(TEST_DATABASE_URL_REQUIRED_MESSAGE)
    validate_test_database_isolation(test_url)
    return test_url


def get_integration_database_url_or_skip() -> str:
    """Return TEST_DATABASE_URL or skip when integration DB is not configured."""
    test_url = os.environ.get(TEST_DATABASE_URL_ENV, "").strip()
    if not test_url:
        pytest.skip("TEST_DATABASE_URL not set — skip integration tests")
    validate_test_database_isolation(test_url)
    return test_url


def configure_integration_database(monkeypatch: pytest.MonkeyPatch) -> str:
    """Point application DATABASE_URL to the isolated test database for pytest."""
    test_url = get_integration_database_url_or_skip()
    monkeypatch.setenv(DEV_DATABASE_URL_ENV, test_url)
    return test_url


def assert_destructive_operation_allowed(database_url: str | None = None) -> None:
    """Block DROP/TRUNCATE/reset helpers unless the target is a *_test database."""
    url = (database_url or os.environ.get(DEV_DATABASE_URL_ENV, "")).strip()
    if not url:
        raise RuntimeError(TEST_DATABASE_URL_REQUIRED_MESSAGE)

    parsed = parse_database_url(url)
    if not is_test_database_name(parsed.database):
        raise RuntimeError(DESTRUCTIVE_BLOCKED_MESSAGE)


def destructive_sql(statement: str, *, database_url: str | None = None) -> str:
    """Validate environment then return the SQL statement for execution."""
    assert_destructive_operation_allowed(database_url)
    return statement
