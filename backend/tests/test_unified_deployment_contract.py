r"""Contrat de déploiement du service unifié : `railway.unified.toml` + `Dockerfile`.

Ces deux fichiers portent des préconditions que rien n'exécute en CI : un volume à
monter, un opt-in à poser, un utilisateur non privilégié à conserver. Un défaut y est
donc silencieux jusqu'au déploiement — c'est exactement ce qui s'est produit deux fois :

1. `railway.unified.toml` documentait sept variables média mais pas
   `MANAGED_PERSISTENT_MEDIA_ENABLED`. Or Railway injecte des variables `RAILWAY_*`,
   donc la politique stricte est armée en production et trois gardes refusent le backend
   filesystem sans cet opt-in. Suivre la documentation à la lettre produisait un
   crash-loop.
2. Le `Dockerfile` portait les deux caractères littéraux `\` et `n` au lieu d'une vraie
   continuation de ligne. Le shell les lisait comme l'argument `n`, donc `mkdir` créait
   un répertoire parasite `/app/n`. Le `chown` s'exécutait quand même — tout tenait sur
   une seule ligne physique — ce qui rendait le défaut invisible.

Les tests lisent des FICHIERS, jamais le daemon Docker ni l'API Railway : ils restent un
contrat statique, exécutable en CI comme dans le conteneur backend.
"""

from __future__ import annotations

import tomllib
from pathlib import Path

import pytest
from app.core.media_root import CANONICAL_MEDIA_ROOT, MEDIA_SUBDIRECTORIES

RAILWAY_CONFIG_FILENAME = "railway.unified.toml"
DOCKERFILE_FILENAME = "Dockerfile"

#: Opt-in sans lequel le service unifié refuse de démarrer sur un runtime managé.
OPT_IN_VARIABLE = "MANAGED_PERSISTENT_MEDIA_ENABLED"

#: Démarrage privilégié, le temps d'initialiser le volume — puis abandon irréversible.
RUN_UID_VARIABLE = "RAILWAY_RUN_UID"

APP_USER = "app"
APP_UID = "10001"
ROOT_IDENTITIES = frozenset({"0", "root", "0:0", "root:root"})


def _locate(filename: str) -> Path:
    """Remonte l'arborescence jusqu'au fichier.

    Le dépôt place ces fichiers dans `backend/` ; le conteneur les expose à la racine de
    `/app`. Remonter les parents couvre les deux sans chemin codé en dur.
    """
    for candidate in Path(__file__).resolve().parents:
        found = candidate / filename
        if found.is_file():
            return found
    return Path("/") / filename


def _instructions(dockerfile_text: str) -> list[str]:
    """Une instruction Dockerfile = une ligne logique, continuations `\\` recollées."""
    instructions: list[str] = []
    buffer = ""
    for raw in dockerfile_text.splitlines():
        stripped = raw.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if stripped.endswith("\\"):
            buffer += stripped[:-1].strip() + " "
            continue
        instructions.append((buffer + stripped).strip())
        buffer = ""
    if buffer:
        instructions.append(buffer.strip())
    return instructions


@pytest.fixture(scope="module")
def railway_config_text() -> str:
    path = _locate(RAILWAY_CONFIG_FILENAME)
    assert path.is_file(), f"{RAILWAY_CONFIG_FILENAME} introuvable : {path}"
    return path.read_text(encoding="utf-8")


@pytest.fixture(scope="module")
def railway_deploy(railway_config_text: str) -> dict[str, object]:
    parsed: dict[str, object] = tomllib.loads(railway_config_text)
    deploy = parsed.get("deploy")
    assert isinstance(deploy, dict), "`railway.unified.toml` doit porter une table [deploy]"
    return deploy


@pytest.fixture(scope="module")
def railway_tables(railway_config_text: str) -> set[str]:
    parsed: dict[str, object] = tomllib.loads(railway_config_text)
    return set(parsed)


@pytest.fixture(scope="module")
def dockerfile_text() -> str:
    path = _locate(DOCKERFILE_FILENAME)
    assert path.is_file(), f"{DOCKERFILE_FILENAME} introuvable : {path}"
    return path.read_text(encoding="utf-8")


class TestRailwayConfigDocumentsItsPreconditions:
    def test_the_persistent_media_opt_in_is_documented(self, railway_config_text: str) -> None:
        """Sans cet opt-in le service boucle au démarrage : l'omettre est un incident."""
        lines = [line for line in railway_config_text.splitlines() if OPT_IN_VARIABLE in line]
        assert lines, f"{OPT_IN_VARIABLE} doit être documentée dans {RAILWAY_CONFIG_FILENAME}"
        assert any("true" in line for line in lines), (
            f"{OPT_IN_VARIABLE} doit être documentée avec la valeur attendue (true)"
        )

    def test_the_privileged_bootstrap_variable_is_documented(
        self, railway_config_text: str
    ) -> None:
        """Sans `RAILWAY_RUN_UID=0`, le volume reste root:root et rien ne démarre."""
        lines = [line for line in railway_config_text.splitlines() if RUN_UID_VARIABLE in line]
        assert lines, f"{RUN_UID_VARIABLE} doit être documentée dans {RAILWAY_CONFIG_FILENAME}"
        assert any("0" in line for line in lines), (
            f"{RUN_UID_VARIABLE} doit être documentée avec la valeur attendue (0)"
        )

    def test_the_privilege_drop_is_explained_next_to_it(
        self, railway_config_text: str
    ) -> None:
        """Une variable qui démarre en root ne se documente pas sans sa contrepartie."""
        lowered = railway_config_text.lower()
        assert "abandonne" in lowered and "privilège" in lowered, (
            "la documentation doit dire que les privilèges sont abandonnés"
        )
        assert "jamais en root" in lowered, (
            "la documentation doit dire que les processus applicatifs ne tournent pas en root"
        )

    def test_the_canonical_mount_path_is_documented(self, railway_config_text: str) -> None:
        assert "Mount path" in railway_config_text, "le point de montage doit être nommé"
        assert CANONICAL_MEDIA_ROOT in railway_config_text, (
            f"le montage doit être documenté sur la racine canonique {CANONICAL_MEDIA_ROOT}"
        )

    def test_the_volume_is_required_before_the_first_deployment(
        self, railway_config_text: str
    ) -> None:
        lowered = railway_config_text.lower()
        assert "avant le premier déploiement" in lowered, (
            "l'attachement du volume doit être documenté comme préalable au déploiement"
        )

    def test_no_environment_variable_is_declared_in_the_file(
        self, railway_tables: set[str]
    ) -> None:
        """Railway n'applique aucune variable venant d'un fichier de config.

        En déclarer une ici la rendrait fictive : elle serait lue par un humain et jamais
        par la plateforme. Les variables se posent sur le service, ce fichier documente.
        """
        assert railway_tables == {"deploy"}, (
            "seule la table [deploy] est appliquée par Railway ; tables trouvées : "
            f"{sorted(railway_tables)}"
        )


