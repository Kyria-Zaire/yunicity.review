"""QA isolation tooling (C3-F0-T1).

Infra-only package: anti-production guard, schema reset and fixture launcher for
the disposable ``yunicity_qa`` stack. Never imported by business code paths and
fail-closed by construction — see :mod:`app.qa.guard`.
"""
