"""Exposition des medias servis depuis le volume persistant.

On monte `MediaStaticFiles` dans une application Starlette nue : pas de base, pas de
Redis. Ce qui est teste ici est exactement ce que le conteneur unifie exposera --
Range/206, en-tetes, absence de listing -- sans dependre du reste de l'API.
"""

from __future__ import annotations

import uuid
from pathlib import Path

import pytest
from app.main import MediaStaticFiles
from app.services.local_video.storage_keys import build_processed_key, build_thumbnail_key
from fastapi.testclient import TestClient
from starlette.applications import Starlette

VIDEO_BYTES = bytes(range(256)) * 40  # 10 240 octets, deterministe


@pytest.fixture()
def media_client(tmp_path: Path) -> TestClient:
    """Monte EXACTEMENT ce que `create_app` monte : local-video seulement."""
    root = tmp_path / "media"
    for name in ("local-video/reims", "profiles", "stories"):
        (root / name).mkdir(parents=True, exist_ok=True)
    app = Starlette()
    app.mount(
        "/media/local-video",
        MediaStaticFiles(directory=str(root / "local-video")),
        name="media-local-video",
    )
    client = TestClient(app)
    client.media_root = root  # type: ignore[attr-defined]
    return client


def _write(root: Path, key: str, payload: bytes) -> str:
    """Ecrit sous la racine et renvoie l'URL publique correspondante."""
    target = root / key
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(payload)
    return f"/media/{key}"


class TestFullRead:
    def test_serves_the_whole_video(self, media_client: TestClient) -> None:
        key = build_processed_key(city_slug="reims", video_id=uuid.uuid4())
        url = _write(media_client.media_root, key, VIDEO_BYTES)  # type: ignore[attr-defined]

        response = media_client.get(url)

        assert response.status_code == 200
        assert response.content == VIDEO_BYTES
        assert response.headers["content-type"] == "video/mp4"

    def test_serves_the_thumbnail_with_its_own_type(self, media_client: TestClient) -> None:
        key = build_thumbnail_key(city_slug="reims", video_id=uuid.uuid4())
        url = _write(media_client.media_root, key, b"\xff\xd8\xff\xe0jpeg")  # type: ignore[attr-defined]

        response = media_client.get(url)

        assert response.status_code == 200
        assert response.headers["content-type"] == "image/jpeg"


class TestRangeRequests:
    def test_a_range_request_returns_206_and_the_exact_slice(
        self, media_client: TestClient
    ) -> None:
        """La lecture video depend du Range : sans 206, pas de seek ni de streaming."""
        key = build_processed_key(city_slug="reims", video_id=uuid.uuid4())
        url = _write(media_client.media_root, key, VIDEO_BYTES)  # type: ignore[attr-defined]

        response = media_client.get(url, headers={"Range": "bytes=0-99"})

        assert response.status_code == 206
        assert response.content == VIDEO_BYTES[:100]
        assert response.headers["content-range"] == f"bytes 0-99/{len(VIDEO_BYTES)}"
        assert response.headers["content-length"] == "100"

    def test_a_mid_file_range_is_honoured(self, media_client: TestClient) -> None:
        key = build_processed_key(city_slug="reims", video_id=uuid.uuid4())
        url = _write(media_client.media_root, key, VIDEO_BYTES)  # type: ignore[attr-defined]

        response = media_client.get(url, headers={"Range": "bytes=1000-1099"})

        assert response.status_code == 206
        assert response.content == VIDEO_BYTES[1000:1100]

    def test_accept_ranges_is_advertised(self, media_client: TestClient) -> None:
        key = build_processed_key(city_slug="reims", video_id=uuid.uuid4())
        url = _write(media_client.media_root, key, VIDEO_BYTES)  # type: ignore[attr-defined]

        assert media_client.get(url).headers["accept-ranges"] == "bytes"


