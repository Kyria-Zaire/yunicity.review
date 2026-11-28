"""Aucune valeur citée par une erreur SQL dans les sorties (APP-SQL-ERROR-VALUES-01).

Postgres (``DETAIL``, ``invalid input syntax``) et asyncpg (``invalid input for query
argument``, valeur tronquée) citent la valeur fautive. Chaque test passe une valeur
FICTIVE, provoque une vraie erreur quand une base jetable est disponible, puis cherche
le NOYAU aléatoire du marqueur — placé en tête, il survit à la troncature d'asyncpg —
dans chaque sortie : journaux (texte, JSON, uvicorn, arq), réponse HTTP, événements
Sentry finaux (capturés localement, aucun envoi réseau) et résultat arq dans Redis.

Chaque test vérifie AUSSI que le diagnostic reste : classe, SQLSTATE, contrainte.
"""

from __future__ import annotations

import asyncio
import io
import json
import logging
import os
import pickle
import signal
import uuid
from collections.abc import AsyncIterator, Iterator
from typing import Any

import httpx
import pytest
import sentry_sdk
import uvicorn
from app.core import observability
from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.logging import configure_logging
from app.core.observability import ContextFilter, JsonLogFormatter, init_sentry
from app.core.sql_error_redaction import (
    SanitizedSqlError,
    contains_sql_error,
    format_exception_safely,
    install_log_record_redaction,
    redact_sql_errors,
    safe_str,
)
from app.db.session import dispose_db, get_engine, init_db
from app.main import create_app
from arq.worker import Retry
from sentry_sdk.envelope import Envelope
from sentry_sdk.transport import Transport
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError, IntegrityError
from sqlalchemy.ext.asyncio import AsyncEngine

_CASES = ("unique", "conversion_serveur", "encodage_pilote")
_SQLSTATE = {"unique": "23505", "conversion_serveur": "22P02", "encodage_pilote": None}
_FAKE_DSN = "https://public@sentry.invalid/1"  # TLD réservé : ne résout jamais


def _marker(length: int = 23) -> str:
    """Noyau aléatoire EN TÊTE ; la longueur > 30 force la troncature d'asyncpg."""
    core = uuid.uuid4().hex[:16]
    return (core + "-FICTIF-" + "x" * length)[:length]


def _needle(marker: str) -> str:
    return marker[:16]


def _database_url() -> str | None:
    return os.environ.get("TEST_DATABASE_URL") or os.environ.get("DATABASE_URL")


def _settings(**update: Any) -> Settings:
    url = _database_url()
    if not url:
        pytest.skip("base de test non configuree")
    return get_settings().model_copy(update={"database_url": url, **update})


def _synthetic_integrity_error(marker: str) -> IntegrityError:
    """Forme d'une erreur 23505 SQLAlchemy, sans base : pour les tests unitaires."""
    orig = Exception(
        'duplicate key value violates unique constraint "probe_tok_key"\n'
        f"DETAIL:  Key (tok)=({marker}) already exists."
    )
    return IntegrityError("INSERT INTO probe (tok) VALUES ($1)", None, orig)


def _raised(exc: BaseException) -> BaseException:
    """Lève puis rattrape : l'exception porte une vraie trace."""
    try:
        raise exc
    except BaseException as caught:
        return caught


async def _trigger(engine: AsyncEngine, case: str, marker: str) -> DBAPIError:
    async with engine.connect() as conn:
        if case == "unique":
            await conn.execute(
                text("CREATE TEMPORARY TABLE probe (tok text CONSTRAINT probe_tok_key UNIQUE)")
            )
            await conn.execute(text("INSERT INTO probe VALUES (:v)"), {"v": marker})
            statement = text("INSERT INTO probe VALUES (:v)")
        elif case == "conversion_serveur":
            statement = text("SELECT CAST(CAST(:v AS text) AS uuid)")
        else:
            await conn.execute(text("CREATE TEMPORARY TABLE probe (n integer)"))
            statement = text("INSERT INTO probe VALUES (:v)")
        try:
            await conn.execute(statement, {"v": marker})
        except DBAPIError as exc:
            return exc
    raise AssertionError(f"{case} : aucune erreur SQL levée")


@pytest.fixture
async def moteur() -> AsyncIterator[AsyncEngine]:
    init_db(_settings())
    engine = get_engine()
    assert engine is not None
    try:
        yield engine
    finally:
        await dispose_db()


class _Capture(logging.Handler):
    def __init__(self) -> None:
        super().__init__(level=logging.NOTSET)
        self.records: list[logging.LogRecord] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.records.append(record)


