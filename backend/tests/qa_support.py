"""Shared destructive-test targeting policy (C3-F0-T1-R1, durci en C3.1-R1G).

Single import point every destructive DB fixture uses so the ONLY possible
destructive database is a base JETABLE ``yunicity_test_*``, resolved from
``TEST_DATABASE_URL`` et validee par le garde fail-closed (:mod:`app.qa.guard`).

C3.1-R1G : la cible etait auparavant ``yunicity_qa``. Or cette base est la baseline
de Playwright et de la revue manuelle — un simple run pytest la detruisait (mesure :
``users=1 posts=0 tribes=0`` au lieu de ``2/3/2``). Le garde refuse desormais
explicitement ``yunicity_qa`` pour les tests backend.

There is deliberately **no fallback to ``DATABASE_URL``**: destructive access must
be an explicit, validated disposable target or nothing happens.
"""

from __future__ import annotations

import os

import pytest
from app.qa.guard import TEST_DB_ENV, QaGuardError, ensure_pytest_database_target

_DATABASE_URL_ENV = "DATABASE_URL"


def resolve_destructive_qa_url() -> str:
    """Return the validated disposable destructive URL, or skip/refuse — never fall back.

    - No ``TEST_DATABASE_URL`` and no ``DATABASE_URL`` → skip (unit-only env, e.g. backend-ci).
    - No ``TEST_DATABASE_URL`` but ``DATABASE_URL`` present → **refuse** (the dangerous case).
    - ``TEST_DATABASE_URL`` present → validate via the pytest guard (raises on any forbidden
      target, on ``yunicity_qa``, ou sur un marqueur absent) and return it. No connection here.
    """
    test_url = os.environ.get(TEST_DB_ENV, "").strip()
    if not test_url:
        if not os.environ.get(_DATABASE_URL_ENV, "").strip():
            pytest.skip(
                "no integration DB configured — set TEST_DATABASE_URL to a yunicity_test_* database"
            )
        raise QaGuardError("TEST_DATABASE_URL_ABSENT")
    ensure_pytest_database_target()
    return test_url


def configure_destructive_qa_db(monkeypatch: pytest.MonkeyPatch) -> str:
    """Point the application ``DATABASE_URL`` at the validated disposable target."""
    url = resolve_destructive_qa_url()
    monkeypatch.setenv(_DATABASE_URL_ENV, url)
    return url
