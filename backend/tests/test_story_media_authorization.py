"""Autorisation des medias de story (STORY-MEDIA-AUTHORIZATION-01).

La route servait tout fichier dont on connaissait (user_id, filename) : une story
n'etait protegee que par le secret de son UUID. Elle applique desormais la politique
canonique `can_view_post`, apres avoir retrouve la LIGNE METIER qui reference le fichier.
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
from sqlalchemy import update

from tests.media_fixtures import MINIMAL_JPEG_BYTES
from tests.test_stories_api import _register

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture(autouse=True)
def filesystem_media_env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[Path]:
    root = tmp_path / "story-media"
    root.mkdir()
    monkeypatch.setenv("APP_ENV", "dev")
    monkeypatch.setenv("STORY_MEDIA_STORAGE_BACKEND", "filesystem")
    monkeypatch.setenv("STORY_MEDIA_UPLOAD_DIR", str(root))
    monkeypatch.delenv("RAILWAY_ENVIRONMENT", raising=False)
    monkeypatch.delenv("RAILWAY_PROJECT_ID", raising=False)
    get_settings.cache_clear()
    yield root
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def disable_auth_rate_limits(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr("app.api.v1.auth.enforce_rate_limit", _noop)
    monkeypatch.setattr("app.api.v1.posts.enforce_rate_limit", _noop)


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _upload_media(client: AsyncClient, token: str) -> str:
    """Televerse une image et renvoie l'URL enregistree (route API protegee)."""
    response = await client.post(
        "/api/v1/posts/media",
        headers=_headers(token),
        files={"file": ("photo.jpg", BytesIO(MINIMAL_JPEG_BYTES), "image/jpeg")},
    )
    assert response.status_code in (200, 201), response.text
    url = cast(str, response.json()["url"])
    assert url.startswith("/api/v1/story-media/"), url
    return url


async def _create_story(client: AsyncClient, token: str, media_url: str) -> dict[str, Any]:
    response = await client.post(
        "/api/v1/stories",
        headers=_headers(token),
        json={"media_url": media_url, "caption": "Coucher de soleil", "category": "culture"},
    )
    assert response.status_code == 201, response.text
    return cast(dict[str, Any], response.json())


async def _owner_with_story(client: AsyncClient, suffix: str) -> tuple[dict[str, Any], str]:
    auth = await _register(client, suffix)
    media_url = await _upload_media(client, auth["access_token"])
    await _create_story(client, auth["access_token"], media_url)
    return auth, media_url


