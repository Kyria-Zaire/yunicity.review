"""Bootstrap privilégié du volume média : détection, préparation, abandon des privilèges.

Ces tests ne changent JAMAIS l'identité du processus pytest : `setgroups`, `setgid`,
`setuid`, `chown`, la lecture de `/proc/self/mountinfo` et l'euid courant passent tous
par des indirections du module, remplacées ici. Ce qui est vérifié est donc la SÉQUENCE
et ses refus, pas l'effet système — lequel est prouvé par le test d'intégration Docker.
"""

from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path

import pytest
from app.core.media_root import CANONICAL_MEDIA_ROOT, MEDIA_SUBDIRECTORIES
from app.runtime import unified_process, volume_bootstrap
from app.runtime.volume_bootstrap import (
    AppIdentity,
    VolumeBootstrapError,
    align_process_environment,
    assert_media_volume_mounted,
    bootstrap_media_volume,
    chown_targets,
    drop_privileges,
    prepare_media_volume,
    resolve_app_identity,
)

APP_UID = 10001
APP_GID = 10001

MEDIA_ROOT = Path(CANONICAL_MEDIA_ROOT)

APP_IDENTITY = AppIdentity(name="app", uid=APP_UID, gid=APP_GID, home="/app")

#: Lignes `mountinfo` réalistes : le 5e champ porte le point de montage.
_MOUNTINFO_WITH_VOLUME = (
    "24 30 0:22 / / rw,relatime shared:1 - overlay overlay rw\n"
    f"31 24 259:1 /vol {CANONICAL_MEDIA_ROOT} rw,relatime shared:2 - ext4 /dev/nvme0 rw\n"
)
_MOUNTINFO_WITHOUT_VOLUME = "24 30 0:22 / / rw,relatime shared:1 - overlay overlay rw\n"


class _Recorder:
    """Journal ordonné des appels système simulés."""

    def __init__(self) -> None:
        self.order: list[str] = []
        self.chowned: list[str] = []
        self.groups: list[list[int]] = []
        self.gids: list[int] = []
        self.uids: list[int] = []


@pytest.fixture
def recorder(monkeypatch: pytest.MonkeyPatch) -> _Recorder:
    log = _Recorder()

    def setgroups(groups: Sequence[int]) -> None:
        log.order.append("setgroups")
        log.groups.append(list(groups))

    def setgid(gid: int) -> None:
        log.order.append("setgid")
        log.gids.append(gid)

    def setuid(uid: int) -> None:
        log.order.append("setuid")
        log.uids.append(uid)

    def chown(path: Path, uid: int, gid: int) -> None:
        log.order.append("chown")
        log.chowned.append(str(path))

    monkeypatch.setattr(volume_bootstrap, "_setgroups", setgroups)
    monkeypatch.setattr(volume_bootstrap, "_setgid", setgid)
    monkeypatch.setattr(volume_bootstrap, "_setuid", setuid)
    monkeypatch.setattr(volume_bootstrap, "_chown", chown)
    monkeypatch.setattr(volume_bootstrap, "effective_ids", lambda: (APP_UID, APP_GID))
    return log


def _mounted(monkeypatch: pytest.MonkeyPatch, mountinfo: str) -> None:
    monkeypatch.setattr(volume_bootstrap, "read_mountinfo", lambda: mountinfo)
    monkeypatch.setattr(volume_bootstrap, "_is_symlink", lambda path: False)
    monkeypatch.setattr(volume_bootstrap, "_realpath", lambda path: CANONICAL_MEDIA_ROOT)


class TestUnprivilegedExecutionIsUntouched:
    def test_a_non_root_process_does_nothing(
        self, monkeypatch: pytest.MonkeyPatch, recorder: _Recorder
    ) -> None:
        """Poste de dev, image locale avec son USER app, CI : comportement inchangé."""
        monkeypatch.setattr(volume_bootstrap, "current_euid", lambda: APP_UID)
        assert bootstrap_media_volume() is False
        assert recorder.order == []

    def test_a_platform_without_euid_does_nothing(
        self, monkeypatch: pytest.MonkeyPatch, recorder: _Recorder
    ) -> None:
        monkeypatch.setattr(volume_bootstrap, "current_euid", lambda: None)
        assert bootstrap_media_volume() is False
        assert recorder.order == []


