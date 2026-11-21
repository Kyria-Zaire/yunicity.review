"""Superviseur du service unifié : démarrage conjoint, arrêt propre, mort liée.

Ces tests pilotent de VRAIS sous-processus (pas des mocks) : c'est le seul moyen de
prouver qu'aucun zombie ne subsiste et que les codes de sortie remontent. Les commandes
enfants sont de courts scripts Python, donc portables Windows/Linux — la CI et le poste
de dev exécutent le même contrat.
"""

from __future__ import annotations

import signal
import sys
import threading
import time

import pytest
from app.runtime.unified_process import ChildSpec, Supervisor, build_default_children


def _python(code: str) -> list[str]:
    return [sys.executable, "-c", code]


SLEEP_FOREVER = _python("import time\nwhile True: time.sleep(0.05)")
EXIT_OK_FAST = _python("import sys\nsys.exit(0)")
CRASH_FAST = _python("import sys\nsys.exit(3)")


def _supervisor(*children: ChildSpec) -> Supervisor:
    return Supervisor(children=list(children), graceful_seconds=5.0, poll_interval=0.05)


def test_starts_every_child_together() -> None:
    sup = _supervisor(
        ChildSpec("api", SLEEP_FOREVER),
        ChildSpec("worker", SLEEP_FOREVER),
    )
    result: list[int] = []
    thread = threading.Thread(target=lambda: result.append(sup.run()), daemon=True)
    thread.start()

    deadline = time.monotonic() + 10
    while len(sup._running) < 2 and time.monotonic() < deadline:
        time.sleep(0.05)

    assert len(sup._running) == 2, "les deux enfants doivent démarrer"
    assert {c.name for c in sup._running} == {"api", "worker"}
    assert all(c.process.poll() is None for c in sup._running), "les deux doivent tourner"

    sup._signalled = signal.SIGTERM
    thread.join(timeout=20)
    assert result == [0]


def test_sigterm_stops_both_children_and_exits_zero() -> None:
    """Un arrêt demandé est nominal : code 0, et plus aucun enfant vivant."""
    sup = _supervisor(
        ChildSpec("api", SLEEP_FOREVER),
        ChildSpec("worker", SLEEP_FOREVER),
    )
    result: list[int] = []
    thread = threading.Thread(target=lambda: result.append(sup.run()), daemon=True)
    thread.start()
    deadline = time.monotonic() + 10
    while len(sup._running) < 2 and time.monotonic() < deadline:
        time.sleep(0.05)

    sup._signalled = signal.SIGTERM
    thread.join(timeout=20)

    assert result == [0]
    for child in sup._running:
        # poll() renseigné => statut récupéré => pas de zombie.
        assert child.process.poll() is not None, f"{child.name} toujours vivant"


@pytest.mark.parametrize("dying", ["worker", "api"])
def test_a_dying_child_takes_the_whole_service_down(dying: str) -> None:
    """Que ce soit l'API ou le worker qui meure, le conteneur doit sortir en erreur.

    Sans cela, Railway verrait un service « sain » alors que la moitié du service est
    morte : les vidéos cesseraient d'être transcodées sans aucun signal.
    """
    specs = {
        "api": ChildSpec("api", SLEEP_FOREVER),
        "worker": ChildSpec("worker", SLEEP_FOREVER),
    }
    specs[dying] = ChildSpec(dying, CRASH_FAST)
    sup = _supervisor(specs["api"], specs["worker"])

    code = sup.run()

    assert code == 3, "le code de sortie de l'enfant fautif doit remonter"
    for child in sup._running:
        assert child.process.poll() is not None, f"{child.name} aurait dû être arrêté"


def test_a_child_exiting_zero_is_still_a_failure() -> None:
    """Un enfant qui s'arrête « proprement » rend le service incomplet : code non nul."""
    sup = _supervisor(
        ChildSpec("api", SLEEP_FOREVER),
        ChildSpec("worker", EXIT_OK_FAST),
    )
    assert sup.run() == 1


def test_default_children_are_the_api_and_the_worker(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PORT", "9123")
    children = build_default_children()

    assert [c.name for c in children] == ["api", "worker"]
    api, worker = children
    assert "uvicorn" in api.command
    assert "app.main:create_app" in api.command
    assert "9123" in api.command, "le port Railway doit être respecté"
    assert "arq" in worker.command
    assert "workers.video_worker.WorkerSettings" in worker.command


def test_worker_transcodes_one_video_at_a_time(monkeypatch: pytest.MonkeyPatch) -> None:
    """Concurrence ffmpeg limitée : l'API partage le CPU du conteneur unifié.

    `WorkerSettings` construit ses `RedisSettings` à l'import : on fournit donc une URL
    Redis syntaxique, sans jamais ouvrir de connexion.
    """
    import app.core.config as config_module

    # `WorkerSettings` construit ses `RedisSettings` dans le corps de classe, donc à
    # l'import. La suite surcharge `get_settings` pour ses propres besoins : on lui
    # substitue une lecture d'environnement le temps de l'import, sans jamais ouvrir de
    # connexion Redis (RedisSettings.from_dsn ne fait que parser l'URL).
    monkeypatch.setenv("REDIS_URL", "redis://127.0.0.1:6379/0")
    monkeypatch.setattr(config_module, "get_settings", config_module.Settings)

    from workers.video_worker import WorkerSettings

    assert WorkerSettings.max_jobs == 1