class _CaptureTransport(Transport):
    """Reçoit les enveloppes finales (après before_send) ; n'envoie rien."""

    def __init__(self) -> None:
        super().__init__()
        self.envelopes: list[Envelope] = []

    def capture_envelope(self, envelope: Envelope) -> None:
        self.envelopes.append(envelope)

    def events(self) -> list[dict[str, Any]]:
        found: list[dict[str, Any]] = []
        for envelope in self.envelopes:
            for item in envelope.items:
                if item.type == "event" and item.payload.json is not None:
                    found.append(item.payload.json)
        return found

    def raw(self) -> str:
        return "".join(
            item.get_bytes().decode("utf-8", "replace")
            for envelope in self.envelopes
            for item in envelope.items
        )


_REAL_SENTRY_INIT = sentry_sdk.init


def _local_sentry(monkeypatch: pytest.MonkeyPatch) -> _CaptureTransport:
    """`init_sentry` (code de prod) reçoit un transport local DÈS l'initialisation :
    aucun transport HTTP n'est jamais créé, donc aucune connexion, pas même DNS."""
    transport = _CaptureTransport()

    def init_with_local_transport(*args: Any, **kwargs: Any) -> Any:
        kwargs["transport"] = transport
        return _REAL_SENTRY_INIT(*args, **kwargs)

    monkeypatch.setattr(sentry_sdk, "init", init_with_local_transport)
    return transport


def _reset_sentry() -> None:
    # `dsn=""` explicite : sans argument, le SDK relirait SENTRY_DSN dans l'environnement
    # (posé par `serveur`) et recréerait un transport HTTP.
    _REAL_SENTRY_INIT(dsn="")
    assert sentry_sdk.get_client().transport is None
    observability._sentry_enabled = False


@pytest.fixture
def sentry_local(monkeypatch: pytest.MonkeyPatch) -> Iterator[_CaptureTransport]:
    transport = _local_sentry(monkeypatch)
    settings = get_settings().model_copy(
        update={"sentry_dsn": _FAKE_DSN, "sentry_traces_sample_rate": 0.0}
    )
    assert init_sentry(settings)
    assert sentry_sdk.get_client().transport is transport
    try:
        yield transport
    finally:
        _reset_sentry()


def _assert_diagnostic(text_out: str, case: str) -> None:
    assert "message SQL masqué" in text_out
    if _SQLSTATE[case]:
        assert f"sqlstate={_SQLSTATE[case]}" in text_out
    if case == "unique":
        assert "constraint_name=probe_tok_key" in text_out


# --------------------------------------------------------------------------- #
# Unitaires : trace, chaînes, groupes, arguments, texte SQL recopié
# --------------------------------------------------------------------------- #
def test_trace_masquee_garde_les_frames_et_la_classe() -> None:
    marker = _marker()
    exc = _raised(_synthetic_integrity_error(marker))
    formatted = format_exception_safely(exc)
    assert _needle(marker) not in formatted
    assert "Traceback (most recent call last)" in formatted
    assert "sqlalchemy.exc.IntegrityError: [message SQL masqué" in formatted
    assert "test_sql_error_redaction.py" in formatted  # la frame d'origine reste


def test_chaine_imbriquee_apperror_from_erreur_sql() -> None:
    marker = _marker()
    sql = _synthetic_integrity_error(marker)
    try:
        try:
            raise sql
        except IntegrityError as exc:
            raise AppError(409, "PROBE_CONFLICT", "Conflit.") from exc
    except AppError as wrapped:
        formatted = format_exception_safely(wrapped)
    assert _needle(marker) not in formatted
    assert "The above exception was the direct cause" in formatted
    assert "app.core.errors.AppError: Conflit." in formatted  # message non SQL conservé


def test_contexte_implicite_et_cause_profonde_masques() -> None:
    marker = _marker()
    deep = ValueError(f"invalid literal for int() with base 10: '{marker}'")
    sql = _synthetic_integrity_error("sans-valeur")
    sql.__cause__ = deep  # cause du pilote, sous l'erreur SQL
    try:
        try:
            raise sql
        except IntegrityError:
            # Contexte IMPLICITE voulu (`__context__`, sans `from`) : c'est la forme à couvrir.
            raise RuntimeError("rollback impossible")  # noqa: B904
    except RuntimeError as during:
        formatted = format_exception_safely(during)
    assert _needle(marker) not in formatted
    assert "During handling of the above exception" in formatted
    assert "cause d'une erreur SQL" in formatted
    assert "RuntimeError: rollback impossible" in formatted


