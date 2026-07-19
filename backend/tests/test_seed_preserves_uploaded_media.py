"""Le seed ne doit pas ecraser les medias poses par l'upload R2 (QUARTIER-01).

Regression constatee en prod le 2026-07-19 : relancer `--cultural-places` apres un upload
remettait une URL derivee de web_frontend_url (404 en prod) sur 12 lieux, et effacait au
passage credit et licence d'images CC BY-SA.
"""

from __future__ import annotations

from typing import Any, cast

import pytest
from app.core.config import Settings
from app.db.seeds.reims_cultural_places import (
    _UPLOAD_OWNED_MEDIA_FIELDS,
    _apply_sync_fields,
    _has_uploaded_media,
)
from app.models.cultural_place import CulturalPlace

pytestmark = [pytest.mark.unit]

CDN = "https://media.yunicity.city"


class _FakeSettings:
    """Double minimal : les helpers ne lisent que local_video_public_base_url.

    Instancier un vrai Settings exigerait toute la config d'un environnement pour
    exercer un seul attribut. Le cast ci-dessous est donc assume et circonscrit aux
    tests — il ne masque pas un probleme de typage du code de production.
    """

    def __init__(self, base: str | None = CDN) -> None:
        self.local_video_public_base_url = base


def _settings(base: str | None = CDN) -> Settings:
    return cast(Settings, _FakeSettings(base))


def _place(**kwargs: Any) -> CulturalPlace:
    defaults: dict[str, Any] = {
        "slug": "place-test",
        "name": "Lieu test",
        "short_description": "desc",
        "city": "Reims",
        "address": "1 rue Test",
        "latitude": 49.25,
        "longitude": 4.03,
        "category": "heritage",
        "source_name": "src",
    }
    defaults.update(kwargs)
    return CulturalPlace(**defaults)


def test_detects_a_cover_already_hosted_on_the_cdn() -> None:
    row = _place(hero_image_url=f"{CDN}/places/reims/place-test/cover.jpg")
    assert _has_uploaded_media(row, _settings()) is True


@pytest.mark.parametrize(
    "hero",
    [
        "https://yunicity.city/places/reims/place-test/cover.jpg",  # URL derivee par le seed
        "/places/reims/place-test/cover.jpg",  # relative, environnement de dev
        "",
        None,
    ],
)
def test_anything_that_is_not_a_cdn_url_is_not_protected(hero: str | None) -> None:
    assert _has_uploaded_media(_place(hero_image_url=hero), _settings()) is False


def test_without_settings_nothing_is_protected() -> None:
    row = _place(hero_image_url=f"{CDN}/places/reims/place-test/cover.jpg")
    assert _has_uploaded_media(row, None) is False


def test_seed_keeps_url_credit_and_licence_when_media_came_from_the_upload() -> None:
    uploaded = _place(
        hero_image_url=f"{CDN}/places/reims/place-test/cover.jpg",
        image_url=f"{CDN}/places/reims/place-test/cover.jpg",
        thumbnail_image_url=f"{CDN}/places/reims/place-test/cover.jpg",
        image_source="wikimedia_commons",
        image_license="CC BY-SA 4.0",
        photo_credit="Chabe01 / CC BY-SA 4.0 via Wikimedia Commons",
        name="Ancien nom",
    )
    from_seed = _place(
        hero_image_url="https://yunicity.city/places/reims/place-test/cover.jpg",
        image_url="https://yunicity.city/places/reims/place-test/cover.jpg",
        thumbnail_image_url="https://yunicity.city/places/reims/place-test/cover.jpg",
        image_source=None,
        image_license=None,
        photo_credit=None,
        name="Nom mis a jour",
    )

    _apply_sync_fields(uploaded, from_seed, _settings())

    # Les champs media/attribution survivent...
    assert uploaded.hero_image_url == f"{CDN}/places/reims/place-test/cover.jpg"
    assert uploaded.image_url == f"{CDN}/places/reims/place-test/cover.jpg"
    assert uploaded.thumbnail_image_url == f"{CDN}/places/reims/place-test/cover.jpg"
    assert uploaded.image_license == "CC BY-SA 4.0"
    assert uploaded.photo_credit == "Chabe01 / CC BY-SA 4.0 via Wikimedia Commons"
    # ... mais le reste du seed s'applique normalement.
    assert uploaded.name == "Nom mis a jour"


def test_seed_writes_media_normally_when_no_upload_has_run() -> None:
    row = _place(hero_image_url=None, name="Ancien nom")
    from_seed = _place(
        hero_image_url="https://yunicity.city/places/reims/place-test/cover.jpg",
        name="Nom mis a jour",
    )

    _apply_sync_fields(row, from_seed, _settings())

    assert row.hero_image_url == "https://yunicity.city/places/reims/place-test/cover.jpg"
    assert row.name == "Nom mis a jour"


def test_the_protected_set_matches_what_the_upload_script_writes() -> None:
    """Garde-fou : l'upload ecrit ces 6 colonnes (voir la requete UPDATE du script)."""
    assert _UPLOAD_OWNED_MEDIA_FIELDS == {
        "image_url",
        "hero_image_url",
        "thumbnail_image_url",
        "image_source",
        "image_license",
        "photo_credit",
    }
