"""PASSPORT-PRESENCE-01 (01A, 01B) — fail-closed flag, dedicated pepper and mandatory
Redis (D2 of 01B), without database."""

from __future__ import annotations

import hashlib
import hmac
from collections.abc import Iterator
from pathlib import Path

import pytest
from app.api.v1.presence_participant import presence_ip_rate_limit_identity
from app.core.config import Settings, get_settings
from app.core.presence_constants import (
    PRESENCE_CAMPAIGN_STATUSES,
    PRESENCE_CAMPAIGN_TRANSITIONS,
    PRESENCE_RATE_LIMIT_KEY_PEPPER_MIN_LENGTH,
    PRESENCE_TOKEN_PEPPER_MIN_LENGTH,
)
from app.core.rate_limit import rate_limit_identity
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
#: Test-only value, not a secret: >= 32 characters, distinct from every other test secret.
_TEST_RATE_LIMIT_PEPPER = "test-only-rate-limit-pepper-not-a-secret-01"


@pytest.fixture
def clean_presence_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    for name in ("PRESENCE_VALIDATION_ENABLED", "PRESENCE_TOKEN_PEPPER"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("JWT_SECRET_KEY", _TEST_JWT)
    # Explicit: flag-on tests must not depend on an ambient REDIS_URL (D2 of 01B).
    monkeypatch.setenv("REDIS_URL", _TEST_REDIS_URL)
    # Explicit too: P3-1 of 01B requires a dedicated rate-limit pepper when the flag is on.
    monkeypatch.setenv("RATE_LIMIT_KEY_PEPPER", _TEST_RATE_LIMIT_PEPPER)
    monkeypatch.delenv("REFRESH_TOKEN_PEPPER", raising=False)
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


@pytest.mark.parametrize(
    "rate_limit_pepper",
    [None, "", "   ", "r" * (PRESENCE_RATE_LIMIT_KEY_PEPPER_MIN_LENGTH - 1)],
)
def test_enabled_flag_requires_a_long_rate_limit_pepper(
    clean_presence_env: None, monkeypatch: pytest.MonkeyPatch, rate_limit_pepper: str | None
) -> None:
    if rate_limit_pepper is None:
        monkeypatch.delenv("RATE_LIMIT_KEY_PEPPER", raising=False)
    else:
        monkeypatch.setenv("RATE_LIMIT_KEY_PEPPER", rate_limit_pepper)
    with pytest.raises(ValidationError, match="RATE_LIMIT_KEY_PEPPER must be at least"):
        _settings(
            monkeypatch, PRESENCE_VALIDATION_ENABLED="true", PRESENCE_TOKEN_PEPPER=_TEST_PEPPER
        )


@pytest.mark.parametrize("shared_with", ["PRESENCE_TOKEN_PEPPER", "JWT", "REFRESH_TOKEN_PEPPER"])
def test_enabled_flag_refuses_a_shared_rate_limit_pepper(
    clean_presence_env: None, monkeypatch: pytest.MonkeyPatch, shared_with: str
) -> None:
    shared = {
        "PRESENCE_TOKEN_PEPPER": _TEST_PEPPER,
        "JWT": _TEST_JWT,
        "REFRESH_TOKEN_PEPPER": "test-only-refresh-pepper-not-a-secret-0001",
    }[shared_with]
    env = {"PRESENCE_VALIDATION_ENABLED": "true", "PRESENCE_TOKEN_PEPPER": _TEST_PEPPER}
    if shared_with == "REFRESH_TOKEN_PEPPER":
        env["REFRESH_TOKEN_PEPPER"] = shared
    env["RATE_LIMIT_KEY_PEPPER"] = f"  {shared}  "
    with pytest.raises(ValidationError, match="RATE_LIMIT_KEY_PEPPER must differ") as excinfo:
        _settings(monkeypatch, **env)
    # Configuration errors never echo a secret value.
    assert shared not in str(excinfo.value)


def test_disabled_flag_needs_no_rate_limit_pepper(
    clean_presence_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("RATE_LIMIT_KEY_PEPPER", raising=False)
    settings = _settings(monkeypatch, PRESENCE_VALIDATION_ENABLED="false")
    assert settings.presence_validation_enabled is False


def test_ip_identity_known_answer_and_domain_separation(
    clean_presence_env: None,
) -> None:
    ip = "203.0.113.77"
    expected = hmac.new(
        _TEST_RATE_LIMIT_PEPPER.encode(), f"presence-ip:{ip}".encode(), hashlib.sha256
    ).hexdigest()[:32]
    identity = presence_ip_rate_limit_identity(ip)
    assert identity == expected
    # Same pepper, no domain: the generic identity (e-mails, other routes) differs.
    assert identity != rate_limit_identity(ip)
    assert identity != presence_ip_rate_limit_identity("203.0.113.78")
    assert ip not in identity


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
