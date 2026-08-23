"""C3-FEED-MOBILE-STACK-01 — Docker CI doit viser une base JETABLE.

Contexte du défaut fermé ici
----------------------------
C3.1-R1G a découplé la suite pytest de ``yunicity_qa`` : la baseline de Playwright
et de la revue manuelle ne doit plus être détruite par un run de tests. Le garde
``evaluate_pytest_database_target`` refuse donc explicitement ce nom.

Mais ``docker-ci.yml`` appelait encore ``pytest`` nu dans le conteneur ``backend-qa``,
dont ``TEST_DATABASE_URL`` pointe sur ``yunicity_qa`` — l'URL dont l'API QA a besoin
pour SERVIR la baseline. Le job échouait donc en ``INTERNALERROR`` au
``pytest_sessionstart`` :

    QaGuardError: DBNAME_NOT_DISPOSABLE_TEST:yunicity_qa

La correction est une orchestration, pas un assouplissement : le job passe par
``scripts/run_backend_tests``, qui crée puis supprime ``yunicity_test_<uuid>``.

Ces tests verrouillent ce contrat côté configuration. Ils lisent des FICHIERS,
jamais le daemon Docker ni une base : exécutables en CI comme dans le conteneur
backend, où le workflow est monté en lecture seule.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

# `PyYAML` n'expose pas de stubs et `types-PyYAML` typerait de toute facon
# `safe_load` en `Any` : l'exception est CIBLEE, comme dans
# `test_qa_media_volume_non_root.py`, plutot qu'un override projet-wide.
import yaml  # type: ignore[import-untyped]
from app.qa.guard import PYTEST_DB_NAME_PREFIX, QA_DB_NAME

WORKFLOW_FILENAME = "docker-ci.yml"
COMPOSE_FILENAME = "docker-compose.qa.yml"
RUNNER_MODULE = "scripts.run_backend_tests"
BACKEND_SERVICE = "backend-qa"


def _locate(relative: str, fallback: str) -> Path:
    """Remonte l'arborescence, puis retombe sur le point de montage du conteneur.

    Le conteneur QA ne monte que `./backend` sur `/app` : la racine du dépôt n'y
    est pas. Les fichiers d'infrastructure dont un contrat dépend y sont donc
    montés individuellement, en lecture seule.
    """
    for candidate in Path(__file__).resolve().parents:
        found = candidate / relative
        if found.is_file():
            return found
    return Path(fallback)


WORKFLOW_PATH = _locate(f".github/workflows/{WORKFLOW_FILENAME}", f"/{WORKFLOW_FILENAME}")
COMPOSE_PATH = _locate(COMPOSE_FILENAME, f"/{COMPOSE_FILENAME}")


@pytest.fixture(scope="module")
def workflow() -> dict[str, Any]:
    assert WORKFLOW_PATH.is_file(), f"{WORKFLOW_FILENAME} introuvable : {WORKFLOW_PATH}"
    loaded = yaml.safe_load(WORKFLOW_PATH.read_text(encoding="utf-8"))
    assert isinstance(loaded, dict), f"{WORKFLOW_FILENAME} illisible"
    return loaded


@pytest.fixture(scope="module")
def steps(workflow: dict[str, Any]) -> list[dict[str, Any]]:
    jobs = workflow.get("jobs")
    assert isinstance(jobs, dict) and jobs, "aucun job dans docker-ci.yml"
    collected: list[dict[str, Any]] = []
    for job in jobs.values():
        for step in job.get("steps", []):
            if isinstance(step, dict):
                collected.append(step)
    assert collected, "aucune étape dans docker-ci.yml"
    return collected


def _commands(steps: list[dict[str, Any]]) -> list[str]:
    return [str(step["run"]) for step in steps if "run" in step]


def test_pytest_est_lance_par_le_runner_de_base_jetable(steps: list[dict[str, Any]]) -> None:
    """Le job doit passer par le runner, seul chemin qui crée `yunicity_test_<uuid>`."""
    commandes = _commands(steps)
    assert any(RUNNER_MODULE in commande for commande in commandes), (
        f"docker-ci.yml n'appelle pas {RUNNER_MODULE} : "
        f"la suite viserait la base servie par le conteneur. Commandes = {commandes}"
    )


def test_aucun_pytest_nu_dans_le_conteneur(steps: list[dict[str, Any]]) -> None:
    """Un `pytest` nu hérite de `TEST_DATABASE_URL` du conteneur, donc `yunicity_qa`."""
    for commande in _commands(steps):
        if f"exec -T {BACKEND_SERVICE}" not in commande:
            continue
        if RUNNER_MODULE in commande:
            continue
        assert "pytest" not in commande, (
            "docker-ci.yml lance `pytest` directement dans le conteneur QA — "
            f"le garde refusera {QA_DB_NAME}. Commande fautive : {commande.strip()}"
        )


def test_le_job_ne_revendique_plus_la_base_de_revue(workflow: dict[str, Any]) -> None:
    """Le nom du job ne doit pas annoncer une cible que le garde interdit."""
    jobs = workflow.get("jobs", {})
    for identifiant, job in jobs.items():
        nom = str(job.get("name", identifiant))
        assert QA_DB_NAME not in nom, (
            f"le job « {nom} » annonce {QA_DB_NAME} comme cible des tests, "
            "ce que le garde refuse depuis C3.1-R1G"
        )


def test_le_conteneur_expose_toujours_la_baseline_a_l_api(workflow: dict[str, Any]) -> None:
    """La correction ne doit PAS déplacer la base servie par l'API QA.

    `TEST_DATABASE_URL=yunicity_qa` reste légitime pour le conteneur : c'est ce
    dont les fixtures destructives de Playwright ont besoin. Seule la suite pytest
    change de cible, et elle le fait en surchargeant la variable, pas en modifiant
    la compose.
    """
    assert COMPOSE_PATH.is_file(), f"{COMPOSE_FILENAME} introuvable : {COMPOSE_PATH}"
    compose = yaml.safe_load(COMPOSE_PATH.read_text(encoding="utf-8"))
    environnement = compose["services"][BACKEND_SERVICE]["environment"]
    assert environnement["TEST_DATABASE_URL"].endswith(f"/{QA_DB_NAME}")
    assert PYTEST_DB_NAME_PREFIX not in environnement["TEST_DATABASE_URL"]


def test_le_workflow_est_lisible_depuis_le_conteneur(workflow: dict[str, Any]) -> None:
    """Sans montage, le contrat s'auto-désactiverait là où il protège le plus.

    Docker CI se déclenche sur `.github/workflows/docker-ci.yml` ; Backend CI, lui,
    ne se déclenche que sur `backend/**`. Une modification du seul workflow doit
    donc rester couverte — d'où le montage lecture seule.
    """
    compose = yaml.safe_load(COMPOSE_PATH.read_text(encoding="utf-8"))
    volumes = compose["services"][BACKEND_SERVICE]["volumes"]
    monte = [v for v in volumes if WORKFLOW_FILENAME in str(v)]
    assert monte, f"{WORKFLOW_FILENAME} n'est pas monté dans {BACKEND_SERVICE}"
    assert all(str(v).endswith(":ro") for v in monte), "le montage doit être en lecture seule"
    assert workflow, "workflow non chargé"
