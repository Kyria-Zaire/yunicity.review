"""Aucune valeur SQL dans les sorties d'erreur (APP-SQL-ERROR-VALUES-01).

Postgres et asyncpg citent la valeur fautive dans le texte de leurs erreurs
(``DETAIL:  Key (tok)=(…)``, ``invalid input syntax for type uuid: "…"``,
``invalid input for query argument $1: '…'``), tronquée par asyncpg au-delà d'une
trentaine de caractères. ``hide_parameters`` ne couvre pas ces messages.

Le masquage est STRUCTUREL : le message d'une exception SQL — et celui de toute
exception qui en est la cause — n'est jamais recopié. On ne cherche pas la valeur,
ce qui couvre les valeurs tronquées. Restent la classe et les champs de diagnostic
que Postgres fournit sans valeur : SQLSTATE, contrainte, table, colonne, schéma, type.

Sorties couvertes :
- tout enregistrement de journal, via la fabrique d'enregistrements — donc tous les
  handlers (application, uvicorn, arq) : la trace (``exc_text``), les exceptions
  passées en argument ``%s`` et celles passées comme message ;
- les événements Sentry (``app.core.sentry_sql_scrubbing``) ;
- le résultat des tâches arq stocké dans Redis (``redact_sql_errors``).

L'objet exception n'est PAS modifié : son texte brut garde la valeur. Toute sortie qui
contourne ces points (``formatException`` appelé directement sur ``exc_info``,
``str(exc)`` interpolé par f-string) n'est pas couverte.
"""

from __future__ import annotations

import functools
import logging
import traceback
from collections.abc import Callable, Coroutine, Iterator, Mapping
from typing import Any

from sqlalchemy.exc import StatementError

#: Champs que Postgres renseigne SANS valeur de donnée : des identifiants et des codes.
_SAFE_FIELDS = (
    "sqlstate",
    "constraint_name",
    "table_name",
    "column_name",
    "schema_name",
    "data_type_name",
)
#: Texte d'erreur SQL recopié dans une exception NON SQL (``RuntimeError(f"{exc}")``).
_SQL_TEXT_SIGNS = (
    "DETAIL:",
    "sqlalche.me/e/",
    "invalid input for query argument",
    "invalid input syntax",
    "violates ",
)
_SQL_MODULE_PREFIXES = ("asyncpg.", "sqlalchemy.dialects.", "sqlalchemy.connectors.")
MASKED_SQL = "message SQL masqué"
_MASKED_CAUSE = "[message masqué : cause d'une erreur SQL]"
MASKED_TEXT = "[message masqué : texte d'erreur SQL détecté]"
_MASKED_FAILURE = "[journal masqué : échec du masquage SQL]"
_MAX_CHAIN = 32
_FACTORY_FLAG = "_yunicity_sql_error_redaction"
_CAUSE_SEPARATOR = "\nThe above exception was the direct cause of the following exception:\n\n"
_CONTEXT_SEPARATOR = "\nDuring handling of the above exception, another exception occurred:\n\n"


class SanitizedSqlError(Exception):
    """Erreur SQL réduite à sa description sûre : seule forme qui sort d'une tâche arq."""


# --------------------------------------------------------------------------- #
# Classification et description
# --------------------------------------------------------------------------- #
def is_sql_module(module: str | None) -> bool:
    if not module:
        return False
    return module == "asyncpg" or module.startswith(_SQL_MODULE_PREFIXES)


def is_sql_error(exc: BaseException) -> bool:
    """Exception dont le message peut citer une valeur : SQLAlchemy ou pilote asyncpg."""
    return isinstance(exc, StatementError) or is_sql_module(type(exc).__module__)


def looks_like_sql_text(text: str) -> bool:
    return any(sign in text for sign in _SQL_TEXT_SIGNS)


def _raw_str(exc: BaseException) -> str:
    try:
        return str(exc)
    except Exception:  # un __str__ défaillant ne doit pas casser la journalisation
        return f"<str() de {type(exc).__name__} a échoué>"


def _type_name(exc: BaseException) -> str:
    cls = type(exc)
    if cls.__module__ in ("builtins", "__main__"):
        return cls.__qualname__
    return f"{cls.__module__}.{cls.__qualname__}"


