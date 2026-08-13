"""Anti-production guard for the disposable QA stack (C3-F0-T1).

Every destructive or seed operation against the QA database MUST pass through
:func:`ensure_qa_destructive_target` (or the pure :func:`evaluate_qa_guard`).

Design contract:
- **fail-closed**: any missing, ambiguous or partial condition raises.
- **``TEST_DATABASE_URL`` is the sole authority** for destructive targets — there
  is deliberately no fallback to ``DATABASE_URL``.
- **no I/O**: the guard only parses env + URL and decides. It never opens a
  socket or a DB connection, so negative decisions cannot touch a forbidden
  target. This is what makes the negative unit tests network-free.
- **never prints credentials**: the confirmation string exposes host/port/db only.

Allowed triplets (host, port) with dbname == ``yunicity_qa`` exclusively:
- ``localhost`` / ``127.0.0.1`` : 5455
- ``postgres-qa`` : 5432
"""

from __future__ import annotations

import os
from collections.abc import Mapping
from dataclasses import dataclass

from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError

QA_DB_NAME = "yunicity_qa"

QA_MODE_ENV = "YUNICITY_QA_MODE"
QA_TOKEN_ENV = "YUNICITY_QA_RUN_TOKEN"
TEST_DB_ENV = "TEST_DATABASE_URL"

# (host, port) explicitly allowed; dbname is checked separately and must equal QA_DB_NAME.
_ALLOWED_HOST_PORTS: frozenset[tuple[str, int]] = frozenset(
    {
        ("localhost", 5455),
        ("127.0.0.1", 5455),
        ("postgres-qa", 5432),
    }
)

# Names explicitly refused with a dedicated reason (defense-in-depth over the allowlist).
_FORBIDDEN_DB_NAMES: frozenset[str] = frozenset(
    {
        "yunicity_dev",
        "yunicity_test",
        "yunicity_recette",
        "yunicity_preprod",
        "yunicity_prod",
        "postgres",
    }
)

# Substrings that betray a managed/remote host — never a local QA container.
_FORBIDDEN_HOST_SUBSTRINGS: tuple[str, ...] = (
    "railway",
    "rlwy",
    "proxy",
    "neon",
    "supabase",
    "amazonaws",
    "rds.",
    "staging",
    "prod",
)

# Dev database port — must never be a destructive target.
_DEV_DB_PORT = 5434

# External-effect env: any active value here means the stack is not hermetic.
_EXTERNAL_KEY_ENVS: tuple[str, ...] = (
    "STRIPE_SECRET_KEY",
    "RESEND_API_KEY",
    "LOCAL_VIDEO_R2_ACCESS_KEY_ID",
    "LOCAL_VIDEO_R2_SECRET_ACCESS_KEY",
    "LOCAL_VIDEO_R2_ENDPOINT",
    "LOCAL_VIDEO_R2_BUCKET",
    "SENTRY_DSN",
    "OPENWEATHER_API_KEY",
    "GRAND_REIMS_GTFS_URL",
    "GRAND_REIMS_GTFS_RT_URL",
    "EXPO_ACCESS_TOKEN",
)

_TRUTHY = frozenset({"1", "true", "yes", "on"})


class QaGuardError(RuntimeError):
    """Raised when a target fails the anti-production guard. Message is a stable reason code."""


@dataclass(frozen=True)
class QaTarget:
    """A validated, destroyable QA target. Contains no credentials."""

    host: str
    port: int
    dbname: str

    def confirmation(self) -> str:
        """Non-sensitive confirmation line for logs (no user/password)."""
        return f"QA target OK -> host={self.host} port={self.port} db={self.dbname}"


def _reject_if_railway_env(env: Mapping[str, str]) -> None:
    for key in env:
        if key.upper().startswith("RAILWAY"):
            raise QaGuardError(f"RAILWAY_ENV_PRESENT:{key}")


def _reject_active_external_providers(env: Mapping[str, str]) -> None:
    email_provider = env.get("EMAIL_PROVIDER", "none").strip().lower()
    if email_provider not in ("none", "console"):
        raise QaGuardError(f"EMAIL_PROVIDER_EXTERNAL:{email_provider}")

    if env.get("EXPO_PUSH_ENABLED", "false").strip().lower() in _TRUTHY:
        raise QaGuardError("PUSH_ENABLED")

    storage = env.get("LOCAL_VIDEO_STORAGE_BACKEND", "filesystem").strip().lower()
    if storage != "filesystem":
        raise QaGuardError(f"STORAGE_NOT_FILESYSTEM:{storage}")

    for key in _EXTERNAL_KEY_ENVS:
        value = env.get(key)
        if value is not None and value.strip():
            raise QaGuardError(f"EXTERNAL_KEY_PRESENT:{key}")


