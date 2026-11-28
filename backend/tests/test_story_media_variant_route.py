"""Route de media : parametre `variant`, sur les DEUX stockages.

Ce qui est verrouille ici, et qui ne l'est nulle part ailleurs :

- la variante est servie **plus legere** que l'original, et l'original reste
  joignable **octet pour octet** quand le parametre est absent ;
- ⛔ une variante **deja calculee** reste **protegee** : un tiers non autorise
  recoit 404, exactement comme sur l'original. C'est le point ou un cache mal
  place deviendrait un contournement d'autorisation ;
- une video ne derive **jamais** ;
- tout echec de derivation retombe sur l'original, jamais sur une erreur.
"""

from __future__ import annotations

import io
import uuid
from collections.abc import Iterator
from io import BytesIO
from pathlib import Path
from typing import Any, cast
from unittest.mock import MagicMock, patch

import pytest
from app.core.config import get_settings
from botocore.exceptions import ClientError  # type: ignore[import-untyped]
from httpx import AsyncClient
from PIL import Image

from tests.media_fixtures import MINIMAL_JPEG_BYTES
from tests.test_stories_api import _register

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


def _real_jpeg(width: int = 1800, height: int = 1350) -> bytes:
    """Vraie photo JPEG decodable — `MINIMAL_JPEG_BYTES` n'est que des octets
    magiques, et ne peut donc pas etre derivee."""
    image = Image.new("RGB", (width, height))
    pixels = image.load()
    assert pixels is not None
    seed = 424242
    for y in range(0, height, 2):
        for x in range(0, width, 2):
            seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
            value = seed & 0xFF
            pixels[x, y] = (value, (value * 3) & 0xFF, (value * 7) & 0xFF)
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=95)
    return buffer.getvalue()


REAL_JPEG = _real_jpeg()