def chain_links(exc: BaseException, seen: set[int]) -> list[BaseException]:
    """La chaîne telle que Python l'imprime, de l'exception levée vers sa cause."""
    links: list[BaseException] = []
    current: BaseException | None = exc
    while current is not None and id(current) not in seen and len(links) < _MAX_CHAIN:
        seen.add(id(current))
        links.append(current)
        if current.__cause__ is not None:
            current = current.__cause__
        elif current.__suppress_context__:
            current = None
        else:
            current = current.__context__
    return links


def iter_linked(exc: BaseException, seen: set[int] | None = None) -> Iterator[BaseException]:
    """Toutes les exceptions liées : chaîne, contexte et sous-exceptions des groupes."""
    seen = set() if seen is None else seen
    for link in chain_links(exc, seen):
        yield link
        if isinstance(link, BaseExceptionGroup):
            for sub in link.exceptions:
                yield from iter_linked(sub, seen)


def contains_sql_error(exc: BaseException) -> bool:
    return any(
        is_sql_error(link) or looks_like_sql_text(_raw_str(link)) for link in iter_linked(exc)
    )


def _diagnostic_links(exc: BaseException) -> Iterator[BaseException]:
    """La chaîne, plus ``StatementError.orig`` : l'intégration ASGI de Sentry relève
    l'exception ``from None``, ce qui EFFACE sa ``__cause__`` ; ``orig`` reste."""
    for link in iter_linked(exc):
        yield link
        orig = getattr(link, "orig", None)
        if isinstance(link, StatementError) and isinstance(orig, BaseException):
            yield from iter_linked(orig)


def _safe_fields(exc: BaseException) -> dict[str, str]:
    """Champs sûrs du premier maillon qui les porte (l'erreur du pilote, sous l'enveloppe)."""
    found: dict[str, str] = {}
    for link in _diagnostic_links(exc):
        for name in _SAFE_FIELDS:
            value = getattr(link, name, None)
            if name not in found and isinstance(value, str) and value:
                found[name] = value
    return found


def describe_sql_error(exc: BaseException) -> str:
    """Description diagnostique sans valeur : ``[message SQL masqué; sqlstate=23505 …]``.

    ``timeout`` est signalé quand le texte d'origine le mentionne : le classement des
    échecs du worker vidéo s'appuie dessus. Seul ce booléen est dérivé du texte.
    """
    fields = _safe_fields(exc)
    parts = [MASKED_SQL, *(f"{name}={value}" for name, value in fields.items())]
    if any("timeout" in _raw_str(link).lower() for link in _diagnostic_links(exc)):
        parts.append("timeout")
    return "[" + "; ".join(parts) + "]"


def message_for(exc: BaseException, masked: bool) -> str:
    if masked:
        return describe_sql_error(exc) if is_sql_error(exc) else _MASKED_CAUSE
    text = _raw_str(exc)
    return MASKED_TEXT if looks_like_sql_text(text) else text


def safe_str(exc: BaseException) -> str:
    """Remplaçant sûr de ``str(exc)``."""
    return message_for(exc, is_sql_error(exc))


def masked_flags(exc: BaseException) -> dict[int, bool]:
    """Pour chaque exception liée : son message doit-il être masqué ?

    Sous une erreur SQL, toute cause l'est aussi : son message vient du même échec.
    """
    flags: dict[int, bool] = {}

    def visit(root: BaseException, inherited: bool, seen: set[int]) -> None:
        inside = inherited
        for link in chain_links(root, seen):
            inside = inside or is_sql_error(link)
            flags[id(link)] = inside
            if isinstance(link, BaseExceptionGroup):
                for sub in link.exceptions:
                    visit(sub, inside, seen)

    visit(exc, False, set())
    return flags