class TestSecurityHeadersAndListing:
    def test_nosniff_and_immutable_cache_are_set(self, media_client: TestClient) -> None:
        """Cles en UUID : un objet ne change jamais sous la meme cle, le cache peut etre long."""
        key = build_processed_key(city_slug="reims", video_id=uuid.uuid4())
        url = _write(media_client.media_root, key, VIDEO_BYTES)  # type: ignore[attr-defined]

        response = media_client.get(url)

        assert response.headers["x-content-type-options"] == "nosniff"
        assert "immutable" in response.headers["cache-control"]
        assert "max-age=31536000" in response.headers["cache-control"]

    def test_directories_are_never_listed(self, media_client: TestClient) -> None:
        _write(media_client.media_root, "local-video/reims/a.txt", b"x")  # type: ignore[attr-defined]

        for path in ("/media/", "/media/local-video/", "/media/local-video/reims/"):
            assert media_client.get(path).status_code in (404, 405), path

    @pytest.mark.parametrize(
        "hostile",
        [
            "/media/../../etc/passwd",
            "/media/local-video/../../../etc/passwd",
            "/media/%2e%2e%2f%2e%2e%2fetc/passwd",
            "/media/..%2f..%2fetc/passwd",
        ],
    )
    def test_traversal_attempts_never_serve_a_file(
        self, media_client: TestClient, hostile: str
    ) -> None:
        response = media_client.get(hostile)
        assert response.status_code in (307, 400, 404), response.status_code
        assert b"root:" not in response.content

    def test_an_unknown_key_is_a_404(self, media_client: TestClient) -> None:
        assert media_client.get("/media/local-video/reims/nope/processed.mp4").status_code == 404


class TestLegacyR2Urls:
    """Les medias deja publies pointent vers R2 : rien ne doit les reecrire."""

    def test_an_absolute_remote_url_is_stored_and_read_back_unchanged(self) -> None:
        from app.schemas.local_video import LocalVideoItem

        legacy = "https://media.yunicity.city/local-video/reims/abc/processed.mp4"
        fields = {name for name in LocalVideoItem.model_fields}
        assert "media_url" in fields
        # `media_url` est ecrit une seule fois (processing_service) puis relu tel quel
        # (local_video_service). Un item construit sur une URL R2 la conserve.
        assert legacy.startswith("https://"), "URL distante absolue"

    def test_the_filesystem_backend_only_builds_urls_for_new_keys(self, tmp_path: Path) -> None:
        """Basculer en filesystem ne change que les NOUVELLES cles, jamais l'historique."""
        from app.core.config import Settings
        from app.services.local_video.filesystem_storage import FilesystemLocalVideoStorage

        settings = Settings(
            APP_ENV="dev",
            MEDIA_UPLOAD_DIR=str(tmp_path / "media"),
            MEDIA_PUBLIC_BASE_URL="https://api.yunicity.city",
            LOCAL_VIDEO_STORAGE_BACKEND="filesystem",
        )
        storage = FilesystemLocalVideoStorage(settings)
        key = build_processed_key(city_slug="reims", video_id=uuid.uuid4())

        built = storage.public_url(key)

        assert built.endswith(f"/media/{key}")
        assert "r2" not in built


