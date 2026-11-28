"""Politique de la racine media : opt-in, racine canonique, confinement, symlinks.

La posture C3.1-R1D interdisait le disque local sur un runtime manage parce qu'il y
etait ephemere. Un volume persistant retire ce motif -- pour CE volume, pas pour un
chemin quelconque. Ces tests verrouillent l'ouverture etroite : six conditions, et le
refus par defaut.
"""

from __future__ import annotations

import os
import tempfile
import uuid
from pathlib import Path

import pytest
from app.core.media_root import (
    CANONICAL_MEDIA_ROOT,
    MEDIA_SUBDIRECTORIES,
    MediaRootUnavailableError,
    check_managed_media_policy,
    is_managed_cloud_runtime,
    prepare_media_root,
)
from app.core.profile_media_constants import ProfileMediaKind
from app.services.local_video.storage_keys import (
    build_processed_key,
    build_source_upload_key,
    build_thumbnail_key,
)
from app.services.profile_media.storage_keys import build_profile_media_key
from app.services.story_media.storage_keys import build_story_media_key

DEPLOYED = ["recette", "preprod", "prod"]


def _local(tmp_path: Path, name: str = "media") -> Path:
    """Racine utilisable hors runtime manage (poste de dev, CI)."""
    return prepare_media_root(
        str(tmp_path / name), app_env="dev", opt_in=False, managed_cloud=False
    )


class TestManagedRuntimeDetection:
    def test_railway_variables_mark_a_managed_runtime(self) -> None:
        assert is_managed_cloud_runtime({"RAILWAY_SERVICE_ID": "abc"}) is True
        assert is_managed_cloud_runtime({"railway_project_id": "abc"}) is True

    def test_a_plain_host_is_not_managed(self) -> None:
        assert is_managed_cloud_runtime({"HOME": "/root", "PATH": "/usr/bin"}) is False


class TestOptInIsRequired:
    @pytest.mark.parametrize("app_env", DEPLOYED)
    def test_filesystem_without_opt_in_is_refused_in_deployed_envs(self, app_env: str) -> None:
        with pytest.raises(MediaRootUnavailableError, match="MANAGED_PERSISTENT_MEDIA_ENABLED"):
            check_managed_media_policy(
                CANONICAL_MEDIA_ROOT, app_env=app_env, opt_in=False, managed_cloud=False
            )

    def test_railway_without_opt_in_is_refused_even_in_dev(self) -> None:
        """Le runtime manage prime sur APP_ENV : c'est le disque qui est ephemere."""
        with pytest.raises(MediaRootUnavailableError, match="MANAGED_PERSISTENT_MEDIA_ENABLED"):
            check_managed_media_policy(
                CANONICAL_MEDIA_ROOT, app_env="dev", opt_in=False, managed_cloud=True
            )

    def test_the_default_is_refusal(self) -> None:
        """Un service qui oublierait l'opt-in doit echouer, pas ecrire dans le vide."""
        with pytest.raises(MediaRootUnavailableError):
            check_managed_media_policy(
                CANONICAL_MEDIA_ROOT, app_env="prod", opt_in=False, managed_cloud=True
            )


class TestCanonicalRoot:
    def test_opt_in_with_a_relative_path_is_refused(self) -> None:
        with pytest.raises(MediaRootUnavailableError, match="absolu"):
            check_managed_media_policy(
                "uploads", app_env="prod", opt_in=True, managed_cloud=True
            )

    @pytest.mark.parametrize(
        "outside",
        ["/srv/media", "/data/media-2", "/data", "/tmp/yunicity", "/data/media/sub"],
    )
    def test_opt_in_outside_the_canonical_root_is_refused(self, outside: str) -> None:
        """Ouvrir la posture ne veut pas dire autoriser n'importe quel chemin Railway."""
        with pytest.raises(MediaRootUnavailableError, match=CANONICAL_MEDIA_ROOT):
            check_managed_media_policy(
                outside, app_env="prod", opt_in=True, managed_cloud=True
            )

    def test_opt_in_with_parent_traversal_is_refused(self) -> None:
        with pytest.raises(MediaRootUnavailableError, match=r"\.\."):
            check_managed_media_policy(
                "/data/../data/media", app_env="prod", opt_in=True, managed_cloud=True
            )

    def test_the_canonical_root_with_opt_in_passes_the_policy(self) -> None:
        """Seule combinaison acceptee -- verifiee sans toucher au disque, donc portable."""
        check_managed_media_policy(
            CANONICAL_MEDIA_ROOT, app_env="prod", opt_in=True, managed_cloud=True
        )