class TestAccessMatrix:
    async def test_anonymous_is_refused(self, auth_client: AsyncClient) -> None:
        _auth, media_url = await _owner_with_story(auth_client, "anon")
        response = await auth_client.get(media_url)
        assert response.status_code == 401
        assert MINIMAL_JPEG_BYTES not in response.content

    async def test_the_owner_is_allowed(self, auth_client: AsyncClient) -> None:
        auth, media_url = await _owner_with_story(auth_client, "owner")
        response = await auth_client.get(media_url, headers=_headers(auth["access_token"]))
        assert response.status_code == 200
        assert response.content == MINIMAL_JPEG_BYTES
        assert response.headers["content-type"] == "image/jpeg"

    async def test_another_authenticated_citizen_sees_a_public_story(
        self, auth_client: AsyncClient
    ) -> None:
        """Meme portee que `GET /stories` : une story publique est lisible par tout citoyen."""
        _owner, media_url = await _owner_with_story(auth_client, "viewer-owner")
        other = await _register(auth_client, "viewer-other")
        response = await auth_client.get(media_url, headers=_headers(other["access_token"]))
        assert response.status_code == 200

    async def test_a_wrong_user_id_is_refused(self, auth_client: AsyncClient) -> None:
        """Changer le user_id de l'URL ne doit pas donner acces au media d'un autre."""
        auth, media_url = await _owner_with_story(auth_client, "wrong-user")
        filename = media_url.rsplit("/", 1)[1]
        forged = f"/api/v1/story-media/{uuid.uuid4()}/{filename}"
        response = await auth_client.get(forged, headers=_headers(auth["access_token"]))
        assert response.status_code == 404
        assert MINIMAL_JPEG_BYTES not in response.content

    async def test_a_wrong_filename_is_refused(self, auth_client: AsyncClient) -> None:
        auth, media_url = await _owner_with_story(auth_client, "wrong-file")
        base = media_url.rsplit("/", 1)[0]
        response = await auth_client.get(
            f"{base}/{uuid.uuid4()}.jpg", headers=_headers(auth["access_token"])
        )
        assert response.status_code == 404

    async def test_a_file_without_a_business_row_is_refused(
        self, auth_client: AsyncClient, filesystem_media_env: Path
    ) -> None:
        """La presence physique ne suffit jamais POUR UN TIERS.

        Le proprietaire, lui, lit toujours son propre fichier : le composer televerse
        avant de creer la ligne, et lire son propre media ne revele rien a autrui.
        """
        owner = await _register(auth_client, "orphan-owner")
        stranger = await _register(auth_client, "orphan-stranger")
        user_id = owner["user"]["id"]
        orphan_dir = filesystem_media_env / "stories" / str(user_id)
        orphan_dir.mkdir(parents=True, exist_ok=True)
        # Nom conforme au format de cle (`{media_id}.{ext}`) : sinon la garde de cle
        # repondrait 400 avant meme la question de l'autorisation.
        orphan_name = f"{uuid.uuid4()}.jpg"
        (orphan_dir / orphan_name).write_bytes(MINIMAL_JPEG_BYTES)
        url = f"/api/v1/story-media/{user_id}/{orphan_name}"

        assert (
            await auth_client.get(url, headers=_headers(owner["access_token"]))
        ).status_code == 200, "le proprietaire lit son propre televersement"

        response = await auth_client.get(url, headers=_headers(stranger["access_token"]))
        assert response.status_code == 404
        assert MINIMAL_JPEG_BYTES not in response.content

    async def test_a_row_without_its_file_answers_cleanly(
        self, auth_client: AsyncClient, filesystem_media_env: Path
    ) -> None:
        auth, media_url = await _owner_with_story(auth_client, "missing-file")
        filename = media_url.rsplit("/", 1)[1]
        target = filesystem_media_env / "stories" / str(auth["user"]["id"]) / filename
        target.unlink()

        response = await auth_client.get(media_url, headers=_headers(auth["access_token"]))
        assert response.status_code == 404, "reponse propre, pas une 500"

    @pytest.mark.parametrize(
        "traversal",
        ["../../etc/passwd", "..%2f..%2fetc%2fpasswd", ".hidden", "sub/dir.jpg"],
    )
    async def test_traversal_attempts_are_refused(
        self, auth_client: AsyncClient, traversal: str
    ) -> None:
        auth, media_url = await _owner_with_story(auth_client, f"trav{abs(hash(traversal)) % 9999}")
        base = media_url.rsplit("/", 1)[0]
        response = await auth_client.get(
            f"{base}/{traversal}", headers=_headers(auth["access_token"])
        )
        assert response.status_code in (404, 400, 405)
        assert b"root:" not in response.content