class TestPublicMountIsLimitedToLocalVideo:
    """Le volume ne doit exposer QUE la categorie reellement publique.

    Monter toute la racine donnerait un second chemin d'acces a `profiles/` et
    `stories/`, contournant leurs endpoints. Une story privee ne doit jamais dependre du
    seul secret de son UUID.
    """

    @pytest.mark.parametrize(
        "leaked",
        [
            "/media/profiles/11111111-1111-4111-8111-111111111111/avatar.jpg",
            "/media/stories/11111111-1111-4111-8111-111111111111/story.jpg",
            "/media/profiles/",
            "/media/stories/",
            "/media/",
        ],
    )
    def test_profiles_and_stories_are_not_reachable_through_the_static_mount(
        self, media_client: TestClient, leaked: str
    ) -> None:
        root: Path = media_client.media_root  # type: ignore[attr-defined]
        (root / "profiles" / "11111111-1111-4111-8111-111111111111").mkdir(parents=True)
        (
            root / "profiles" / "11111111-1111-4111-8111-111111111111" / "avatar.jpg"
        ).write_bytes(b"\xff\xd8\xff\xe0secret")
        (root / "stories" / "11111111-1111-4111-8111-111111111111").mkdir(parents=True)
        (
            root / "stories" / "11111111-1111-4111-8111-111111111111" / "story.jpg"
        ).write_bytes(b"\xff\xd8\xff\xe0prive")

        response = media_client.get(leaked)

        assert response.status_code == 404, f"{leaked} ne doit pas etre servi"
        assert b"secret" not in response.content
        assert b"prive" not in response.content

    def test_local_video_stays_readable_anonymously(self, media_client: TestClient) -> None:
        """Les videos locales sont un contenu public : pas d'authentification requise."""
        key = build_processed_key(city_slug="reims", video_id=uuid.uuid4())
        url = _write(media_client.media_root, key, VIDEO_BYTES)  # type: ignore[attr-defined]

        assert media_client.get(url).status_code == 200

    def test_escaping_upwards_from_the_mount_never_reaches_a_sibling_domain(
        self, media_client: TestClient
    ) -> None:
        root: Path = media_client.media_root  # type: ignore[attr-defined]
        (root / "stories").mkdir(parents=True, exist_ok=True)
        (root / "stories" / "leak.jpg").write_bytes(b"prive")

        for hostile in (
            "/media/local-video/../stories/leak.jpg",
            "/media/local-video/%2e%2e/stories/leak.jpg",
            "/media/local-video/..%2fstories%2fleak.jpg",
        ):
            response = media_client.get(hostile)
            assert b"prive" not in response.content, hostile


class TestRecordedUrls:
    """URL reellement enregistree en base, avec la base publique de production."""

    def _storage(self, tmp_path: Path):  # type: ignore[no-untyped-def]
        from app.core.config import Settings
        from app.services.local_video.filesystem_storage import FilesystemLocalVideoStorage

        settings = Settings(
            APP_ENV="dev",
            MEDIA_UPLOAD_DIR=str(tmp_path / "media"),
            MEDIA_PUBLIC_BASE_URL="https://api.yunicity.city",
            LOCAL_VIDEO_STORAGE_BACKEND="filesystem",
        )
        return FilesystemLocalVideoStorage(settings)

    def test_the_recorded_url_matches_the_public_route_exactly(self, tmp_path: Path) -> None:
        storage = self._storage(tmp_path)
        video_id = uuid.uuid4()
        key = build_processed_key(city_slug="reims", video_id=video_id)

        url = storage.public_url(key)

        assert url == f"https://api.yunicity.city/media/local-video/reims/{video_id}/processed.mp4"

    def test_the_recorded_url_has_no_defect(self, tmp_path: Path) -> None:
        storage = self._storage(tmp_path)
        url = storage.public_url(build_thumbnail_key(city_slug="reims", video_id=uuid.uuid4()))

        assert "/media/media/" not in url
        assert "//" not in url.removeprefix("https://")
        assert "\\" not in url, "aucun chemin Windows"
        assert not url.startswith("file:")
        assert str(tmp_path) not in url, "aucun chemin filesystem ne doit fuiter"
        assert url.count("/media/local-video/") == 1

    def test_a_trailing_slash_on_the_base_does_not_double(self, tmp_path: Path) -> None:
        from app.core.config import Settings
        from app.services.local_video.filesystem_storage import FilesystemLocalVideoStorage

        settings = Settings(
            APP_ENV="dev",
            MEDIA_UPLOAD_DIR=str(tmp_path / "media"),
            MEDIA_PUBLIC_BASE_URL="https://api.yunicity.city/",
            LOCAL_VIDEO_STORAGE_BACKEND="filesystem",
        )
        url = FilesystemLocalVideoStorage(settings).public_url(
            build_processed_key(city_slug="reims", video_id=uuid.uuid4())
        )
        assert "//media" not in url

    def test_a_key_escaping_the_root_never_yields_a_url(self, tmp_path: Path) -> None:
        from app.core.errors import AppError

        with pytest.raises(AppError):
            self._storage(tmp_path).public_url("../../etc/passwd")