def test_groupe_d_exceptions() -> None:
    marker = _marker()
    group = _raised(ExceptionGroup("lot", [_synthetic_integrity_error(marker), KeyError("k")]))
    formatted = format_exception_safely(group)
    assert _needle(marker) not in formatted
    assert "KeyError: 'k'" in formatted
    assert contains_sql_error(group)


def test_texte_sql_recopie_dans_une_exception_non_sql() -> None:
    marker = _marker()
    copied = RuntimeError(f"echec : {_synthetic_integrity_error(marker)}")
    assert _needle(marker) not in safe_str(copied)
    assert _needle(marker) not in format_exception_safely(_raised(copied))


def test_diagnostic_conserve_quand_sentry_efface_la_cause() -> None:
    """L'intégration ASGI de Sentry relève `from None` : `__cause__` disparaît, `orig` reste."""

    class _DriverError(Exception):
        sqlstate = "23505"
        constraint_name = "probe_tok_key"

    marker = _marker()
    exc = IntegrityError("INSERT INTO probe VALUES ($1)", None, _DriverError(f"DETAIL: ({marker})"))
    exc.__cause__ = None
    exc.__suppress_context__ = True
    formatted = format_exception_safely(_raised(exc))
    assert _needle(marker) not in formatted
    assert "sqlstate=23505" in formatted and "constraint_name=probe_tok_key" in formatted


def test_exception_non_sql_inchangee() -> None:
    exc = _raised(KeyError("cle-ordinaire"))
    assert not contains_sql_error(exc)
    assert safe_str(exc) == str(exc)


@pytest.mark.parametrize("formatter", ["texte", "json"])
@pytest.mark.parametrize("style", ["exc_info", "pourcent_s", "message_exception", "dict_args"])
def test_enregistrement_de_journal(formatter: str, style: str) -> None:
    install_log_record_redaction()
    marker = _marker()
    exc = _raised(_synthetic_integrity_error(marker))
    logger = logging.getLogger("app.test.redaction")
    stream = io.StringIO()
    handler = logging.StreamHandler(stream)
    handler.addFilter(ContextFilter())
    handler.setFormatter(
        JsonLogFormatter()
        if formatter == "json"
        else logging.Formatter("%(levelname)s [%(name)s] %(message)s")
    )
    logger.addHandler(handler)
    logger.propagate = False
    try:
        if style == "exc_info":
            logger.error("echec", exc_info=exc)
        elif style == "pourcent_s":
            logger.error("echec : %s (%r)", exc, exc)
        elif style == "message_exception":
            logger.error(exc)
        else:
            logger.error("echec : %(e)s", {"e": exc})
    finally:
        logger.removeHandler(handler)
        logger.propagate = True
    output = stream.getvalue()
    assert _needle(marker) not in output
    assert "message SQL masqué" in output
    if formatter == "json":
        json.loads(output)


# --------------------------------------------------------------------------- #
# Arq : nouvelle tentative, annulation, délai, sérialisation du résultat
# --------------------------------------------------------------------------- #
async def test_tache_arq_erreur_sql_resultat_serialise_sans_valeur() -> None:
    marker = _marker(40)

    @redact_sql_errors
    async def job(ctx: dict[str, Any]) -> None:
        raise _synthetic_integrity_error(marker)

    with pytest.raises(SanitizedSqlError) as caught:
        await job({})
    stored = pickle.dumps(caught.value)
    assert _needle(marker).encode() not in stored
    assert isinstance(caught.value.__cause__, IntegrityError)  # trace complète conservée
    assert job.__qualname__.endswith("job")  # arq nomme la tâche d'après __qualname__


@pytest.mark.parametrize(
    "exception",
    [Retry(defer=1), asyncio.CancelledError(), TimeoutError("delai"), AppError(409, "X", "y")],
    ids=["retry", "annulation", "delai", "apperror"],
)
async def test_tache_arq_exceptions_non_sql_inchangees(exception: BaseException) -> None:
    @redact_sql_errors
    async def job(ctx: dict[str, Any]) -> None:
        raise exception

    with pytest.raises(BaseException) as caught:
        await job({})
    assert caught.value is exception


async def test_tache_arq_signal_timeout_conserve() -> None:
    """`_failure_is_timeout` du worker vidéo lit « timeout » dans str(résultat)."""

    @redact_sql_errors
    async def job(ctx: dict[str, Any]) -> None:
        raise IntegrityError(
            "SELECT 1", None, Exception("canceling statement due to statement timeout")
        )

    with pytest.raises(SanitizedSqlError) as caught:
        await job({})
    assert "timeout" in str(caught.value).lower()