@pytest.fixture(autouse=True)
def disable_auth_rate_limits(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(*_a: object, **_k: object) -> None:
        return None

    monkeypatch.setattr("app.api.v1.auth.enforce_rate_limit", _noop)
    monkeypatch.setattr("app.api.v1.posts.enforce_rate_limit", _noop)
    monkeypatch.setattr("app.api.v1.stories.enforce_rate_limit", _noop, raising=False)


@pytest.fixture(autouse=True)
def _clean_variant_state() -> Iterator[None]:
    from app.services.story_media import variant_service

    variant_service._inflight.clear()
    variant_service._semaphore = None
    yield
    variant_service._inflight.clear()
    variant_service._semaphore = None


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _upload(client: AsyncClient, token: str, payload: bytes, name: str) -> str:
    response = await client.post(
        "/api/v1/posts/media",
        headers=_headers(token),
        files={"file": (name, BytesIO(payload), "image/jpeg")},
    )
    assert response.status_code in (200, 201), response.text
    return cast(str, response.json()["url"])


async def _create_story(client: AsyncClient, token: str, media_url: str) -> None:
    response = await client.post(
        "/api/v1/stories",
        headers=_headers(token),
        json={"media_url": media_url, "caption": "Recette", "category": "culture"},
    )
    assert response.status_code == 201, response.text


async def _owner_with_media(
    client: AsyncClient, suffix: str, payload: bytes = REAL_JPEG, name: str = "photo.jpg"
) -> tuple[dict[str, Any], str]:
    auth = await _register(client, suffix)
    media_url = await _upload(client, auth["access_token"], payload, name)
    await _create_story(client, auth["access_token"], media_url)
    return auth, media_url


# ── Stockage FILESYSTEM ─────────────────────────────────────────────────────


class TestFilesystemVariant:
    @pytest.fixture(autouse=True)
    def filesystem_env(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> Iterator[Path]:
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

    async def test_the_variant_is_lighter_and_the_original_is_untouched(
        self, auth_client: AsyncClient, filesystem_env: Path
    ) -> None:
        auth, media_url = await _owner_with_media(auth_client, "fs-card")
        headers = _headers(auth["access_token"])

        variant = await auth_client.get(f"{media_url}?variant=card", headers=headers)
        assert variant.status_code == 200, variant.text
        assert variant.headers["content-type"] == "image/jpeg"
        assert len(variant.content) < len(REAL_JPEG)
        with Image.open(io.BytesIO(variant.content)) as image:
            assert max(image.size) == 1280

        # SANS parametre : l'original, octet pour octet.
        original = await auth_client.get(media_url, headers=headers)
        assert original.status_code == 200
        assert original.content == REAL_JPEG

        # Le fichier source sur disque n'a pas bouge, et la variante vit
        # ailleurs, dans son propre espace de noms.
        originals = list((filesystem_env / "stories").rglob("*.jpg"))
        assert len(originals) == 1
        assert originals[0].read_bytes() == REAL_JPEG
        assert list((filesystem_env / "derived" / "card").rglob("*.jpg"))

    async def test_an_already_computed_variant_stays_protected_from_a_third_party(
        self, auth_client: AsyncClient
    ) -> None:
        """⛔ LE POINT CRITIQUE. Un cache ne doit jamais devenir un contournement.

        La variante est d'abord CALCULEE par le proprietaire, puis demandee par
        un tiers dont la story n'est pas visible. Si l'autorisation etait
        court-circuitee par le chemin rapide « variante deja presente », ce test
        servirait l'image.
        """
        auth, media_url = await _owner_with_media(auth_client, "fs-guard")
        owner_headers = _headers(auth["access_token"])

        warmed = await auth_client.get(f"{media_url}?variant=card", headers=owner_headers)
        assert warmed.status_code == 200
        derived_bytes = warmed.content

        # Un user_id force : la ligne metier ne correspond plus, donc 404.
        filename = media_url.rsplit("/", 1)[1]
        other = await _register(auth_client, "fs-guard-other")
        forged = f"/api/v1/story-media/{uuid.uuid4()}/{filename}"
        refused = await auth_client.get(
            f"{forged}?variant=card", headers=_headers(other["access_token"])
        )
        assert refused.status_code == 404
        assert derived_bytes not in refused.content

        # Et sans jeton du tout.
        anonymous = await auth_client.get(f"{media_url}?variant=card")
        assert anonymous.status_code == 401
        assert derived_bytes not in anonymous.content

    async def test_non_decodable_bytes_fall_back_to_the_original(
        self, auth_client: AsyncClient
    ) -> None:
        """La variante est une optimisation : jamais une erreur servie au client."""
        payload = MINIMAL_JPEG_BYTES + b"\x00" * 256
        auth, media_url = await _owner_with_media(
            auth_client, "fs-broken", payload=payload
        )

        response = await auth_client.get(
            f"{media_url}?variant=card", headers=_headers(auth["access_token"])
        )

        assert response.status_code == 200
        assert response.content == payload

    async def test_an_unknown_variant_name_is_rejected_by_validation(
        self, auth_client: AsyncClient
    ) -> None:
        auth, media_url = await _owner_with_media(auth_client, "fs-unknown")

        response = await auth_client.get(
            f"{media_url}?variant=enorme", headers=_headers(auth["access_token"])
        )

        assert response.status_code == 422

    @pytest.mark.parametrize("variant", ["card", "viewer"])
    async def test_both_variants_are_served_and_differ_in_size(
        self, auth_client: AsyncClient, variant: str
    ) -> None:
        auth, media_url = await _owner_with_media(auth_client, f"fs-{variant}-size")

        response = await auth_client.get(
            f"{media_url}?variant={variant}", headers=_headers(auth["access_token"])
        )

        assert response.status_code == 200
        with Image.open(io.BytesIO(response.content)) as image:
            expected = 1280 if variant == "card" else 1800
            # `viewer` plafonne a 2048 : une source de 1800 n'est PAS agrandie.
            assert max(image.size) == expected


# ── Stockage R2 ─────────────────────────────────────────────────────────────


class TestR2Variant:
    @pytest.fixture(autouse=True)
    def r2_env(self, monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
        monkeypatch.setenv("APP_ENV", "dev")
        monkeypatch.setenv("STORY_MEDIA_STORAGE_BACKEND", "r2")
        monkeypatch.setenv("LOCAL_VIDEO_CDN_BASE_URL", "https://media.yunicity.city")
        monkeypatch.setenv("LOCAL_VIDEO_R2_ENDPOINT", "https://r2.example.invalid")
        monkeypatch.setenv("LOCAL_VIDEO_R2_BUCKET", "bucket-test")
        monkeypatch.setenv("LOCAL_VIDEO_R2_ACCESS_KEY_ID", "test-key-id")
        monkeypatch.setenv("LOCAL_VIDEO_R2_SECRET_ACCESS_KEY", "test-secret")
        monkeypatch.delenv("RAILWAY_ENVIRONMENT", raising=False)
        monkeypatch.delenv("RAILWAY_PROJECT_ID", raising=False)
        get_settings.cache_clear()
        yield
        get_settings.cache_clear()

    @staticmethod
    def _fake_r2(store: dict[str, bytes]) -> MagicMock:
        """Client R2 mocke, adosse a un dictionnaire d'objets."""
        client = MagicMock()

        def get_object(**kwargs: Any) -> dict[str, Any]:
            key = kwargs["Key"]
            if key not in store:
                raise ClientError({"Error": {"Code": "NoSuchKey"}}, "GetObject")
            payload = store[key]
            return {
                "Body": BytesIO(payload),
                "ContentType": "image/jpeg",
                "ContentLength": len(payload),
                "ContentRange": None,
            }

        def put_object(**kwargs: Any) -> dict[str, Any]:
            body = kwargs["Body"]
            store[kwargs["Key"]] = body if isinstance(body, bytes) else body.read()
            return {}

        client.get_object.side_effect = get_object
        client.put_object.side_effect = put_object
        return client

    async def test_the_variant_is_derived_then_stored_under_the_derived_key(
        self, auth_client: AsyncClient
    ) -> None:
        store: dict[str, bytes] = {}
        with patch("boto3.client", return_value=self._fake_r2(store)):
            auth, media_url = await _owner_with_media(auth_client, "r2-card")
            headers = _headers(auth["access_token"])

            first = await auth_client.get(f"{media_url}?variant=card", headers=headers)
            assert first.status_code == 200, first.text
            assert len(first.content) < len(REAL_JPEG)

            derived_keys = [k for k in store if k.startswith("derived/card/")]
            assert len(derived_keys) == 1, store.keys()
            assert any(k.startswith("stories/") for k in store), "l'original a disparu"

            # Seconde demande : servie depuis la cle derivee, identique.
            second = await auth_client.get(f"{media_url}?variant=card", headers=headers)
            assert second.status_code == 200
            assert second.content == first.content

    async def test_an_already_computed_variant_stays_protected_from_a_third_party(
        self, auth_client: AsyncClient
    ) -> None:
        """⛔ Meme garantie que sur le filesystem, sur l'autre stockage."""
        store: dict[str, bytes] = {}
        with patch("boto3.client", return_value=self._fake_r2(store)):
            auth, media_url = await _owner_with_media(auth_client, "r2-guard")

            warmed = await auth_client.get(
                f"{media_url}?variant=card", headers=_headers(auth["access_token"])
            )
            assert warmed.status_code == 200
            assert any(k.startswith("derived/card/") for k in store)

            filename = media_url.rsplit("/", 1)[1]
            other = await _register(auth_client, "r2-guard-other")
            forged = f"/api/v1/story-media/{uuid.uuid4()}/{filename}"
            refused = await auth_client.get(
                f"{forged}?variant=card", headers=_headers(other["access_token"])
            )

            assert refused.status_code == 404
            assert warmed.content not in refused.content

    async def test_a_range_request_ignores_the_variant_and_streams_the_original(
        self, auth_client: AsyncClient
    ) -> None:
        """`Range` et `variant` ne se combinent pas.

        La plage sert les VIDEOS, qui ne derivent jamais. Laisser les deux se
        croiser renverrait une tranche d'une image recadree — un non-sens.
        """
        store: dict[str, bytes] = {}
        with patch("boto3.client", return_value=self._fake_r2(store)):
            auth, media_url = await _owner_with_media(auth_client, "r2-range")

            response = await auth_client.get(
                f"{media_url}?variant=card",
                headers={**_headers(auth["access_token"]), "Range": "bytes=0-99"},
            )

            assert response.status_code == 200
            assert not any(k.startswith("derived/") for k in store), (
                "une derivation a ete declenchee sur une requete Range"
            )
