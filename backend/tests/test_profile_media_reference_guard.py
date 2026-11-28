"""Avatars et bannieres : lecture anonyme, mais uniquement si REFERENCEE.

Ces medias appartiennent a un profil public : leur lecture n'exige pas d'authentification.
Ce que la route doit garantir, c'est qu'elle ne serve jamais un objet arbitraire du
stockage -- seul un fichier reellement designe par `avatar_url` ou `banner_url` sort.
"""

from __future__ import annotations

import uuid
from collections.abc import Iterator
from io import BytesIO
from pathlib import Path
from typing import Any, cast

import pytest
from app.core.config import get_settings
from httpx import AsyncClient

from tests.media_fixtures import MINIMAL_JPEG_BYTES, MINIMAL_PNG_BYTES
from tests.test_profile_endpoints import _auth_headers, _register

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

CDN_BASE = "https://media.yunicity.city"


@pytest.fixture(autouse=True)
def filesystem_profile_media_env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[Path]:
    root = tmp_path / "profile-media"
    root.mkdir()
    monkeypatch.setenv("APP_ENV", "dev")
    monkeypatch.setenv("PROFILE_MEDIA_STORAGE_BACKEND", "filesystem")
    monkeypatch.setenv("PROFILE_MEDIA_UPLOAD_DIR", str(root))
    monkeypatch.setenv("LOCAL_VIDEO_CDN_BASE_URL", CDN_BASE)
    # R2 configure EN PLUS du filesystem : c'est l'etat de production, et la
    # condition du repli controle pour les references historiques.
    monkeypatch.setenv("LOCAL_VIDEO_R2_ENDPOINT", "https://r2.example.invalid")
    monkeypatch.setenv("LOCAL_VIDEO_R2_BUCKET", "bucket-test")
    monkeypatch.setenv("LOCAL_VIDEO_R2_ACCESS_KEY_ID", "test-key-id")
    monkeypatch.setenv("LOCAL_VIDEO_R2_SECRET_ACCESS_KEY", "test-secret")
    monkeypatch.delenv("RAILWAY_ENVIRONMENT", raising=False)
    monkeypatch.delenv("RAILWAY_PROJECT_ID", raising=False)
    get_settings.cache_clear()
    yield root
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def disable_rate_limits(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(*_a: object, **_k: object) -> None:
        return None

    monkeypatch.setattr("app.api.v1.profile.enforce_rate_limit", _noop)
    monkeypatch.setattr("app.api.v1.auth.enforce_rate_limit", _noop)


async def _with_avatar(client: AsyncClient, suffix: str) -> tuple[dict[str, Any], str]:
    auth = await _register(client, {}, suffix=suffix)
    response = await client.post(
        "/api/v1/profile/me/avatar",
        headers=_auth_headers(auth["access_token"]),
        files={"file": ("a.jpg", BytesIO(MINIMAL_JPEG_BYTES), "image/jpeg")},
    )
    assert response.status_code == 200, response.text
    url = cast(str, response.json()["avatar_url"])
    assert url.startswith("/api/v1/profile-media/"), url
    return auth, url


async def _with_banner(client: AsyncClient, suffix: str) -> tuple[dict[str, Any], str]:
    auth = await _register(client, {}, suffix=suffix)
    response = await client.post(
        "/api/v1/profile/me/banner",
        headers=_auth_headers(auth["access_token"]),
        files={"file": ("b.png", BytesIO(MINIMAL_PNG_BYTES), "image/png")},
    )
    assert response.status_code == 200, response.text
    return auth, cast(str, response.json()["banner_url"])


class TestReferencedMediaIsServed:
    async def test_a_referenced_avatar_is_readable_anonymously(
        self, auth_client: AsyncClient
    ) -> None:
        """Lecture anonyme assumee : l'avatar appartient a un profil public."""
        _auth, url = await _with_avatar(auth_client, "ref-avatar")
        response = await auth_client.get(url)
        assert response.status_code == 200
        assert response.content == MINIMAL_JPEG_BYTES
        assert response.headers["content-type"].startswith("image/jpeg")

    async def test_a_referenced_banner_is_readable(self, auth_client: AsyncClient) -> None:
        _auth, url = await _with_banner(auth_client, "ref-banner")
        response = await auth_client.get(url)
        assert response.status_code == 200
        assert response.content == MINIMAL_PNG_BYTES

    async def test_public_but_revalidating_cache_headers(
        self, auth_client: AsyncClient
    ) -> None:
        """La cle est ECRASEE au changement d'avatar : pas de cache immuable."""
        _auth, url = await _with_avatar(auth_client, "cache")
        response = await auth_client.get(url)
        cache = response.headers["cache-control"]
        assert cache.startswith("public")
        assert "immutable" not in cache, "la cle n'est pas immuable"
        assert "must-revalidate" in cache
        assert response.headers["x-content-type-options"] == "nosniff"

    async def test_no_redirect_and_no_r2_url_returned(self, auth_client: AsyncClient) -> None:
        _auth, url = await _with_avatar(auth_client, "no-redirect")
        response = await auth_client.get(url, follow_redirects=False)
        assert response.status_code == 200
        assert "location" not in {k.lower() for k in response.headers}
        assert CDN_BASE not in str(response.headers)


class TestUnreferencedObjectsAreRefused:
    async def test_a_file_present_but_not_referenced_is_refused(
        self, auth_client: AsyncClient, filesystem_profile_media_env: Path
    ) -> None:
        """Sans reference, la route deviendrait un lecteur d'objets arbitraires."""
        auth = await _register(auth_client, {}, suffix="unref")
        user_id = auth["user"]["id"]
        target = filesystem_profile_media_env / "profiles" / str(user_id)
        target.mkdir(parents=True, exist_ok=True)
        (target / "avatar.jpg").write_bytes(MINIMAL_JPEG_BYTES)

        response = await auth_client.get(f"/api/v1/profile-media/{user_id}/avatar.jpg")

        assert response.status_code == 404
        assert MINIMAL_JPEG_BYTES not in response.content

    async def test_a_wrong_user_id_is_refused(self, auth_client: AsyncClient) -> None:
        _auth, url = await _with_avatar(auth_client, "wrong-user")
        filename = url.rsplit("/", 1)[1]
        forged = f"/api/v1/profile-media/{uuid.uuid4()}/{filename}"
        response = await auth_client.get(forged)
        assert response.status_code == 404
        assert MINIMAL_JPEG_BYTES not in response.content

    async def test_a_wrong_filename_is_refused(self, auth_client: AsyncClient) -> None:
        auth, url = await _with_avatar(auth_client, "wrong-file")
        base = url.rsplit("/", 1)[0]
        # `banner.jpg` est une cle valide, mais ce profil n'a pas de banniere.
        response = await auth_client.get(f"{base}/banner.jpg")
        assert response.status_code == 404

    @pytest.mark.parametrize(
        "bad",
        ["../../etc/passwd", "..%2f..%2fetc%2fpasswd", ".hidden.jpg", "sub/avatar.jpg"],
    )
    async def test_traversal_is_refused(self, auth_client: AsyncClient, bad: str) -> None:
        auth, url = await _with_avatar(auth_client, f"trav{abs(hash(bad)) % 9999}")
        base = url.rsplit("/", 1)[0]
        response = await auth_client.get(f"{base}/{bad}")
        assert response.status_code in (400, 404, 405)
        assert b"root:" not in response.content

    @pytest.mark.parametrize("bad_ext", ["avatar.svg", "avatar.gif", "avatar.exe", "avatar"])
    async def test_a_forbidden_extension_is_refused(
        self, auth_client: AsyncClient, bad_ext: str
    ) -> None:
        auth, url = await _with_avatar(auth_client, f"ext{abs(hash(bad_ext)) % 9999}")
        base = url.rsplit("/", 1)[0]
        response = await auth_client.get(f"{base}/{bad_ext}")
        assert response.status_code in (400, 404)


class TestDomainsStaySeparate:
    async def test_a_profile_route_never_serves_a_story(
        self, auth_client: AsyncClient
    ) -> None:
        response = await auth_client.get(
            f"/api/v1/profile-media/{uuid.uuid4()}/{uuid.uuid4()}.jpg"
        )
        assert response.status_code in (400, 404)

    async def test_the_story_route_still_requires_authentication(
        self, auth_client: AsyncClient
    ) -> None:
        """Non-regression : les stories restent protegees, les avatars non."""
        response = await auth_client.get(
            f"/api/v1/story-media/{uuid.uuid4()}/{uuid.uuid4()}.jpg"
        )
        assert response.status_code == 401

    async def test_local_video_is_not_served_by_the_profile_route(
        self, auth_client: AsyncClient
    ) -> None:
        response = await auth_client.get("/api/v1/profile-media/reims/processed.mp4")
        assert response.status_code in (400, 404, 422)


class TestLegacyR2Reference:
    """Une reference historique absolue reste servie -- relayee, jamais redirigee."""

    async def _set_avatar_url(self, user_id: uuid.UUID, url: str) -> None:
        from app.db.session import get_engine
        from app.models.user_profile import UserProfile
        from sqlalchemy import update
        from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

        engine = get_engine()
        assert engine is not None
        async with async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)() as s:
            await s.execute(
                update(UserProfile).where(UserProfile.user_id == user_id).values(avatar_url=url)
            )
            await s.commit()

    async def test_a_legacy_cdn_reference_is_streamed_from_r2(
        self, auth_client: AsyncClient
    ) -> None:
        from io import BytesIO
        from unittest.mock import MagicMock, patch

        auth = await _register(auth_client, {}, suffix="legacy-ok")
        user_id = uuid.UUID(auth["user"]["id"])
        await self._set_avatar_url(user_id, f"{CDN_BASE}/profiles/{user_id}/avatar.jpg")

        client = MagicMock()
        client.get_object.return_value = {
            "Body": BytesIO(MINIMAL_JPEG_BYTES),
            "ContentType": "image/jpeg",
            "ContentLength": len(MINIMAL_JPEG_BYTES),
        }
        with patch(
            "app.services.profile_media.r2_storage.boto3.client", return_value=client
        ):
            response = await auth_client.get(
                f"/api/v1/profile-media/{user_id}/avatar.jpg", follow_redirects=False
            )

        assert response.status_code == 200
        assert response.content == MINIMAL_JPEG_BYTES
        assert "location" not in {k.lower() for k in response.headers}, "aucune redirection"
        assert CDN_BASE not in str(response.headers)
        assert client.get_object.call_args.kwargs["Key"] == f"profiles/{user_id}/avatar.jpg"

    async def test_a_missing_legacy_object_is_a_clean_404(
        self, auth_client: AsyncClient
    ) -> None:
        from unittest.mock import MagicMock, patch

        from botocore.exceptions import ClientError  # type: ignore[import-untyped]

        auth = await _register(auth_client, {}, suffix="legacy-404")
        user_id = uuid.UUID(auth["user"]["id"])
        await self._set_avatar_url(user_id, f"{CDN_BASE}/profiles/{user_id}/avatar.jpg")

        client = MagicMock()
        client.get_object.side_effect = ClientError(
            {"Error": {"Code": "NoSuchKey"}}, "GetObject"
        )
        with patch(
            "app.services.profile_media.r2_storage.boto3.client", return_value=client
        ):
            response = await auth_client.get(f"/api/v1/profile-media/{user_id}/avatar.jpg")

        assert response.status_code == 404

    async def test_an_upstream_error_becomes_502_without_leaking(
        self, auth_client: AsyncClient
    ) -> None:
        from unittest.mock import MagicMock, patch

        from botocore.exceptions import ClientError

        auth = await _register(auth_client, {}, suffix="legacy-502")
        user_id = uuid.UUID(auth["user"]["id"])
        await self._set_avatar_url(user_id, f"{CDN_BASE}/profiles/{user_id}/avatar.jpg")

        client = MagicMock()
        client.get_object.side_effect = ClientError(
            {"Error": {"Code": "NotEntitled"}}, "GetObject"
        )
        with patch(
            "app.services.profile_media.r2_storage.boto3.client", return_value=client
        ):
            response = await auth_client.get(f"/api/v1/profile-media/{user_id}/avatar.jpg")

        assert response.status_code == 502
        body = response.text
        assert "NotEntitled" not in body, "aucun detail amont ne doit fuiter"
        assert CDN_BASE not in body
        assert "profiles/" not in body

    async def test_a_legacy_reference_of_another_user_is_refused(
        self, auth_client: AsyncClient
    ) -> None:
        from unittest.mock import MagicMock, patch

        auth = await _register(auth_client, {}, suffix="legacy-other")
        user_id = uuid.UUID(auth["user"]["id"])
        await self._set_avatar_url(user_id, f"{CDN_BASE}/profiles/{user_id}/avatar.jpg")

        client = MagicMock()
        with patch(
            "app.services.profile_media.r2_storage.boto3.client", return_value=client
        ):
            response = await auth_client.get(
                f"/api/v1/profile-media/{uuid.uuid4()}/avatar.jpg"
            )

        assert response.status_code == 404
        client.get_object.assert_not_called()