# --------------------------------------------------------------------------- #
# Sentry : événements FINAUX capturés localement
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize("voie", ["capture_exception", "journal_exc_info", "journal_pourcent_s"])
def test_sentry_evenement_final_sans_valeur(sentry_local: _CaptureTransport, voie: str) -> None:
    install_log_record_redaction()
    marker = _marker()
    sql = _synthetic_integrity_error(marker)
    try:
        try:
            raise sql
        except IntegrityError as exc:
            raise AppError(409, "PROBE_CONFLICT", "Conflit.") from exc
    except AppError as wrapped:
        if voie == "capture_exception":
            sentry_sdk.capture_exception(wrapped)
        elif voie == "journal_exc_info":
            logging.getLogger("app.test.sentry").error("echec", exc_info=wrapped)
        else:
            logging.getLogger("app.test.sentry").error("echec : %s", sql)
    sentry_sdk.flush(timeout=5)
    events = sentry_local.events()
    assert events, "aucun événement capturé : le test ne prouverait rien"
    assert _needle(marker) not in sentry_local.raw()
    assert '"vars"' not in sentry_local.raw()
    if voie != "journal_pourcent_s":
        values = events[-1]["exception"]["values"]
        assert any("message SQL masqué" in v["value"] for v in values)
        assert any(v["value"] == "Conflit." for v in values)


# --------------------------------------------------------------------------- #
# Vraies erreurs Postgres / asyncpg (base jetable)
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize("length", [23, 48], ids=["court", "tronque"])
@pytest.mark.parametrize("case", _CASES)
async def test_vraie_erreur_sql_journaux_texte_et_json(
    moteur: AsyncEngine, case: str, length: int
) -> None:
    marker = _marker(length)
    exc = await _trigger(moteur, case, marker)
    assert _needle(marker) in str(exc), (
        "l'erreur brute doit citer la valeur, sinon rien n'est prouvé"
    )
    settings = _settings(debug=True)
    configure_logging(settings)
    text_formatter = logging.getLogger().handlers[0].formatter
    assert text_formatter is not None
    try:
        try:
            raise exc
        except DBAPIError as raised:
            raise AppError(409, "PROBE_CONFLICT", "Conflit.") from raised
    except AppError as wrapped:
        record = logging.getLogger("app.test.sql").makeRecord(
            "app.test.sql",
            logging.ERROR,
            __file__,
            0,
            "echec %s",
            (exc,),
            (type(wrapped), wrapped, wrapped.__traceback__),
        )
    ContextFilter().filter(record)
    for formatter in (text_formatter, JsonLogFormatter()):
        output = formatter.format(record)
        assert _needle(marker) not in output
        _assert_diagnostic(output, case)


@pytest.fixture(params=[True, False], ids=["debug_true", "debug_false"])
async def serveur(
    request: pytest.FixtureRequest, monkeypatch: pytest.MonkeyPatch
) -> AsyncIterator[tuple[str, _CaptureTransport, _Capture]]:
    """Vrai uvicorn (config de journaux de la CLI), vrai lifespan, Sentry local."""
    url = _database_url()
    if not url:
        pytest.skip("base de test non configuree")
    monkeypatch.setenv("DEBUG", "true" if request.param else "false")
    monkeypatch.setenv("SENTRY_DSN", _FAKE_DSN)
    monkeypatch.setenv("SENTRY_TRACES_SAMPLE_RATE", "0")
    get_settings.cache_clear()
    transport = _local_sentry(monkeypatch)  # avant le lifespan, qui appelle init_sentry
    root = logging.getLogger()
    saved_root = (list(root.handlers), root.level)
    uvicorn_loggers = [logging.getLogger(n) for n in ("uvicorn", "uvicorn.error", "uvicorn.access")]
    saved_uvicorn = [(lg, list(lg.handlers), lg.level, lg.propagate) for lg in uvicorn_loggers]
    app = create_app()

    async def probe(case: str, probe_id: str) -> None:
        engine = get_engine()
        assert engine is not None
        raise await _trigger(engine, case, _PENDING.pop(probe_id))

    app.add_api_route("/__probe/{case}/{probe_id}", probe, methods=["POST"])
    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=0, lifespan="on"))
    task = asyncio.create_task(server.serve())
    for _ in range(200):
        if server.started:
            break
        await asyncio.sleep(0.05)
    assert server.started, "uvicorn n'a pas démarré"
    assert sentry_sdk.get_client().transport is transport
    capture = _Capture()
    logging.getLogger("uvicorn.error").addHandler(capture)
    port = server.servers[0].sockets[0].getsockname()[1]
    try:
        yield f"http://127.0.0.1:{port}", transport, capture
    finally:
        server.should_exit = True
        await task
        _reset_sentry()
        for lg, handlers, level, propagate in saved_uvicorn:
            lg.handlers[:] = handlers
            lg.setLevel(level)
            lg.propagate = propagate
        root.handlers[:] = saved_root[0]
        root.setLevel(saved_root[1])
        get_settings.cache_clear()