class TestWritableProbeAndTree:
    def test_creates_the_three_domain_subdirectories(self, tmp_path: Path) -> None:
        root = _local(tmp_path)
        assert root.is_dir()
        for name in MEDIA_SUBDIRECTORIES:
            assert (root / name).is_dir(), f"sous-repertoire manquant : {name}"

    def test_is_idempotent_on_an_already_populated_volume(self, tmp_path: Path) -> None:
        root = _local(tmp_path)
        (root / "local-video" / "keep.txt").write_text("donnees", encoding="utf-8")
        again = _local(tmp_path)
        assert again == root
        assert (root / "local-video" / "keep.txt").read_text(encoding="utf-8") == "donnees"

    def test_the_probe_leaves_nothing_behind(self, tmp_path: Path) -> None:
        root = _local(tmp_path)
        assert not (root / ".yunicity-write-probe").exists()

    def test_an_unusable_root_fails_loudly_on_a_managed_runtime(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Sonde d'ecriture en echec + environnement deploye = refus de demarrer.

        On deplace la racine canonique sur le tmp du test : sans cela, la regle
        canonique refuserait avant la sonde et on testerait la mauvaise garde.
        """
        blocker = tmp_path / "blocker"
        blocker.write_text("fichier, pas repertoire", encoding="utf-8")
        target = blocker / "media"
        # La regle canonique est couverte par TestCanonicalRoot ; on la neutralise ici
        # pour isoler la SONDE, seule chose que ce test doit prouver.
        monkeypatch.setattr(
            "app.core.media_root.check_managed_media_policy",
            lambda *a, **k: None,
        )

        with pytest.raises(MediaRootUnavailableError, match="inutilisable"):
            prepare_media_root(str(target), app_env="prod", opt_in=True, managed_cloud=False)

    def test_dev_only_warns(self, tmp_path: Path) -> None:
        blocker = tmp_path / "blocker"
        blocker.write_text("fichier", encoding="utf-8")
        assert prepare_media_root(
            str(blocker / "media"), app_env="dev", opt_in=False, managed_cloud=False
        ) is not None


class TestSymlinkRefusal:
    def test_an_outbound_symlinked_subdirectory_is_refused(self, tmp_path: Path) -> None:
        """Un lien sortant ferait ecrire les medias hors du volume, sans que ca se voie."""
        outside = tmp_path / "ailleurs"
        outside.mkdir()
        root = tmp_path / "media"
        root.mkdir()
        try:
            (root / "stories").symlink_to(outside, target_is_directory=True)
        except (OSError, NotImplementedError):
            pytest.skip("creation de symlink non permise sur cette plateforme")

        # app_env="dev" : la regle canonique se declencherait AVANT le symlink et
        # masquerait ce qu'on veut prouver ici. Le refus de symlink, lui, s'applique
        # dans tous les environnements.
        with pytest.raises(MediaRootUnavailableError, match="lien symbolique"):
            prepare_media_root(str(root), app_env="dev", opt_in=False, managed_cloud=False)

    def test_an_inbound_symlink_is_tolerated(self, tmp_path: Path) -> None:
        root = tmp_path / "media"
        (root / "reel").mkdir(parents=True)
        try:
            (root / "stories").symlink_to(root / "reel", target_is_directory=True)
        except (OSError, NotImplementedError):
            pytest.skip("creation de symlink non permise sur cette plateforme")

        assert prepare_media_root(
            str(root), app_env="dev", opt_in=False, managed_cloud=False
        ).is_dir()


class TestSharedRootBetweenApiAndWorker:
    def test_api_and_worker_resolve_the_same_root(self, tmp_path: Path) -> None:
        assert _local(tmp_path, "data").resolve() == _local(tmp_path, "data").resolve()

    def test_a_file_written_by_one_is_visible_to_the_other(self, tmp_path: Path) -> None:
        api_root = _local(tmp_path, "data")
        key = build_source_upload_key(city_slug="reims", video_id=uuid.uuid4(), ext=".mp4")
        target = api_root / key
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(b"octets de la video")
        assert (_local(tmp_path, "data") / key).read_bytes() == b"octets de la video"

    def test_the_three_domains_stay_confined_in_their_own_subtree(self, tmp_path: Path) -> None:
        root = _local(tmp_path)
        user_id, media_id, video_id = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
        keys = {
            "local-video": build_processed_key(city_slug="reims", video_id=video_id),
            "profiles": build_profile_media_key(user_id, ProfileMediaKind.AVATAR, ".jpg"),
            "stories": build_story_media_key(user_id, media_id, ".jpg"),
        }
        for expected_prefix, key in keys.items():
            assert key.startswith(f"{expected_prefix}/"), key
            resolved = (root / key).resolve()
            assert resolved.relative_to(root.resolve()).parts[0] == expected_prefix
        assert len({(root / k).resolve() for k in keys.values()}) == 3

    def test_thumbnail_lands_next_to_its_video(self, tmp_path: Path) -> None:
        root = _local(tmp_path)
        video_id = uuid.uuid4()
        processed = (root / build_processed_key(city_slug="reims", video_id=video_id)).resolve()
        thumb = (root / build_thumbnail_key(city_slug="reims", video_id=video_id)).resolve()
        assert thumb.parent == processed.parent


class TestTemporaryFilesStayOutsideTheVolume:
    def test_ffmpeg_scratch_is_not_inside_the_media_root(self, tmp_path: Path) -> None:
        root = _local(tmp_path, "data")
        with tempfile.TemporaryDirectory(prefix="yunicity-local-video-") as scratch:
            with pytest.raises(ValueError):
                Path(scratch).resolve().relative_to(root.resolve())

    def test_scratch_directory_is_removed_after_use(self) -> None:
        with tempfile.TemporaryDirectory(prefix="yunicity-local-video-") as scratch:
            path = Path(scratch)
            assert path.is_dir()
        assert not path.exists()


class TestProfileAndStoryStayConfined:
    """L'ouverture de C3.1-R1D vaut pour la racine canonique, et pour elle seule."""

    def test_without_opt_in_the_canonical_root_is_not_allowed(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from app.core.profile_media_policy import allowed_profile_media_roots
        from app.core.story_media_policy import allowed_story_media_roots

        monkeypatch.delenv("MANAGED_PERSISTENT_MEDIA_ENABLED", raising=False)

        assert Path(CANONICAL_MEDIA_ROOT) not in allowed_story_media_roots()
        assert Path(CANONICAL_MEDIA_ROOT) not in allowed_profile_media_roots()

    def test_with_opt_in_the_canonical_root_becomes_allowed(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from app.core.profile_media_policy import allowed_profile_media_roots
        from app.core.story_media_policy import allowed_story_media_roots

        monkeypatch.setenv("MANAGED_PERSISTENT_MEDIA_ENABLED", "true")

        assert Path(CANONICAL_MEDIA_ROOT) in allowed_story_media_roots()
        assert Path(CANONICAL_MEDIA_ROOT) in allowed_profile_media_roots()

    @pytest.mark.parametrize("flag", ["false", "0", "no", "", "maybe"])
    def test_only_a_truthy_opt_in_counts(
        self, monkeypatch: pytest.MonkeyPatch, flag: str
    ) -> None:
        from app.core.media_root import managed_persistent_media_opt_in

        monkeypatch.setenv("MANAGED_PERSISTENT_MEDIA_ENABLED", flag)
        assert managed_persistent_media_opt_in() is False

    # `resolve_*_upload_dir` juge l'absolu avec `Path.is_absolute()`, faux pour "/srv/..."
    # sous Windows : ces deux cas portent sur l'ALLOWLIST, pas sur l'absolu, et sont donc
    # verifies sur POSIX (CI Linux et image Docker).
    @pytest.mark.skipif(os.name == "nt", reason="chemins POSIX absolus requis")
    def test_even_with_opt_in_an_arbitrary_path_is_refused(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Le seul assouplissement est la racine canonique : pas un chemin au choix."""
        from app.core.errors import AppError
        from app.core.story_media_policy import resolve_story_media_upload_dir

        monkeypatch.setenv("MANAGED_PERSISTENT_MEDIA_ENABLED", "true")

        with pytest.raises(AppError, match="autorisé"):
            resolve_story_media_upload_dir("/srv/ailleurs")

    @pytest.mark.skipif(os.name == "nt", reason="chemins POSIX absolus requis")
    def test_the_canonical_root_is_accepted_for_stories_under_opt_in(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from app.core.story_media_policy import resolve_story_media_upload_dir

        monkeypatch.setenv("MANAGED_PERSISTENT_MEDIA_ENABLED", "true")

        assert resolve_story_media_upload_dir(CANONICAL_MEDIA_ROOT) == Path(
            CANONICAL_MEDIA_ROOT
        ).resolve()
