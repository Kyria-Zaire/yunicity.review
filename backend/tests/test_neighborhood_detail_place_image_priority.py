"""Verrou de caracterisation : ordre de resolution d'image de la section "lieux".

`NeighborhoodDetailService._map_place_item` doit resoudre l'image dans le MEME ordre que
le frontend (cultural-place-media.ts, resolveCulturalPlaceThumbnailUrl, lui-meme verrouille
par cultural-place-media.test.ts) : thumbnail -> hero -> image_url "legacy" en dernier.

But : empecher une future modification independante d'un des deux cotes de les faire
re-diverger en silence (#159). Test PUR, sans DB : on instancie le modele en memoire et on
appelle le staticmethod directement.
"""

from __future__ import annotations

import uuid

import pytest
from app.models.cultural_place import CulturalPlace
from app.services.neighborhood_detail_service import NeighborhoodDetailService

THUMB = "https://media.example/thumb.jpg"
HERO = "https://media.example/hero.jpg"
LEGACY = "https://media.example/legacy.jpg"


def _place(
    *,
    thumbnail: str | None,
    hero: str | None,
    legacy: str | None,
) -> CulturalPlace:
    return CulturalPlace(
        id=uuid.uuid4(),
        slug="lieu-test",
        name="Lieu test",
        category="museum",
        thumbnail_image_url=thumbnail,
        hero_image_url=hero,
        image_url=legacy,
    )


@pytest.mark.parametrize(
    ("thumbnail", "hero", "legacy", "expected"),
    [
        # Les trois presents -> thumbnail gagne (format d'affichage d'abord).
        (THUMB, HERO, LEGACY, THUMB),
        # Pas de thumbnail -> hero.
        (None, HERO, LEGACY, HERO),
        # Ni thumbnail ni hero -> image_url legacy en dernier recours.
        (None, None, LEGACY, LEGACY),
        # Rien -> None.
        (None, None, None, None),
        # Regression #159 explicite : legacy + thumbnail presents -> thumbnail, JAMAIS legacy.
        # (Avant le fix, image_url passait en premier et gagnait ici.)
        (THUMB, None, LEGACY, THUMB),
    ],
)
def test_map_place_item_resolves_thumbnail_then_hero_then_legacy(
    thumbnail: str | None,
    hero: str | None,
    legacy: str | None,
    expected: str | None,
) -> None:
    row = _place(thumbnail=thumbnail, hero=hero, legacy=legacy)
    item = NeighborhoodDetailService._map_place_item(row)
    assert item.image_url == expected