class TestVolumeDetection:
    def test_a_real_mount_point_is_accepted(self, monkeypatch: pytest.MonkeyPatch) -> None:
        _mounted(monkeypatch, _MOUNTINFO_WITH_VOLUME)
        assert_media_volume_mounted(MEDIA_ROOT)

    def test_a_directory_that_is_not_a_mount_point_is_refused(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Un répertoire d'image existe et est lisible : c'est le cas à refuser."""
        _mounted(monkeypatch, _MOUNTINFO_WITHOUT_VOLUME)
        with pytest.raises(VolumeBootstrapError, match="MEDIA_VOLUME_NOT_MOUNTED"):
            assert_media_volume_mounted(MEDIA_ROOT)

    def test_a_symlinked_root_is_refused(self, monkeypatch: pytest.MonkeyPatch) -> None:
        _mounted(monkeypatch, _MOUNTINFO_WITH_VOLUME)
        monkeypatch.setattr(volume_bootstrap, "_is_symlink", lambda path: True)
        with pytest.raises(VolumeBootstrapError, match="MEDIA_ROOT_IS_SYMLINK"):
            assert_media_volume_mounted(MEDIA_ROOT)

    def test_a_root_resolving_elsewhere_is_refused(self, monkeypatch: pytest.MonkeyPatch) -> None:
        _mounted(monkeypatch, _MOUNTINFO_WITH_VOLUME)
        monkeypatch.setattr(volume_bootstrap, "_realpath", lambda path: "/srv/elsewhere")
        with pytest.raises(VolumeBootstrapError, match="MEDIA_ROOT_RESOLVES_ELSEWHERE"):
            assert_media_volume_mounted(MEDIA_ROOT)

    def test_another_root_than_the_canonical_one_is_refused(self) -> None:
        with pytest.raises(VolumeBootstrapError, match="MEDIA_ROOT_NOT_CANONICAL"):
            assert_media_volume_mounted(Path("/data"))

    def test_mount_points_come_from_the_fifth_mountinfo_field(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Le champ 5 porte le point de montage ; l'octal y est échappé."""
        monkeypatch.setattr(
            volume_bootstrap,
            "read_mountinfo",
            lambda: "31 24 259:1 / /mnt/with\\040space rw - ext4 /dev/x rw\n",
        )
        assert "/mnt/with space" in volume_bootstrap.mounted_paths()


class TestApplicationIdentity:
    def test_an_unknown_application_user_is_refused(self) -> None:
        with pytest.raises(VolumeBootstrapError, match="APP_USER_NOT_FOUND"):
            resolve_app_identity("utilisateur-qui-n-existe-pas-dans-l-image")

    def test_the_identity_comes_from_the_system(self) -> None:
        """Aucun uid recopié depuis le Dockerfile : la source est `pwd`."""
        pwd = pytest.importorskip("pwd", reason="identite POSIX absente de cette plateforme")
        current = pwd.getpwuid(0)
        identity = resolve_app_identity(current.pw_name)
        assert (identity.uid, identity.gid) == (current.pw_uid, current.pw_gid)
        assert identity.home == current.pw_dir


class TestTargetedPreparation:
    def test_only_the_root_and_its_three_domains_are_chowned(
        self, tmp_path: Path, recorder: _Recorder
    ) -> None:
        root = tmp_path / "media"
        root.mkdir()

        prepare_media_volume(root, APP_UID, APP_GID)

        assert recorder.chowned == [str(path) for path in chown_targets(root)]
        assert len(recorder.chowned) == 4

    def test_the_three_domain_directories_are_created(
        self, tmp_path: Path, recorder: _Recorder
    ) -> None:
        root = tmp_path / "media"
        root.mkdir()
        prepare_media_volume(root, APP_UID, APP_GID)
        for name in MEDIA_SUBDIRECTORIES:
            assert (root / name).is_dir()

    def test_existing_media_files_are_never_touched(
        self, tmp_path: Path, recorder: _Recorder
    ) -> None:
        """Pas de récursion : un volume rempli ne se réattribue pas à chaque démarrage."""
        root = tmp_path / "media"
        (root / "local-video" / "reims").mkdir(parents=True)
        existing = root / "local-video" / "reims" / "processed.mp4"
        existing.write_bytes(b"video")
        lost_and_found = root / "lost+found"
        lost_and_found.mkdir()

        prepare_media_volume(root, APP_UID, APP_GID)

        assert str(existing) not in recorder.chowned
        assert str(lost_and_found) not in recorder.chowned
        assert existing.read_bytes() == b"video"

    def test_a_failing_chown_refuses_the_startup(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        def refuse(path: Path, uid: int, gid: int) -> None:
            raise PermissionError(13, "Permission denied")

        monkeypatch.setattr(volume_bootstrap, "_chown", refuse)
        root = tmp_path / "media"
        root.mkdir()
        with pytest.raises(VolumeBootstrapError, match="MEDIA_CHOWN_FAILED"):
            prepare_media_volume(root, APP_UID, APP_GID)


class TestPrivilegeDrop:
    def test_the_order_is_setgroups_then_setgid_then_setuid(self, recorder: _Recorder) -> None:
        """Abandonner l'uid en premier retirerait le droit de changer de groupe."""
        drop_privileges(APP_UID, APP_GID)
        assert recorder.order == ["setgroups", "setgid", "setuid"]

    def test_supplementary_groups_are_reduced_to_the_application_group(
        self, recorder: _Recorder
    ) -> None:
        drop_privileges(APP_UID, APP_GID)
        assert recorder.groups == [[APP_GID]]

    def test_the_target_identity_is_the_application_user(self, recorder: _Recorder) -> None:
        drop_privileges(APP_UID, APP_GID)
        assert recorder.gids == [APP_GID]
        assert recorder.uids == [APP_UID]

    @pytest.mark.parametrize("failing", ["_setgroups", "_setgid", "_setuid"])
    def test_a_failing_step_refuses_the_startup(
        self, monkeypatch: pytest.MonkeyPatch, recorder: _Recorder, failing: str
    ) -> None:
        def refuse(*_args: object) -> None:
            raise PermissionError(1, "Operation not permitted")

        monkeypatch.setattr(volume_bootstrap, failing, refuse)
        with pytest.raises(VolumeBootstrapError, match="PRIVILEGE_DROP_FAILED"):
            drop_privileges(APP_UID, APP_GID)

    def test_an_unverified_drop_refuses_the_startup(
        self, monkeypatch: pytest.MonkeyPatch, recorder: _Recorder
    ) -> None:
        """Le processus prétend avoir changé d'identité : on ne le croit pas sur parole."""
        monkeypatch.setattr(volume_bootstrap, "effective_ids", lambda: (0, 0))
        with pytest.raises(VolumeBootstrapError, match="PRIVILEGE_DROP_UNVERIFIED"):
            drop_privileges(APP_UID, APP_GID)


class TestBootstrapSequence:
    def test_a_root_process_with_a_real_volume_prepares_then_drops(
        self, monkeypatch: pytest.MonkeyPatch, recorder: _Recorder, tmp_path: Path
    ) -> None:
        monkeypatch.setattr(volume_bootstrap, "current_euid", lambda: 0)
        monkeypatch.setattr(volume_bootstrap, "assert_media_volume_mounted", lambda root: None)
        monkeypatch.setattr(volume_bootstrap, "resolve_app_identity", lambda: APP_IDENTITY)
        root = tmp_path / "media"
        root.mkdir()

        assert bootstrap_media_volume(root) is True

        # Les quatre chown précèdent l'abandon : préparer après aurait échoué.
        assert recorder.order == ["chown"] * 4 + ["setgroups", "setgid", "setuid"]

    def test_a_root_process_without_volume_refuses_before_anything_else(
        self, monkeypatch: pytest.MonkeyPatch, recorder: _Recorder
    ) -> None:
        monkeypatch.setattr(volume_bootstrap, "current_euid", lambda: 0)
        _mounted(monkeypatch, _MOUNTINFO_WITHOUT_VOLUME)

        with pytest.raises(VolumeBootstrapError, match="MEDIA_VOLUME_NOT_MOUNTED"):
            bootstrap_media_volume()
        assert recorder.order == []


class TestSupervisorStartsOnlyAfterTheDrop:
    def test_children_are_built_after_the_bootstrap(self, monkeypatch: pytest.MonkeyPatch) -> None:
        order: list[str] = []

        def bootstrap() -> bool:
            order.append("bootstrap")
            return True

        def build() -> list[unified_process.ChildSpec]:
            order.append("build_children")
            return []

        def run(_self: unified_process.Supervisor) -> int:
            order.append("run")
            return 0

        monkeypatch.setattr(unified_process, "bootstrap_media_volume", bootstrap)
        monkeypatch.setattr(unified_process, "build_default_children", build)
        monkeypatch.setattr(unified_process.Supervisor, "run", run)

        assert unified_process.main() == 0
        assert order == ["bootstrap", "build_children", "run"]

    def test_a_refused_bootstrap_exits_non_zero_without_starting_anything(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        started: list[str] = []

        def refuse() -> bool:
            raise VolumeBootstrapError("MEDIA_VOLUME_NOT_MOUNTED: test")

        def build() -> list[unified_process.ChildSpec]:
            started.append("build")
            return []

        monkeypatch.setattr(unified_process, "bootstrap_media_volume", refuse)
        monkeypatch.setattr(unified_process, "build_default_children", build)

        assert unified_process.main() == 1
        assert started == []


class TestEnvironmentAlignment:
    """`setuid` ne touche pas l'environnement : HOME resterait celui de root."""

    def test_home_and_user_follow_the_application_identity(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("HOME", "/root")
        monkeypatch.setenv("USER", "root")
        monkeypatch.delenv("LOGNAME", raising=False)

        align_process_environment(APP_IDENTITY)

        import os

        assert os.environ["HOME"] == APP_IDENTITY.home
        assert os.environ["USER"] == APP_IDENTITY.name
        assert os.environ["LOGNAME"] == APP_IDENTITY.name

    def test_the_bootstrap_realigns_the_environment_after_the_drop(
        self, monkeypatch: pytest.MonkeyPatch, recorder: _Recorder, tmp_path: Path
    ) -> None:
        """Un HOME illisible faisait échouer asyncpg sur $HOME/.postgresql/postgresql.key."""
        monkeypatch.setenv("HOME", "/root")
        monkeypatch.setattr(volume_bootstrap, "current_euid", lambda: 0)
        monkeypatch.setattr(volume_bootstrap, "assert_media_volume_mounted", lambda root: None)
        monkeypatch.setattr(volume_bootstrap, "resolve_app_identity", lambda: APP_IDENTITY)
        root = tmp_path / "media"
        root.mkdir()

        assert bootstrap_media_volume(root) is True

        import os

        assert os.environ["HOME"] == APP_IDENTITY.home
