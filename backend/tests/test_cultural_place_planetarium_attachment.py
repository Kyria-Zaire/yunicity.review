"""Correction du rattachement de planetarium-de-reims (FK quartier + adresse).

Verrouille la correction issue du DISCOVER : la FK `neighborhood_slug` pointait sur `murigny`
(3,56 km, 2e quartier le plus eloigne sur 15) et l'adresse etait fausse ("49 Rue du General
Ponty" -> rue inexistante pour ce lieu). Preuves independantes :
- coordonnees (49.24285, 4.01563) verifiees correctes vs Wikipedia (49.242847, 4.015628) ;
- OSM reverse-geocode (point-in-polygon) de ces coordonnees -> "Avenue du General de Gaulle,
  La Haubette, Cite-Jardin de la Maison Blanche, Reims" -> quartier `maison-blanche` ;
- adresse reelle "49 avenue du General de Gaulle" confirmee par Wikipedia + Mappy + OSM.
Les coordonnees etaient justes : elles ne changent pas.
"""

from __future__ import annotations

from typing import Any

from app.db.seeds.reims_cultural_places import REIMS_CULTURAL_PLACES_SEED


def _planetarium() -> dict[str, Any]:
    return next(e for e in REIMS_CULTURAL_PLACES_SEED if e["slug"] == "planetarium-de-reims")


def test_planetarium_attached_to_maison_blanche_not_murigny() -> None:
    assert _planetarium()["neighborhood_slug"] == "maison-blanche"


def test_planetarium_address_is_general_de_gaulle() -> None:
    assert _planetarium()["address"] == "49 avenue du Général de Gaulle"


def test_planetarium_coordinates_unchanged() -> None:
    place = _planetarium()
    assert (place["latitude"], place["longitude"]) == (49.24285, 4.01563)
