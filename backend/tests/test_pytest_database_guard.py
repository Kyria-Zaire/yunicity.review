"""Garde fail-closed de la base de tests backend (C3.1-R1G).

`yunicity_qa` appartient à Playwright et à la revue manuelle : la suite pytest y
détruisait la baseline (mesuré : `users=1 posts=0 tribes=0` au lieu de `2/3/2`
après un simple run ciblé). Les tests backend doivent donc viser une base locale
JETABLE et distincte, dont le nom porte un préfixe réservé.

Ce garde est un frère de `evaluate_qa_database_target`, pas un assouplissement :
il refuse explicitement `yunicity_qa`, `yunicity_dev`, tout nom sans préfixe
réservé, les hôtes managés et le port de la base de développement.
"""

from __future__ import annotations

import pytest
from app.qa.guard import (
    PYTEST_DB_NAME_PREFIX,
    QA_MODE_ENV,
    QA_TOKEN_ENV,
    TEST_DB_ENV,
    QaGuardError,
    evaluate_pytest_database_target,
)


def _env(url: str, **extra: str) -> dict[str, str]:
    base = {
        QA_MODE_ENV: "1",
        QA_TOKEN_ENV: "token-r1g",
        TEST_DB_ENV: url,
    }
    base.update(extra)
    return base


def _url(dbname: str, host: str = "postgres-qa", port: int = 5432) -> str:
    return f"postgresql+asyncpg://u:p@{host}:{port}/{dbname}"


class TestPytestDatabaseGuardAccepts:
    def test_accepts_a_prefixed_disposable_database_on_the_compose_host(self) -> None:
        target = evaluate_pytest_database_target(_env(_url(f"{PYTEST_DB_NAME_PREFIX}r1g")))
        assert target.dbname == f"{PYTEST_DB_NAME_PREFIX}r1g"
        assert target.host == "postgres-qa"
        assert target.port == 5432

    def test_accepts_the_published_local_port(self) -> None:
        target = evaluate_pytest_database_target(
            _env(_url(f"{PYTEST_DB_NAME_PREFIX}local", host="localhost", port=5455))
        )
        assert target.host == "localhost"


class TestPytestDatabaseGuardRefuses:
    def test_refuses_the_playwright_qa_baseline(self) -> None:
        """Le cœur du découplage : pytest ne doit plus jamais viser `yunicity_qa`."""
        with pytest.raises(QaGuardError) as exc:
            evaluate_pytest_database_target(_env(_url("yunicity_qa")))
        assert "DBNAME_NOT_DISPOSABLE_TEST" in str(exc.value)

    def test_refuses_the_dev_database(self) -> None:
        with pytest.raises(QaGuardError) as exc:
            evaluate_pytest_database_target(_env(_url("yunicity_dev")))
        assert "DBNAME_FORBIDDEN" in str(exc.value)

    def test_refuses_a_name_without_the_reserved_prefix(self) -> None:
        with pytest.raises(QaGuardError) as exc:
            evaluate_pytest_database_target(_env(_url("scratch")))
        assert "DBNAME_NOT_DISPOSABLE_TEST" in str(exc.value)

    def test_refuses_the_bare_prefix_without_a_suffix(self) -> None:
        with pytest.raises(QaGuardError):
            evaluate_pytest_database_target(_env(_url("yunicity_test")))

    def test_refuses_the_dev_port(self) -> None:
        with pytest.raises(QaGuardError) as exc:
            evaluate_pytest_database_target(
                _env(_url(f"{PYTEST_DB_NAME_PREFIX}x", host="localhost", port=5434))
            )
        assert "DEV_PORT_5434" in str(exc.value)

    @pytest.mark.parametrize("host", ["db.railway.app", "aws-0.supabase.co", "prod-db.internal"])
    def test_refuses_managed_or_remote_hosts(self, host: str) -> None:
        with pytest.raises(QaGuardError) as exc:
            evaluate_pytest_database_target(_env(_url(f"{PYTEST_DB_NAME_PREFIX}x", host=host)))
        assert "HOST_FORBIDDEN" in str(exc.value)

    def test_refuses_when_a_railway_variable_is_present(self) -> None:
        with pytest.raises(QaGuardError) as exc:
            evaluate_pytest_database_target(
                _env(_url(f"{PYTEST_DB_NAME_PREFIX}x"), RAILWAY_ENVIRONMENT="production")
            )
        assert "RAILWAY_ENV_PRESENT" in str(exc.value)

    def test_refuses_without_the_explicit_run_marker(self) -> None:
        env = _env(_url(f"{PYTEST_DB_NAME_PREFIX}x"))
        env[QA_MODE_ENV] = ""
        with pytest.raises(QaGuardError) as exc:
            evaluate_pytest_database_target(env)
        assert "QA_MODE_ABSENT" in str(exc.value)

    def test_refuses_without_a_test_database_url(self) -> None:
        env = _env("")
        with pytest.raises(QaGuardError) as exc:
            evaluate_pytest_database_target(env)
        assert "TEST_DATABASE_URL_ABSENT" in str(exc.value)
