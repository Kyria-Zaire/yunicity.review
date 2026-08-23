"""C3.1-R1F — le backend QA doit tourner NON-ROOT sur un volume média initialisé.

Contexte du défaut fermé ici : le volume nommé monté sur
``/var/yunicity-qa/story-media`` n'existe pas dans l'image, donc Docker crée son
point de montage en ``root:root 0755``. L'utilisateur applicatif (``app``, UID 999)
ne pouvait pas y écrire, d'où le contournement ``user: "0:0"`` sur ``backend-qa``.

Ces tests verrouillent le contrat d'infrastructure QA côté configuration :
l'initialisation du volume est portée par un service dédié, court et borné, et le
backend démarre non-root uniquement après sa réussite. La preuve runtime (``id``,
propriétaire du répertoire, upload/restart/reset) est faite en intégration.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

# `PyYAML` n'expose pas de stubs et `types-PyYAML` typerait de toute facon
# `safe_load` en `Any` : l'exception ne coute donc aucune precision de typage.
# Elle est CIBLEE (code d'erreur explicite, une ligne, un seul fichier de test)
# plutot qu'un override `yaml.*` projet-wide, qui laisserait croire a un besoin
# applicatif inexistant — aucun module de `app/` n'importe yaml. `strict` garde
# `warn_unused_ignores` : si des stubs arrivent un jour, mypy signalera cette ligne.
import yaml  # type: ignore[import-untyped]

COMPOSE_FILENAME = "docker-compose.qa.yml"


def _locate_compose() -> Path:
    """Remonte l'arborescence jusqu'au fichier compose.

    Le test lit un FICHIER, jamais le daemon Docker : il reste un contrat statique,
    executable en CI comme dans le conteneur backend (ou la racine du depot n'est pas
    montee, mais ou le fichier l'est en lecture seule).
    """
    for candidate in Path(__file__).resolve().parents:
        found = candidate / COMPOSE_FILENAME
        if found.is_file():
            return found
    return Path("/") / COMPOSE_FILENAME


COMPOSE_PATH = _locate_compose()

BACKEND_SERVICE = "backend-qa"
INIT_SERVICE = "story-media-init-qa"
MEDIA_ROOT = "/var/yunicity-qa/story-media"
MEDIA_VOLUME = "yunicity-qa-story-media"
APP_USER = "app"


@pytest.fixture(scope="module")
def compose() -> dict[str, Any]:
    assert COMPOSE_PATH.is_file(), f"docker-compose.qa.yml introuvable : {COMPOSE_PATH}"
    loaded = yaml.safe_load(COMPOSE_PATH.read_text(encoding="utf-8"))
    assert isinstance(loaded, dict), "docker-compose.qa.yml illisible"
    return loaded


def _service(compose: dict[str, Any], name: str) -> dict[str, Any]:
    services = compose.get("services", {})
    assert name in services, f"service « {name} » absent de docker-compose.qa.yml"
    service = services[name]
    assert isinstance(service, dict)
    return service


def _command_text(service: dict[str, Any]) -> str:
    command = service.get("command", "")
    if isinstance(command, list):
        return " ".join(str(part) for part in command)
    return str(command)


def _is_root_user(value: str) -> bool:
    """``0``, ``0:0``, ``root`` et ``root:root`` désignent tous root."""
    user = value.strip()
    if not user:
        return False
    identity = user.split(":", 1)[0].strip().lower()
    return identity in {"0", "root"}


class TestQaBackendRunsNonRoot:
    def test_backend_service_is_not_forced_to_root(self, compose: dict[str, Any]) -> None:
        backend = _service(compose, BACKEND_SERVICE)
        user = str(backend.get("user", "")).strip()
        assert not _is_root_user(user), (
            f"{BACKEND_SERVICE} force encore l'exécution root (user: {user!r}). "
            "Le backend doit conserver l'utilisateur non-root de l'image."
        )

    def test_backend_still_mounts_the_media_volume(self, compose: dict[str, Any]) -> None:
        backend = _service(compose, BACKEND_SERVICE)
        mounts = [str(entry) for entry in backend.get("volumes", [])]
        assert f"{MEDIA_VOLUME}:{MEDIA_ROOT}" in mounts, (
            "le backend QA doit continuer de monter le volume média nommé"
        )

    def test_backend_still_uses_the_filesystem_backend_on_the_expected_root(
        self, compose: dict[str, Any]
    ) -> None:
        environment = _service(compose, BACKEND_SERVICE).get("environment", {})
        assert environment.get("STORY_MEDIA_STORAGE_BACKEND") == "filesystem"
        assert environment.get("STORY_MEDIA_UPLOAD_DIR") == MEDIA_ROOT


class TestQaMediaVolumeInitialiser:
    def test_a_dedicated_initialiser_service_exists(self, compose: dict[str, Any]) -> None:
        init = _service(compose, INIT_SERVICE)
        assert _command_text(init).strip(), "l'initialiseur doit porter une commande explicite"

    def test_initialiser_is_short_lived_and_bounded(self, compose: dict[str, Any]) -> None:
        init = _service(compose, INIT_SERVICE)
        assert str(init.get("restart", "no")) == "no", "l'initialiseur ne doit jamais redémarrer"
        assert "ports" not in init, "l'initialiseur n'expose aucun port"
        assert "healthcheck" not in init, "un composant qui sort n'a pas de healthcheck"

    def test_initialiser_owns_the_media_volume(self, compose: dict[str, Any]) -> None:
        init = _service(compose, INIT_SERVICE)
        mounts = [str(entry) for entry in init.get("volumes", [])]
        assert f"{MEDIA_VOLUME}:{MEDIA_ROOT}" in mounts

    def test_initialiser_targets_only_the_media_root(self, compose: dict[str, Any]) -> None:
        command = _command_text(_service(compose, INIT_SERVICE))
        assert MEDIA_ROOT in command, "la cible doit être explicite, pas déduite"
        for forbidden in (" / ", "/var ", "/app", "/tmp "):
            assert forbidden not in command, f"cible trop large dans l'initialiseur : {forbidden!r}"

    def test_initialiser_derives_ownership_from_the_image_user(
        self, compose: dict[str, Any]
    ) -> None:
        """Aucun UID magique : l'appartenance est lue depuis l'utilisateur de l'image."""
        command = _command_text(_service(compose, INIT_SERVICE))
        assert f"id -u {APP_USER}" in command and f"id -g {APP_USER}" in command, (
            "l'initialiseur doit dériver UID/GID de l'utilisateur applicatif de l'image "
            "pour qu'un changement d'image ne crée pas de dérive silencieuse"
        )

    def test_initialiser_never_opens_permissions_widely(self, compose: dict[str, Any]) -> None:
        command = _command_text(_service(compose, INIT_SERVICE))
        assert "777" not in command, "chmod 777 interdit"
        assert "chmod -R" not in command, "chmod récursif interdit"
        assert "chown -R /" not in command, "chown récursif sur une racine large interdit"

    def test_initialiser_fails_closed(self, compose: dict[str, Any]) -> None:
        command = _command_text(_service(compose, INIT_SERVICE))
        assert "set -e" in command, (
            "l'initialiseur doit s'arrêter au premier échec plutôt que sortir 0 en silence"
        )
        assert "||" not in command, "aucun repli silencieux dans l'initialiseur"


class TestQaBackendStartupOrdering:
    def test_backend_waits_for_a_successful_initialisation(self, compose: dict[str, Any]) -> None:
        depends = _service(compose, BACKEND_SERVICE).get("depends_on", {})
        assert INIT_SERVICE in depends, "le backend doit dépendre de l'initialiseur du volume"
        condition = depends[INIT_SERVICE]
        assert isinstance(condition, dict)
        assert condition.get("condition") == "service_completed_successfully", (
            "le backend ne doit démarrer qu'après la réussite de l'initialisation"
        )

    def test_backend_still_waits_for_its_datastores(self, compose: dict[str, Any]) -> None:
        depends = _service(compose, BACKEND_SERVICE).get("depends_on", {})
        assert depends.get("postgres-qa", {}).get("condition") == "service_healthy"
        assert depends.get("redis-qa", {}).get("condition") == "service_healthy"

class TestQaHostPortsAreLoopbackOnly:
    """Les ports hotes QA ne doivent etre joignables que depuis le poste.

    Sans adresse de bind explicite, Docker publie sur ``0.0.0.0``. Mesure faite
    sur Wi-Fi public : ``0.0.0.0:5455``, ``0.0.0.0:6399`` et ``0.0.0.0:8010``
    etaient publies sur toutes les interfaces, avec deux regles pare-feu
    entrantes « Docker Desktop Backend » actives sur le profil Public. Or ce
    fichier contient les identifiants PostgreSQL QA en clair et le Redis QA n'a
    aucune authentification : l'exposition reseau etait donc directement
    exploitable par n'importe quel hote du meme reseau.

    La garde porte sur TOUS les services, pas seulement les trois connus : une
    publication ajoutee plus tard sans prefixe serait sinon exposee en silence.
    """

    def test_every_published_port_binds_loopback(self, compose: dict[str, Any]) -> None:
        offenders: list[str] = []
        for name, service in compose["services"].items():
            for mapping in service.get("ports") or []:
                if not str(mapping).startswith("127.0.0.1:"):
                    offenders.append(f"{name} -> {mapping}")
        assert not offenders, (
            "publication(s) QA exposee(s) hors du poste : "
            + ", ".join(offenders)
            + " — prefixer par 127.0.0.1: "
        )

    def test_the_expected_qa_ports_remain_published_locally(
        self, compose: dict[str, Any]
    ) -> None:
        expected = {
            "postgres-qa": "127.0.0.1:5455:5432",
            "redis-qa": "127.0.0.1:6399:6379",
            BACKEND_SERVICE: "127.0.0.1:8010:8000",
        }
        for name, mapping in expected.items():
            ports = [str(entry) for entry in _service(compose, name).get("ports") or []]
            assert mapping in ports, (
                f"{name} doit rester joignable en local via {mapping} ; trouve : {ports}"
            )