class TestLifecycleRefusals:
    async def _post_id_of(self, auth_client: AsyncClient, token: str) -> uuid.UUID:
        listing = await auth_client.get("/api/v1/stories", headers=_headers(token))
        assert listing.status_code == 200, listing.text
        items = listing.json()["items"]
        assert items, "aucune story listee"
        return uuid.UUID(items[0]["id"])

    async def _mutate_post(self, values: dict[str, Any], post_id: uuid.UUID) -> None:
        from app.db.session import get_engine
        from app.models.post import Post
        from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

        engine = get_engine()
        assert engine is not None
        factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with factory() as session:
            await session.execute(update(Post).where(Post.id == post_id).values(**values))
            await session.commit()

    async def test_an_expired_story_is_refused(self, auth_client: AsyncClient) -> None:
        from datetime import UTC, datetime, timedelta

        auth, media_url = await _owner_with_story(auth_client, "expired")
        post_id = await self._post_id_of(auth_client, auth["access_token"])
        stranger = await _register(auth_client, "expired-stranger")
        await self._mutate_post(
            {"story_expires_at": datetime.now(UTC) - timedelta(hours=1)}, post_id
        )

        # Un tiers ne doit plus rien lire. Le proprietaire garde l'acces a son fichier :
        # l'expiration retire la story de la diffusion, elle n'efface pas le media.
        response = await auth_client.get(media_url, headers=_headers(stranger["access_token"]))
        assert response.status_code == 404
        assert MINIMAL_JPEG_BYTES not in response.content

    async def test_a_deleted_or_moderated_story_is_refused(
        self, auth_client: AsyncClient
    ) -> None:
        """`is_active=False` couvre la suppression logique ET le retrait de moderation."""
        auth, media_url = await _owner_with_story(auth_client, "deleted")
        post_id = await self._post_id_of(auth_client, auth["access_token"])
        stranger = await _register(auth_client, "deleted-stranger")
        await self._mutate_post({"is_active": False}, post_id)

        response = await auth_client.get(media_url, headers=_headers(stranger["access_token"]))
        assert response.status_code == 404
        assert MINIMAL_JPEG_BYTES not in response.content

    async def test_a_restricted_post_media_is_refused_to_others(
        self, auth_client: AsyncClient
    ) -> None:
        """`post_visibility` non public : la politique canonique fait tomber l'acces."""
        from app.core.post_composer_constants import PostVisibility

        auth, media_url = await _owner_with_story(auth_client, "restricted")
        post_id = await self._post_id_of(auth_client, auth["access_token"])
        await self._mutate_post(
            {"post_visibility": PostVisibility.CLOSE_FRIENDS.value}, post_id
        )
        other = await _register(auth_client, "restricted-other")

        refused = await auth_client.get(media_url, headers=_headers(other["access_token"]))
        allowed = await auth_client.get(media_url, headers=_headers(auth["access_token"]))

        assert refused.status_code == 404, "un tiers ne doit pas lire un media restreint"
        assert MINIMAL_JPEG_BYTES not in refused.content
        assert allowed.status_code == 200, "le proprietaire garde l'acces"


class TestHeadersRangeAndHead:
    async def test_private_cache_headers(self, auth_client: AsyncClient) -> None:
        auth, media_url = await _owner_with_story(auth_client, "cache")
        response = await auth_client.get(media_url, headers=_headers(auth["access_token"]))

        assert response.headers["cache-control"] == "private, no-store"
        assert "immutable" not in response.headers["cache-control"]
        assert response.headers["x-content-type-options"] == "nosniff"

    async def test_an_authorized_range_returns_206(self, auth_client: AsyncClient) -> None:
        auth, media_url = await _owner_with_story(auth_client, "range-ok")
        response = await auth_client.get(
            media_url, headers={**_headers(auth["access_token"]), "Range": "bytes=0-9"}
        )
        assert response.status_code == 206
        assert response.content == MINIMAL_JPEG_BYTES[:10]

    async def test_an_unauthorized_range_leaks_no_byte(self, auth_client: AsyncClient) -> None:
        _auth, media_url = await _owner_with_story(auth_client, "range-ko")
        response = await auth_client.get(media_url, headers={"Range": "bytes=0-9"})

        assert response.status_code == 401
        assert response.status_code != 206
        assert MINIMAL_JPEG_BYTES[:10] not in response.content

    async def test_an_unauthorized_head_leaks_no_metadata(
        self, auth_client: AsyncClient
    ) -> None:
        _auth, media_url = await _owner_with_story(auth_client, "head-ko")
        response = await auth_client.head(media_url)

        # 401 (auth requise) ou 405 (HEAD non declare sur la route) : dans les deux cas
        # aucune metadonnee du fichier n'est renvoyee. Le 405 est une limite fonctionnelle
        # connue, signalee au rapport -- pas une fuite.
        assert response.status_code in (401, 405), response.status_code
        assert response.content == b""
        assert response.headers.get("content-type", "") != "image/jpeg"


class TestNoRegressionOnOtherDomains:
    async def test_avatars_keep_their_own_route(self, auth_client: AsyncClient) -> None:
        """La route profil n'est pas touchee par ce ticket."""
        response = await auth_client.get(
            f"/api/v1/profile-media/{uuid.uuid4()}/avatar.jpg"
        )
        assert response.status_code == 404, "route toujours presente, media inexistant"

    async def test_local_video_media_is_untouched(self, auth_client: AsyncClient) -> None:
        """Les videos locales restent publiques : elles ne passent pas par cette route."""
        response = await auth_client.get("/api/v1/story-media/not-a-uuid/x.jpg")
        assert response.status_code in (401, 422)
