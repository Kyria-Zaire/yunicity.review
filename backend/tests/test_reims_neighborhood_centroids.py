"""Garde-fou permanent des centroides de quartiers (re-derivation option 1, apres audit).

Contexte : l'audit a revele 3/12 centroides pointant dans une commune VOISINE (Betheny,
Cormontreuil, Villers-aux-Noeuds) -- erreur silencieuse jusqu'a ce qu'on tombe dessus. Les 12
actifs ont ete re-derives par forward-geocode Nominatim (nom d'ancrage du quartier) +
reverse-controle Reims/51100, revus 1 a 1. Valeurs = POINTS REPRESENTATIFS (ancre geocodee /
centroide de `suburb` OSM), PAS des centroides geometriques exacts (aucun polygone officiel).

Deux garde-fous PERMANENTS (pas une verif ponctuelle) :
- lock : chaque centroide actif du seed == la valeur revue -> TOUTE modification silencieuse
  echoue et force une re-verification (la vraie protection contre le retour de l'erreur) ;
- bbox : chaque centroide dans la bounding-box de Reims -> attrape une derive grossiere,
  independamment du lock. Limite connue et assumee : une commune ADJACENTE peut tomber dans la
  bbox (Reims et ses voisines s'imbriquent) ; c'est le lock qui protege finement.
"""

from __future__ import annotations

from app.db.seeds.reims_neighborhoods import REIMS_NEIGHBORHOOD_SEED

# Bounding-box large de Reims (WGS84), volontairement lache : le lock est le garde-fou fin.
REIMS_LAT = (49.20, 49.31)
REIMS_LON = (3.96, 4.10)

# Centroides revus au BUILD (12 quartiers actifs). Reference litterale, independante du seed.
REVIEWED_CENTROIDS: dict[str, tuple[float, float]] = {
    "centre-ville": (49.25553, 4.03414),
    "saint-remi": (49.24343, 4.03857),
    "clairmarais": (49.26031, 4.02216),
    "croix-rouge": (49.23361, 4.00493),
    "murigny": (49.22098, 4.01571),
    "la-neuvillette": (49.28904, 4.00584),
    "orgeval": (49.27062, 4.02165),
    "chemin-vert": (49.24775, 4.05645),
    "maison-blanche": (49.23331, 4.01850),
    "cernay-jean-jaures": (49.25916, 4.04914),
    "courlancy": (49.24410, 4.01746),
    "chatillons": (49.22650, 4.03620),
}


def _seed_coords() -> dict[str, tuple[float, float]]:
    return {
        str(r["slug"]): (float(r["latitude"]), float(r["longitude"]))
        for r in REIMS_NEIGHBORHOOD_SEED
        if r.get("latitude") is not None and r.get("longitude") is not None
    }


def test_reviewed_centroids_locked() -> None:
    coords = _seed_coords()
    for slug, expected in REVIEWED_CENTROIDS.items():
        assert coords.get(slug) == expected, (
            f"{slug}: {coords.get(slug)} != {expected} -- centroide modifie. "
            "Re-verifier qu'il tombe dans Reims (reverse-geocode) AVANT de mettre a jour ce lock."
        )


def test_active_centroids_within_reims_bbox() -> None:
    coords = _seed_coords()
    for slug in REVIEWED_CENTROIDS:
        lat, lon = coords[slug]
        assert REIMS_LAT[0] <= lat <= REIMS_LAT[1], f"{slug} latitude {lat} hors bbox Reims"
        assert REIMS_LON[0] <= lon <= REIMS_LON[1], f"{slug} longitude {lon} hors bbox Reims"