_PENDING: dict[str, str] = {}


@pytest.mark.parametrize("case", _CASES)
async def test_requete_erreur_non_geree_uvicorn_reponse_sentry(
    serveur: tuple[str, _CaptureTransport, _Capture], case: str
) -> None:
    base, transport, capture = serveur
    marker = _marker(48)
    probe_id = uuid.uuid4().hex
    _PENDING[probe_id] = marker
    async with httpx.AsyncClient(base_url=base, timeout=20) as client:
        response = await client.post(f"/__probe/{case}/{probe_id}")
    for _ in range(40):  # uvicorn journalise après l'envoi de la réponse
        if capture.records:
            break
        await asyncio.sleep(0.05)
    sentry_sdk.flush(timeout=5)

    # C5 : jamais de trace dans la réponse, même DEBUG=true.
    assert response.status_code == 500
    assert _needle(marker) not in response.text
    assert "Traceback" not in response.text

    # C4 : « Exception in ASGI application », formaté par le formateur d'uvicorn lui-même.
    assert capture.records, "uvicorn n'a rien journalisé : le test ne prouverait rien"
    uvicorn_handler = logging.getLogger("uvicorn").handlers[0]
    assert uvicorn_handler.formatter is not None
    output = "\n".join(uvicorn_handler.formatter.format(r) for r in capture.records)
    assert "Exception in ASGI application" in output
    assert _needle(marker) not in output
    _assert_diagnostic(output, case)

    # C6 : événement final sans valeur ni variables locales, diagnostic conservé.
    assert transport.events(), "aucun événement Sentry : le test ne prouverait rien"
    assert _needle(marker) not in transport.raw()
    assert '"vars"' not in transport.raw()
    _assert_diagnostic(json.dumps(transport.events(), ensure_ascii=False), case)


@pytest.mark.parametrize("case", _CASES)
async def test_worker_arq_journal_et_resultat_redis(
    case: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    from arq import create_pool
    from arq.connections import RedisSettings
    from arq.jobs import Job
    from arq.worker import Worker, func

    settings = _settings()
    if not settings.redis_url:
        pytest.skip("redis de test non configure")
    # Hors POSIX seulement : `Worker.close()` référence SIGUSR1.
    monkeypatch.setattr(signal, "SIGUSR1", signal.SIGTERM, raising=False)
    install_log_record_redaction()
    init_db(settings)
    marker = _marker(48)
    attempts: list[int] = []

    @redact_sql_errors
    async def probe_job(ctx: dict[str, Any], case_name: str) -> None:
        attempts.append(int(ctx["job_try"]))
        if len(attempts) == 1:
            raise Retry(defer=0)  # la nouvelle tentative doit rester possible
        engine = get_engine()
        assert engine is not None
        raise await _trigger(engine, case_name, marker)

    capture = _Capture()
    logging.getLogger("arq").addHandler(capture)
    queue = f"probe-{uuid.uuid4().hex[:8]}"
    redis = RedisSettings.from_dsn(settings.redis_url)
    pool = await create_pool(redis)
    worker = Worker(
        functions=[func(probe_job, name="probe_job", max_tries=3)],
        redis_settings=redis,
        burst=True,
        queue_name=queue,
        handle_signals=False,
        keep_result=60,
        poll_delay=0.05,
    )
    try:
        job = await pool.enqueue_job("probe_job", case, _queue_name=queue)
        assert job is not None
        await worker.main()
        raw = await pool.get(f"arq:result:{job.job_id}")
        info = await Job(job.job_id, pool, _queue_name=queue).result_info()
    finally:
        await worker.close()
        await pool.aclose()
        await dispose_db()
        logging.getLogger("arq").removeHandler(capture)

    assert attempts == [1, 2], "Retry doit déclencher une seconde tentative"
    assert worker.jobs_retried == 1 and worker.jobs_failed == 1
    assert raw, "aucun résultat stocké : le test ne prouverait rien"
    assert _needle(marker).encode() not in raw
    assert info is not None and isinstance(info.result, SanitizedSqlError)
    _assert_diagnostic(str(info.result), case)
    output = "\n".join(logging.Formatter().format(r) for r in capture.records)
    assert "probe_job failed" in output
    assert _needle(marker) not in output
