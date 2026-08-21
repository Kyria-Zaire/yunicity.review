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

# Prefixe reserve aux bases de tests backend JETABLES (C3.1-R1G). `yunicity_qa`
# appartient a Playwright et a la revue manuelle : pytest ne doit jamais la viser.
PYTEST_DB_NAME_PREFIX = "yunicity_test_"

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


def _require_run_marker(env: Mapping[str, str]) -> None:
    """Marqueur de run explicite (genere par le launcher ou la compose QA)."""
    if env.get(QA_MODE_ENV, "").strip() != "1":
        raise QaGuardError("QA_MODE_ABSENT")
    if not env.get(QA_TOKEN_ENV, "").strip():
        raise QaGuardError("QA_RUN_TOKEN_ABSENT")


def _parse_target(env: Mapping[str, str]) -> tuple[str, int, str]:
    """Autorite unique : TEST_DATABASE_URL. Aucun repli sur DATABASE_URL."""
    raw_url = env.get(TEST_DB_ENV, "").strip()
    if not raw_url:
        raise QaGuardError("TEST_DATABASE_URL_ABSENT")

    _reject_if_railway_env(env)

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
    return host, port, dbname


def _reject_unsafe_location(host: str, port: int) -> None:
    """Port de dev, hotes manages/distants, puis allowlist finale hote+port."""
    if port == _DEV_DB_PORT:
        raise QaGuardError("DEV_PORT_5434")
    for substring in _FORBIDDEN_HOST_SUBSTRINGS:
        if substring in host:
            raise QaGuardError(f"HOST_FORBIDDEN:{substring}")
    if (host, port) not in _ALLOWED_HOST_PORTS:
        raise QaGuardError(f"HOST_PORT_NOT_ALLOWED:{host}:{port}")


def evaluate_pytest_database_target(env: Mapping[str, str]) -> QaTarget:
    """Valide la base JETABLE des tests backend (C3.1-R1G).

    Frere de :func:`evaluate_qa_database_target`, et non un assouplissement : les
    memes exigences de marqueur, d'hote et de port s'appliquent, mais le nom doit
    porter le prefixe reserve ``yunicity_test_`` suivi d'un suffixe non vide.
    ``yunicity_qa`` est refuse explicitement — c'est tout l'objet du decouplage :
    la suite pytest ne doit plus detruire la baseline de revue.

    Pur : lit un mapping d'environnement, n'ouvre ni socket ni connexion.
    """
    _require_run_marker(env)
    host, port, dbname = _parse_target(env)

    if dbname in _FORBIDDEN_DB_NAMES:
        raise QaGuardError(f"DBNAME_FORBIDDEN:{dbname}")
    has_prefix = dbname.startswith(PYTEST_DB_NAME_PREFIX)
    suffix = dbname[len(PYTEST_DB_NAME_PREFIX) :] if has_prefix else ""
    if dbname == QA_DB_NAME or not suffix:
        raise QaGuardError(f"DBNAME_NOT_DISPOSABLE_TEST:{dbname or '<empty>'}")

    _reject_unsafe_location(host, port)
    return QaTarget(host=host, port=port, dbname=dbname)


def evaluate_qa_database_target(env: Mapping[str, str]) -> QaTarget:
    """Validate the destructive **database target** only (marker + TEST_DATABASE_URL triplet).

    This is what per-test destructive fixtures need: it guarantees the only reachable
    destructive database is ``yunicity_qa`` on an authorized host/port. It intentionally
    does NOT enforce external-provider hermeticity — a test may set mocked provider env
    (e.g. an R2 key) without that making a DB drop against ``yunicity_qa`` any less safe.

    Pure: takes an explicit env mapping, opens no network/DB connection.
    """
    _require_run_marker(env)
    host, port, dbname = _parse_target(env)

    # Database name must be exactly yunicity_qa.
    if dbname in _FORBIDDEN_DB_NAMES:
        raise QaGuardError(f"DBNAME_FORBIDDEN:{dbname}")
    if dbname != QA_DB_NAME:
        raise QaGuardError(f"DBNAME_NOT_QA:{dbname or '<empty>'}")

    _reject_unsafe_location(host, port)
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


def ensure_pytest_database_target() -> QaTarget:
    """Garde de la base jetable des tests backend, lisant l'environnement du process."""
    return evaluate_pytest_database_target(os.environ)


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


# --- QA Redis target (rate-limit reset) -----------------------------------------------

REDIS_URL_ENV = "REDIS_URL"

# (host, port) allowed for the QA Redis. Dev Redis is localhost:6379 — explicitly refused.
_ALLOWED_REDIS_HOST_PORTS: frozenset[tuple[str, int]] = frozenset(
    {
        ("localhost", 6399),
        ("127.0.0.1", 6399),
        ("redis-qa", 6379),
    }
)
_DEV_REDIS_PORT = 6379


@dataclass(frozen=True)
class QaRedisTarget:
    host: str
    port: int

    def confirmation(self) -> str:
        return f"QA redis OK -> host={self.host} port={self.port}"


def evaluate_qa_redis_target(env: Mapping[str, str]) -> QaRedisTarget:
    """Validate the QA Redis target (for a guarded rate-limit reset). Fail-closed, no I/O.

    Refuses dev Redis (localhost:6379), any remote host, and a missing QA marker. It never
    disables the rate limiter — it only authorizes flushing the disposable QA counters.
    """
    from urllib.parse import urlparse

    if env.get(QA_MODE_ENV, "").strip() != "1":
        raise QaGuardError("QA_MODE_ABSENT")
    if not env.get(QA_TOKEN_ENV, "").strip():
        raise QaGuardError("QA_RUN_TOKEN_ABSENT")
    raw = env.get(REDIS_URL_ENV, "").strip()
    if not raw:
        raise QaGuardError("REDIS_URL_ABSENT")
    _reject_if_railway_env(env)

    parsed = urlparse(raw)
    host = (parsed.hostname or "").strip().lower()
    port = parsed.port
    if not host:
        raise QaGuardError("REDIS_HOST_MISSING")
    if port is None:
        raise QaGuardError("REDIS_PORT_MISSING")
    for substring in _FORBIDDEN_HOST_SUBSTRINGS:
        if substring in host:
            raise QaGuardError(f"REDIS_HOST_FORBIDDEN:{substring}")
    if host in ("localhost", "127.0.0.1") and port == _DEV_REDIS_PORT:
        raise QaGuardError("DEV_REDIS_PORT_6379")
    if (host, port) not in _ALLOWED_REDIS_HOST_PORTS:
        raise QaGuardError(f"REDIS_HOST_PORT_NOT_ALLOWED:{host}:{port}")
    return QaRedisTarget(host=host, port=port)


def ensure_qa_redis_target() -> QaRedisTarget:
    """Guard entry point for the QA Redis rate-limit reset, reading the process env."""
    return evaluate_qa_redis_target(os.environ)
