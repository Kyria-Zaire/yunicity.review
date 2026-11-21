"""Hooks Sentry : aucune valeur citée par une erreur SQL (APP-SQL-ERROR-VALUES-01).

Réécrit le message des exceptions SQL de l'événement FINAL, à partir des exceptions
réelles (``hint["exc_info"]``) ; à défaut de correspondance, un type issu d'un module
SQL est masqué en bloc. Les variables locales sont coupées à l'initialisation
(``include_local_variables=False``, ``app.core.observability``).
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.core.sql_error_redaction import (
    MASKED_SQL,
    MASKED_TEXT,
    is_sql_module,
    iter_linked,
    looks_like_sql_text,
    masked_flags,
    message_for,
)

if TYPE_CHECKING:
    from sentry_sdk.types import Breadcrumb, BreadcrumbHint, Event, Hint


def scrub_sentry_event(event: Event, hint: Hint) -> Event:
    """``before_send`` : réécrit le message des exceptions SQL de l'événement final."""
    exc_info = hint.get("exc_info") if hint else None
    root = exc_info[1] if isinstance(exc_info, tuple) and len(exc_info) == 3 else None
    candidates = list(iter_linked(root)) if isinstance(root, BaseException) else []
    flags = masked_flags(root) if isinstance(root, BaseException) else {}
    used: set[int] = set()
    for value in (event.get("exception") or {}).get("values", []):
        match = next(
            (
                link
                for link in candidates
                if id(link) not in used
                and type(link).__name__ == value.get("type")
                and type(link).__module__ == value.get("module", type(link).__module__)
            ),
            None,
        )
        if match is not None:
            used.add(id(match))
            value["value"] = message_for(match, flags.get(id(match), False))
        elif is_sql_module(value.get("module")) or looks_like_sql_text(str(value.get("value", ""))):
            value["value"] = f"[{MASKED_SQL}]"
    logentry = event.get("logentry")
    if logentry:
        event["logentry"] = {
            key: MASKED_TEXT if isinstance(item, str) and looks_like_sql_text(item) else item
            for key, item in logentry.items()
        }
    message = event.get("message")
    if isinstance(message, str) and looks_like_sql_text(message):
        event["message"] = MASKED_TEXT
    return event


def scrub_sentry_breadcrumb(crumb: Breadcrumb, hint: BreadcrumbHint) -> Breadcrumb:
    """``before_breadcrumb`` : un message de journal citant une erreur SQL est masqué."""
    del hint
    message = crumb.get("message")
    if isinstance(message, str) and looks_like_sql_text(message):
        crumb["message"] = MASKED_TEXT
    return crumb