# --------------------------------------------------------------------------- #
# Trace masquée
# --------------------------------------------------------------------------- #
def _format(exc: BaseException, flags: dict[int, bool], seen: set[int]) -> list[str]:
    links = chain_links(exc, seen)
    lines: list[str] = []
    for index in range(len(links) - 1, -1, -1):  # la plus ancienne d'abord, comme Python
        link = links[index]
        masked = flags.get(id(link), True)  # inconnue : masquée par défaut
        if index < len(links) - 1:
            older = links[index + 1]
            lines.append(_CAUSE_SEPARATOR if link.__cause__ is older else _CONTEXT_SEPARATOR)
        if link.__traceback__ is not None:
            lines.append("Traceback (most recent call last):\n")
            lines.extend(traceback.format_tb(link.__traceback__))
        message = message_for(link, masked)
        lines.append(f"{_type_name(link)}: {message}\n" if message else f"{_type_name(link)}\n")
        if not masked:
            lines.extend(f"{note}\n" for note in getattr(link, "__notes__", ()))
        if isinstance(link, BaseExceptionGroup):
            for number, sub in enumerate(link.exceptions, start=1):
                lines.append(f"+---------------- {number} ----------------\n")
                nested = "".join(_format(sub, flags, seen))
                lines.extend(f"    {line}" for line in nested.splitlines(keepends=True))
    return lines


def format_exception_safely(exc: BaseException) -> str:
    """Trace complète (frames, chaîne, groupes) sans le message d'aucune erreur SQL."""
    return "".join(_format(exc, masked_flags(exc), set())).rstrip("\n")


# --------------------------------------------------------------------------- #
# Journaux
# --------------------------------------------------------------------------- #
_LogArgs = tuple[object, ...] | Mapping[str, object]


def _redact_args(args: _LogArgs) -> _LogArgs:
    if isinstance(args, tuple):
        if not any(isinstance(arg, BaseException) for arg in args):
            return args
        return tuple(safe_str(arg) if isinstance(arg, BaseException) else arg for arg in args)
    if not any(isinstance(arg, BaseException) for arg in args.values()):
        return args
    return {k: safe_str(v) if isinstance(v, BaseException) else v for k, v in args.items()}


def redact_log_record(record: logging.LogRecord) -> None:
    """Masque la trace et les exceptions passées en message ou en argument ``%s``."""
    exc = record.exc_info[1] if record.exc_info else None
    if exc is not None and contains_sql_error(exc):
        # Les formateurs standard réutilisent `exc_text` au lieu de reformater.
        record.exc_text = format_exception_safely(exc)
    if isinstance(record.msg, BaseException):
        record.msg = safe_str(record.msg)
    if record.args:
        record.args = _redact_args(record.args)


def install_log_record_redaction() -> None:
    """Pose le masquage sur TOUS les enregistrements du processus. Idempotent."""
    previous = logging.getLogRecordFactory()
    if getattr(previous, _FACTORY_FLAG, False):
        return

    def factory(*args: object, **kwargs: object) -> logging.LogRecord:
        record = previous(*args, **kwargs)
        try:
            redact_log_record(record)
        except Exception:
            # Fermé par défaut : un enregistrement non masqué pourrait porter une valeur.
            record.msg, record.args, record.exc_text = _MASKED_FAILURE, (), _MASKED_FAILURE
        return record

    setattr(factory, _FACTORY_FLAG, True)
    logging.setLogRecordFactory(factory)


# --------------------------------------------------------------------------- #
# Tâches arq
# --------------------------------------------------------------------------- #
def redact_sql_errors[**P, R](
    job: Callable[P, Coroutine[Any, Any, R]],
) -> Callable[P, Coroutine[Any, Any, R]]:
    """Une erreur SQL sortant d'une tâche arq devient ``SanitizedSqlError``.

    arq journalise ``str(exc)`` et stocke l'exception sérialisée dans Redis. Seule une
    erreur SQL (ou un texte d'erreur SQL) est remplacée : ``Retry``, ``CancelledError``,
    les délais dépassés et les autres exceptions passent inchangés, donc nouvelles
    tentatives, annulation et ``on_job_failure`` gardent leur comportement. La cause
    reste chaînée pour la trace (masquée) ; elle n'est pas sérialisée par pickle.
    """

    @functools.wraps(job)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        try:
            return await job(*args, **kwargs)
        except Exception as exc:
            if not (is_sql_error(exc) or looks_like_sql_text(_raw_str(exc))):
                raise
            raise SanitizedSqlError(f"{_type_name(exc)}: {describe_sql_error(exc)}") from exc

    return wrapper