class TestRailwayConfigKeepsItsRuntimeContract:
    def test_the_supervisor_is_the_start_command(self, railway_deploy: dict[str, object]) -> None:
        assert railway_deploy.get("startCommand") == "python -m app.runtime.unified_process"

    def test_the_healthcheck_targets_the_api(self, railway_deploy: dict[str, object]) -> None:
        assert railway_deploy.get("healthcheckPath") == "/api/v1/health"

    def test_the_service_restarts_only_on_failure(self, railway_deploy: dict[str, object]) -> None:
        assert railway_deploy.get("restartPolicyType") == "ON_FAILURE"

    def test_migrations_stay_a_pre_deploy_step(self, railway_deploy: dict[str, object]) -> None:
        """Un échec de migration doit bloquer le déploiement, pas démarrer le service."""
        commands = railway_deploy.get("preDeployCommand")
        assert isinstance(commands, list), "preDeployCommand doit rester une liste"
        assert "alembic upgrade head" in " ".join(str(part) for part in commands)


class TestDockerfileCreatesTheMediaRootWithoutStrayDirectory:
    def test_no_literal_backslash_n_remains(self, dockerfile_text: str) -> None:
        r"""`\n` littéral = continuation cassée : l'argument suivant part dans le WORKDIR."""
        assert "\\n" not in dockerfile_text, (
            "continuation de ligne cassée : le Dockerfile contient les caractères "
            "littéraux « \\n » au lieu d'un retour à la ligne"
        )

    def test_the_media_root_and_its_subdirectories_are_created(
        self, dockerfile_text: str
    ) -> None:
        instruction = self._media_root_instruction(dockerfile_text)
        for subdirectory in MEDIA_SUBDIRECTORIES:
            assert f"{CANONICAL_MEDIA_ROOT}/{subdirectory}" in instruction, (
                f"le sous-répertoire média « {subdirectory} » doit être créé dans l'image"
            )

    def test_no_stray_relative_directory_is_created(self, dockerfile_text: str) -> None:
        """Tout argument de `mkdir` doit être un chemin média absolu — sinon `/app/n`."""
        instruction = self._media_root_instruction(dockerfile_text)
        arguments = instruction.split("&&")[0].split()
        targets = [token for token in arguments[2:] if not token.startswith("-")]
        assert targets, "l'instruction doit nommer au moins un répertoire"
        offenders = [
            token for token in targets if not token.startswith(f"{CANONICAL_MEDIA_ROOT}/")
        ]
        assert not offenders, (
            f"argument(s) hors de {CANONICAL_MEDIA_ROOT} dans le mkdir média : {offenders}"
        )

    def test_the_media_root_is_owned_by_the_application_user(
        self, dockerfile_text: str
    ) -> None:
        instruction = self._media_root_instruction(dockerfile_text)
        assert f"chown -R {APP_USER}:{APP_USER} /data" in instruction, (
            "le volume doit arriver possédé par l'utilisateur applicatif, sinon le "
            "conteneur non privilégié ne peut pas y écrire"
        )

    @staticmethod
    def _media_root_instruction(dockerfile_text: str) -> str:
        matches = [
            instruction
            for instruction in _instructions(dockerfile_text)
            if instruction.startswith("RUN ") and f"mkdir -p {CANONICAL_MEDIA_ROOT}" in instruction
        ]
        assert len(matches) == 1, (
            f"une seule instruction doit créer {CANONICAL_MEDIA_ROOT} ; trouvé : {len(matches)}"
        )
        return matches[0]


class TestDockerfileRunsUnprivileged:
    def test_the_final_user_is_the_unprivileged_application_user(
        self, dockerfile_text: str
    ) -> None:
        users = [
            instruction.split(maxsplit=1)[1].strip()
            for instruction in _instructions(dockerfile_text)
            if instruction.startswith("USER ")
        ]
        assert users, "le Dockerfile doit basculer sur un utilisateur non privilégié"
        final_user = users[-1]
        assert final_user.lower() not in ROOT_IDENTITIES, (
            f"le conteneur final tourne en root (USER {final_user})"
        )
        assert final_user == APP_USER

    def test_the_application_user_keeps_fixed_ids(self, dockerfile_text: str) -> None:
        """Un uid dynamique déplacé par un rebuild rendrait illisible un volume peuplé."""
        assert f"ARG APP_UID={APP_UID}" in dockerfile_text
        assert f"ARG APP_GID={APP_UID}" in dockerfile_text
