"""PASSPORT-PRESENCE-01 (01A, 01B) — fail-closed flag, dedicated pepper and mandatory
Redis (D2 of 01B), without database."""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest
from app.core.config import Settings, get_settings
from app.core.presence_constants import (
    PRESENCE_CAMPAIGN_STATUSES,
    PRESENCE_CAMPAIGN_TRANSITIONS,
    PRESENCE_TOKEN_PEPPER_MIN_LENGTH,
)
from app.main import create_app
from fastapi.routing import APIRoute
from pydantic import ValidationError

pytestmark = pytest.mark.unit

BACKEND_ROOT = Path(__file__).resolve().parents[1]
#: Test-only value, not a secret: long enough and distinct from every other secret.
_TEST_PEPPER = "test-only-presence-pepper-not-a-secret-0001"
_TEST_JWT = "test-secret-key-at-least-32-characters-long!!"
_PRESENCE_PREFIX = "/api/v1/admin/presence"
_SESSION_PATH = "/api/v1/passport/me/presence-session"
#: Test-only URL: settings validation only checks that it is present.
_TEST_REDIS_URL = "redis://127.0.0.1:6390/0"


@pytest.fixture
def clean_presence_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    for name in ("PRESENCE_VALIDATION_ENABLED", "PRESENCE_TOKEN_PEPPER"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("JWT_SECRET_KEY", _TEST_JWT)
    # Explicit: flag-on tests must not depend on an ambient REDIS_URL (D2 of 01B).
    monkeypatch.setenv("REDIS_URL", _TEST_REDIS_URL)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def _settings(monkeypatch: pytest.MonkeyPatch, **env: str) -> Settings:
    """Load settings from process variables only, as in a deployment (never a ``.env``)."""
    for name, value in env.items():
        monkeypatch.setenv(name, value)
    return Settings(_env_file=None)


def test_flag_is_false_by_default(
    clean_presence_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    assert Settings.model_fields["presence_validation_enabled"].default is False
    settings = _settings(monkeypatch)
    assert settings.presence_validation_enabled is False
    assert settings.presence_token_pepper == ""


def test_env_example_declares_flag_false_and_no_pepper_value() -> None:
    lines = (BACKEND_ROOT / ".env.example").read_text(encoding="utf-8").splitlines()
    assert "PRESENCE_VALIDATION_ENABLED=false" in lines
    assert "PRESENCE_TOKEN_PEPPER=" in lines
    assert not any(
        line.startswith("PRESENCE_TOKEN_PEPPER=") and line != "PRESENCE_TOKEN_PEPPER="
        for line in lines
    )
    assert "PRESENCE_SESSION_USER_LIMIT_PER_HOUR=150" in lines
    assert "PRESENCE_SESSION_IP_LIMIT_PER_HOUR=600" in lines


@pytest.mark.parametrize("pepper", ["", "   ", "x" * (PRESENCE_TOKEN_PEPPER_MIN_LENGTH - 1)])
def test_enabled_flag_requires_a_long_pepper(
    clean_presence_env: None, monkeypatch: pytest.MonkeyPatch, pepper: str
) -> None:
    with pytest.raises(ValidationError, match="PRESENCE_TOKEN_PEPPER must be at least"):
        _settings(monkeypatch, PRESENCE_VALIDATION_ENABLED="true", PRESENCE_TOKEN_PEPPER=pepper)


def test_enabled_flag_refuses_a_pepper_shared_with_jwt(
    clean_presence_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    with pytest.raises(ValidationError, match="must differ"):
        _settings(monkeypatch, PRESENCE_VALIDATION_ENABLED="true", PRESENCE_TOKEN_PEPPER=_TEST_JWT)


def test_enabled_flag_refuses_a_pepper_shared_with_refresh_pepper(
    clean_presence_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    with pytest.raises(ValidationError, match="must differ"):
        _settings(
            monkeypatch,
            PRESENCE_VALIDATION_ENABLED="true",
            PRESENCE_TOKEN_PEPPER=_TEST_PEPPER,
            REFRESH_TOKEN_PEPPER=_TEST_PEPPER,
        )


def test_enabled_flag_with_dedicated_pepper_is_valid(
    clean_presence_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    settings = _settings(
        monkeypatch, PRESENCE_VALIDATION_ENABLED="true", PRESENCE_TOKEN_PEPPER=_TEST_PEPPER
    )
    assert settings.presence_validation_enabled is True


@pytest.mark.parametrize("redis_url", [None, "", "   "])
def test_enabled_flag_requires_redis(
    clean_presence_env: None, monkeypatch: pytest.MonkeyPatch, redis_url: str | None
) -> None:
    """D2 of 01B: without Redis, rate limiting would silently be a no-op."""
    if redis_url is None:
        monkeypatch.delenv("REDIS_URL", raising=False)
    else:
        monkeypatch.setenv("REDIS_URL", redis_url)
    with pytest.raises(ValidationError, match="REDIS_URL is required"):
        _settings(
            monkeypatch, PRESENCE_VALIDATION_ENABLED="true", PRESENCE_TOKEN_PEPPER=_TEST_PEPPER
        )


def test_disabled_flag_needs_no_redis(
    clean_presence_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("REDIS_URL", raising=False)
    settings = _settings(monkeypatch, PRESENCE_VALIDATION_ENABLED="false")
    assert settings.presence_validation_enabled is False


def test_session_rate_limits_have_the_prd_defaults(
    clean_presence_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    for name in ("PRESENCE_SESSION_USER_LIMIT_PER_HOUR", "PRESENCE_SESSION_IP_LIMIT_PER_HOUR"):
        monkeypatch.delenv(name, raising=False)
    settings = _settings(monkeypatch)
    assert settings.presence_session_user_limit_per_hour == 150
    assert settings.presence_session_ip_limit_per_hour == 600


def test_disabled_flag_needs_no_pepper(
    clean_presence_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    settings = _settings(monkeypatch, PRESENCE_VALIDATION_ENABLED="false")
    assert settings.presence_validation_enabled is False


def _presence_paths() -> set[str]:
    application = create_app()
    return {
        route.path
        for route in application.routes
        if isinstance(route, APIRoute)
        and (route.path.startswith(_PRESENCE_PREFIX) or route.path == _SESSION_PATH)
    }


def test_routes_are_not_mounted_when_flag_is_off(clean_presence_env: None) -> None:
    assert _presence_paths() == set()


def test_routes_are_mounted_when_flag_is_on(
    clean_presence_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("PRESENCE_VALIDATION_ENABLED", "true")
    monkeypatch.setenv("PRESENCE_TOKEN_PEPPER", _TEST_PEPPER)
    get_settings.cache_clear()
    assert _presence_paths() == {
        f"{_PRESENCE_PREFIX}/campaigns",
        f"{_PRESENCE_PREFIX}/campaigns/{{campaign_id}}/status",
        f"{_PRESENCE_PREFIX}/campaigns/{{campaign_id}}/registrations/{{user_id}}",
        f"{_PRESENCE_PREFIX}/campaigns/{{campaign_id}}/agents/{{user_id}}",
        f"{_PRESENCE_PREFIX}/users/{{user_id}}/test-flag",
        _SESSION_PATH,
    }


def test_campaign_transitions_match_the_adr() -> None:
    assert set(PRESENCE_CAMPAIGN_TRANSITIONS) == PRESENCE_CAMPAIGN_STATUSES
    assert PRESENCE_CAMPAIGN_TRANSITIONS == {
        "draft": frozenset({"open", "archived"}),
        "open": frozenset({"closed"}),
        "closed": frozenset({"archived"}),
        "archived": frozenset(),
    }
