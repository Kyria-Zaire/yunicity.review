"""QA-WORKER-HEALTHCHECK-P1 — contrat de la sonde de sante du worker QA.

Le service `video-worker-qa` heritait du HEALTHCHECK de l'image backend
(`curl http://127.0.0.1:8000/api/v1/health`), impossible a satisfaire : un worker
ARQ n'expose aucun serveur HTTP. Resultat : `unhealthy` permanent malgre un
worker sain, donc une sonde qui n'informait de rien.

Ces tests verrouillent le remplacement :

- la sonde du worker QA est la commande NATIVE `arq --check` ;
- elle ne depend d'aucun port HTTP et ne porte aucun secret ;
- la sonde du backend n'est PAS modifiee ;
- `health_check_interval` reste court, sans quoi `arq --check` resterait vert
  jusqu'a une heure apres la mort du worker (le defaut ARQ est 3600 s, et la cle
  Redis vit `interval + 1`).
"""

from __future__ import annotations

import os
from pathlib import Path
from types import ModuleType
from typing import Any

import pytest
import yaml  # type: ignore[import-untyped]

pytestmark = pytest.mark.unit

_COMPOSE_QA = Path(__file__).resolve().parents[2] / "docker-compose.qa.yml"


def _compose() -> dict[str, Any]:
    with _COMPOSE_QA.open(encoding="utf-8") as handle:
        loaded: dict[str, Any] = yaml.safe_load(handle)
    return loaded


def _service(name: str) -> dict[str, Any]:
    services: dict[str, Any] = _compose()["services"]
    assert name in services, f"service {name} absent de docker-compose.qa.yml"
    result: dict[str, Any] = services[name]
    return result



def _worker_module() -> ModuleType:
    """Importe `workers.video_worker` hors conteneur.

    Le module resout `RedisSettings.from_dsn(REDIS_URL)` a l'import. `from_dsn`
    ne fait que parser : une DSN locale factice suffit, aucune connexion n'est
    ouverte. Sans elle, ces tests de contrat exigeraient un Redis.
    """
    os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
    from app.core.config import get_settings

    get_settings.cache_clear()
    import workers.video_worker as module

    return module


def test_worker_declares_its_own_healthcheck() -> None:
    """Sans declaration explicite, le service herite de la sonde HTTP de l'image."""
    assert "healthcheck" in _service("video-worker-qa")


def test_worker_healthcheck_uses_the_native_arq_command() -> None:
    test = _service("video-worker-qa")["healthcheck"]["test"]
    assert test[0] == "CMD", "forme exec attendue, pas de shell"
    commande = " ".join(test[1:])
    assert "arq" in commande and "--check" in commande
    assert "workers.video_worker.WorkerSettings" in commande


def test_worker_healthcheck_does_not_depend_on_http() -> None:
    """Un worker ARQ n'ecoute sur aucun port : la sonde ne doit pas le supposer."""
    commande = " ".join(_service("video-worker-qa")["healthcheck"]["test"])
    for interdit in ("curl", "wget", "http://", "8000", "/api/v1/health"):
        assert interdit not in commande, f"la sonde worker ne doit pas contenir {interdit!r}"


def test_worker_healthcheck_carries_no_secret() -> None:
    commande = " ".join(_service("video-worker-qa")["healthcheck"]["test"]).lower()
    for interdit in ("password", "redis://", "postgresql", "token", "secret", "key="):
        assert interdit not in commande


def test_worker_healthcheck_timings_are_coherent() -> None:
    """La sonde doit interroger plus souvent que la cle n'expire, laisser le temps
    au demarrage, et tolerer un rate manque sans faux negatif."""
    worker = _worker_module()
    WORKER_HEALTH_CHECK_INTERVAL_SECONDS = worker.WORKER_HEALTH_CHECK_INTERVAL_SECONDS

    hc = _service("video-worker-qa")["healthcheck"]
    assert hc["interval"] == "30s"
    assert hc["timeout"] == "10s"
    assert hc["retries"] >= 2
    assert hc["start_period"] == "60s"
    # La sonde ne doit pas etre plus lente que l'expiration de la cle, sinon elle
    # signalerait un faux negatif entre deux battements.
    assert WORKER_HEALTH_CHECK_INTERVAL_SECONDS <= 30


def test_worker_heartbeat_is_short_enough_to_detect_a_dead_worker() -> None:
    """`arq --check` lit une cle a TTL = interval + 1. Avec le defaut ARQ de
    3600 s, un worker mort resterait annonce sain pendant une heure."""
    worker = _worker_module()
    WORKER_HEALTH_CHECK_INTERVAL_SECONDS = worker.WORKER_HEALTH_CHECK_INTERVAL_SECONDS
    WorkerSettings = worker.WorkerSettings

    assert WorkerSettings.health_check_interval == WORKER_HEALTH_CHECK_INTERVAL_SECONDS
    assert WORKER_HEALTH_CHECK_INTERVAL_SECONDS < 3600, "le defaut ARQ ne convient pas"
    assert WORKER_HEALTH_CHECK_INTERVAL_SECONDS >= 10, "un battement trop frequent est inutile"


def test_worker_probe_targets_the_same_queue_as_the_worker() -> None:
    """La sonde lance la meme classe WorkerSettings : meme queue, meme Redis."""
    from app.services.local_video.job_queue import ARQ_QUEUE_NAME

    WorkerSettings = _worker_module().WorkerSettings

    assert WorkerSettings.queue_name == ARQ_QUEUE_NAME
    commande = " ".join(_service("video-worker-qa")["healthcheck"]["test"])
    assert "workers.video_worker.WorkerSettings" in commande


def test_backend_healthcheck_is_untouched() -> None:
    """Perimetre : seul le worker change. Le backend garde sa sonde HTTP, legitime."""
    backend = _service("backend-qa")
    if "healthcheck" in backend:
        commande = " ".join(str(part) for part in backend["healthcheck"]["test"])
        assert "health" in commande
        assert "arq" not in commande


def test_single_ffmpeg_job_is_preserved() -> None:
    assert _worker_module().WorkerSettings.max_jobs == 1