def evaluate_qa_database_target(env: Mapping[str, str]) -> QaTarget:
    """Validate the destructive **database target** only (marker + TEST_DATABASE_URL triplet).

    This is what per-test destructive fixtures need: it guarantees the only reachable
    destructive database is ``yunicity_qa`` on an authorized host/port. It intentionally
    does NOT enforce external-provider hermeticity — a test may set mocked provider env
    (e.g. an R2 key) without that making a DB drop against ``yunicity_qa`` any less safe.

    Pure: takes an explicit env mapping, opens no network/DB connection.
    """
    # 1. Explicit QA run marker (generated/transmitted by the launcher or QA compose).
    if env.get(QA_MODE_ENV, "").strip() != "1":
        raise QaGuardError("QA_MODE_ABSENT")
    if not env.get(QA_TOKEN_ENV, "").strip():
        raise QaGuardError("QA_RUN_TOKEN_ABSENT")

    # 2. Sole authority: TEST_DATABASE_URL. No fallback to DATABASE_URL.
    raw_url = env.get(TEST_DB_ENV, "").strip()
    if not raw_url:
        raise QaGuardError("TEST_DATABASE_URL_ABSENT")

    # 3. No managed-platform env alongside a destructive op.
    _reject_if_railway_env(env)

    # 4. Parse with a reliable parser.
    try:
        url = make_url(raw_url)
    except ArgumentError as exc:
        raise QaGuardError("TEST_DATABASE_URL_UNPARSEABLE") from exc

    host = (url.host or "").strip().lower()
    port = url.port
    dbname = (url.database or "").strip()

    if not host:
        raise QaGuardError("HOST_MISSING")
    if port is None:
        raise QaGuardError("PORT_MISSING")

    # 5. Database name must be exactly yunicity_qa.
    if dbname in _FORBIDDEN_DB_NAMES:
        raise QaGuardError(f"DBNAME_FORBIDDEN:{dbname}")
    if dbname != QA_DB_NAME:
        raise QaGuardError(f"DBNAME_NOT_QA:{dbname or '<empty>'}")

    # 6. Reject dev port explicitly (clearer than the allowlist miss).
    if port == _DEV_DB_PORT:
        raise QaGuardError("DEV_PORT_5434")

    # 7. Reject managed/remote hosts explicitly.
    for substring in _FORBIDDEN_HOST_SUBSTRINGS:
        if substring in host:
            raise QaGuardError(f"HOST_FORBIDDEN:{substring}")

    # 8. Final allowlist — host+port pair must be one of the sanctioned triplets.
    if (host, port) not in _ALLOWED_HOST_PORTS:
        raise QaGuardError(f"HOST_PORT_NOT_ALLOWED:{host}:{port}")

    return QaTarget(host=host, port=port, dbname=dbname)


def evaluate_qa_guard(env: Mapping[str, str]) -> QaTarget:
    """Full QA guard: database target **plus** external-provider hermeticity.

    Used by QA-stack tooling (reset/seed/launcher) that actually runs side-effecting
    work and must therefore be hermetic. Per-test DB fixtures use the lighter
    :func:`evaluate_qa_database_target` instead.
    """
    target = evaluate_qa_database_target(env)
    _reject_active_external_providers(env)
    return target


def ensure_qa_database_target() -> QaTarget:
    """DB-target guard reading the process env — for destructive test fixtures/sessionstart."""
    return evaluate_qa_database_target(os.environ)


def ensure_qa_destructive_target() -> QaTarget:
    """Full guard (DB target + hermeticity) reading the process env — for reset/seed/launcher.

    Call this *inside* each destructive stack function (reset/seed), not only in the
    launcher, so an accidental import path can never bypass it.
    """
    return evaluate_qa_guard(os.environ)


def resolve_test_database_url() -> str:
    """Return the validated TEST_DATABASE_URL after the guard has approved it."""
    ensure_qa_destructive_target()
    return os.environ[TEST_DB_ENV].strip()
