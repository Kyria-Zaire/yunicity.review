"""Shared destructive-test targeting policy (C3-F0-T1-R1).

Single import point every destructive DB fixture uses so the ONLY possible
destructive database is ``yunicity_qa``, resolved from ``TEST_DATABASE_URL`` and
validated by the fail-closed QA guard (:mod:`app.qa.guard`).

There is deliberately **no fallback to ``DATABASE_URL``**: destructive access must
be an explicit, validated QA target or nothing happens.
"""

from __future__ import annotations

import os

import pytest
from app.qa.guard import TEST_DB_ENV, QaGuardError, ensure_qa_database_target

_DATABASE_URL_ENV = "DATABASE_URL"


def resolve_destructive_qa_url() -> str:
    """Return the validated QA destructive URL, or skip/refuse — never fall back.

    - No ``TEST_DATABASE_URL`` and no ``DATABASE_URL`` → skip (unit-only env, e.g. backend-ci).
    - No ``TEST_DATABASE_URL`` but ``DATABASE_URL`` present → **refuse** (the dangerous case).
    - ``TEST_DATABASE_URL`` present → validate via the QA guard (raises on any forbidden target
      or missing QA marker) and return it. No connection is opened here.
    """
    test_url = os.environ.get(TEST_DB_ENV, "").strip()
    if not test_url:
        if not os.environ.get(_DATABASE_URL_ENV, "").strip():
            pytest.skip("no integration DB configured — set TEST_DATABASE_URL to yunicity_qa")
        raise QaGuardError("TEST_DATABASE_URL_ABSENT")
    ensure_qa_database_target()
    return test_url


def configure_destructive_qa_db(monkeypatch: pytest.MonkeyPatch) -> str:
    """Point the application ``DATABASE_URL`` at the validated QA target for this test."""
    url = resolve_destructive_qa_url()
    monkeypatch.setenv(_DATABASE_URL_ENV, url)
    return url
