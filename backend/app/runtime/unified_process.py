"""Superviseur du service unifié Railway : API Uvicorn + worker ARQ dans un conteneur.

Pourquoi ce module existe
-------------------------
Le volume Railway est attaché A UN SERVICE. Tant que l'API et le worker sont deux services,
ils ne peuvent pas partager un disque : l'API reçoit l'upload, le worker doit lire le même
fichier. Les réunir dans un processus parent est donc la condition du stockage filesystem.

`uvicorn & arq` en shell ne suffit pas : le shell ne relaie pas SIGTERM aux enfants, ne
remonte pas leur code de sortie, et laisse le conteneur « vivant » alors qu'un des deux est
mort. Railway ne redémarrerait alors rien, et les vidéos cesseraient d'être transcodées en
silence — exactement la classe de panne muette qu'on veut éviter.

Contrat
-------
- les deux enfants démarrent ; si l'un s'arrête, l'autre est terminé puis attendu ;
- le code de sortie du parent est non nul dès qu'un enfant sort en erreur ;
- SIGTERM/SIGINT sont relayés aux deux, avec escalade SIGKILL après un délai ;
- chaque enfant est attendu (`wait`) : aucun zombie ;
- les logs nomment l'enfant concerné, jamais son environnement.
"""

from __future__ import annotations

import logging
import os
import signal
import subprocess
import sys
import time
from dataclasses import dataclass, field
from types import FrameType

logger = logging.getLogger("yunicity.unified")

#: Délai laissé à un enfant pour sortir sur SIGTERM avant SIGKILL.
GRACEFUL_SHUTDOWN_SECONDS = 15.0

#: Intervalle de surveillance des enfants.
POLL_INTERVAL_SECONDS = 0.25


@dataclass(frozen=True)
class ChildSpec:
    """Un processus enfant à superviser."""

    name: str
    command: list[str]


@dataclass
class _RunningChild:
    spec: ChildSpec
    process: subprocess.Popen[bytes]

    @property
    def name(self) -> str:
        return self.spec.name


@dataclass
class Supervisor:
    """Démarre N enfants et lie leurs cycles de vie : si l'un meurt, tous meurent."""

    children: list[ChildSpec]
    graceful_seconds: float = GRACEFUL_SHUTDOWN_SECONDS
    poll_interval: float = POLL_INTERVAL_SECONDS
    _running: list[_RunningChild] = field(default_factory=list, init=False)
    _signalled: int | None = field(default=None, init=False)

    def _start_all(self) -> None:
        for spec in self.children:
            logger.info("unified_child_starting name=%s", spec.name)
            # start_new_session=False : les enfants restent dans le groupe du parent, donc un
            # signal envoyé au conteneur les atteint aussi ; on les signale malgré tout
            # explicitement pour ne pas dépendre de la propagation du groupe.
            process = subprocess.Popen(spec.command)  # noqa: S603 - commandes internes fixes
            self._running.append(_RunningChild(spec=spec, process=process))
            logger.info("unified_child_started name=%s pid=%s", spec.name, process.pid)

    def _install_signal_handlers(self) -> None:
        def handler(signum: int, _frame: FrameType | None) -> None:
            self._signalled = signum
            logger.info("unified_signal_received signal=%s", signal.Signals(signum).name)

        for sig in (signal.SIGTERM, signal.SIGINT):
            try:
                signal.signal(sig, handler)
            except ValueError:
                # `signal.signal` n'est autorisé que dans le thread principal. En
                # production le superviseur EST le thread principal ; hors de lui (tests,
                # embarquement), on continue sans handler plutôt que d'échouer : la
                # surveillance des enfants, elle, fonctionne dans tous les cas.
                logger.debug("unified_signal_handler_skipped signal=%s", sig)

    def _terminate_all(self, *, reason: str) -> None:
        logger.info("unified_stopping reason=%s", reason)
        for child in self._running:
            if child.process.poll() is None:
                logger.info("unified_child_terminating name=%s", child.name)
                child.process.terminate()

        deadline = time.monotonic() + self.graceful_seconds
        for child in self._running:
            remaining = max(0.0, deadline - time.monotonic())
            try:
                child.process.wait(timeout=remaining)
            except subprocess.TimeoutExpired:
                logger.warning("unified_child_kill name=%s", child.name)
                child.process.kill()
            # `wait` inconditionnel : récupère le statut, donc pas de zombie.
            child.process.wait()

    def run(self) -> int:
        self._install_signal_handlers()
        self._start_all()
        try:
            while True:
                if self._signalled is not None:
                    self._terminate_all(reason=f"signal:{signal.Signals(self._signalled).name}")
                    # Arrêt demandé = sortie nominale.
                    return 0

                for child in self._running:
                    code = child.process.poll()
                    if code is None:
                        continue
                    logger.error("unified_child_exited name=%s code=%s", child.name, code)
                    self._terminate_all(reason=f"child_exited:{child.name}")
                    # Un enfant qui s'arrête, même proprement, rend le service incomplet :
                    # le conteneur doit mourir pour que Railway le redémarre.
                    return code if code != 0 else 1

                time.sleep(self.poll_interval)
        except BaseException:
            self._terminate_all(reason="supervisor_error")
            raise


def build_default_children() -> list[ChildSpec]:
    """API + worker, avec le port attendu par Railway et une concurrence ffmpeg de 1."""
    port = os.environ.get("PORT", "8000")
    return [
        ChildSpec(
            name="api",
            command=[
                sys.executable, "-m", "uvicorn", "app.main:create_app",
                "--factory", "--host", "0.0.0.0", "--port", str(port),
            ],
        ),
        ChildSpec(
            name="worker",
            command=[sys.executable, "-m", "arq", "workers.video_worker.WorkerSettings"],
        ),
    ]


def main() -> int:
    logging.basicConfig(
        level=os.environ.get("LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    return Supervisor(children=build_default_children()).run()


if __name__ == "__main__":  # pragma: no cover - point d'entrée
    raise SystemExit(main())
