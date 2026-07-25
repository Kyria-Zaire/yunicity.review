"""QUARTIER-01 — landmarks des 9 quartiers reutilises (lot posterieur a 3e).

Invariants purs (sans DB) : verrouillent le mapping EXACT valide par le Founder, independamment
du dict de seed. Les tests data-driven de 3e (test_3e_landmarks_linked, test_3e_idempotent)
verifient deja que la base reflete le dict et que le reseed n'accumule pas ; ici on verifie que
le dict EST le mapping convenu -- une assignation valide mais fausse (p. ex. cathedrale rangee
sous saint-remi) passerait les tests data-driven, le dict y etant sa propre reference.

Methode (validee en DESIGN) : liste "Les incontournables" du doc editorial 3d de chaque quartier,
croisee avec le catalogue des 23 lieux officiels ; l'ordre suit celui de la liste. 4 quartiers
recoupent le catalogue, 5 non -> pas de landmark force (meme traitement que chatillons).
"""

from __future__ import annotations

from app.db.seeds.reims_neighborhood_landmarks import REIMS_NEIGHBORHOOD_LANDMARKS

# Reference litterale, independante du dict de seed : c'est la decision validee par le Founder.
_EXPECTED_9_REUSED_LANDMARKS: dict[str, tuple[str, ...]] = {
    "centre-ville": (
        "cathedrale-notre-dame",
        "place-erlon",
        "porte-de-mars",
        "cryptoportique",
        "place-royale",
        "opera-de-reims",
        "hotel-de-ville",
    ),
    "saint-remi": ("basilique-saint-remi", "musee-saint-remi", "parc-de-champagne"),
    "maison-blanche": ("basilique-sainte-clotilde",),
    "la-neuvillette": ("eglise-saint-jean-baptiste-neuvillette",),
}

# 5 quartiers reutilises sans recoupement incontournables x catalogue : aucune entree. murigny
# inclus -> ses incontournables (lac / parc / complexe sportif) sont hors catalogue, et le
# planetarium (rattache par FK) n'est pas dans ses incontournables : pas de landmark force.
_REUSED_WITHOUT_LANDMARKS = ("murigny", "chemin-vert", "croix-rouge", "orgeval", "clairmarais")


def test_9_reused_landmark_mapping_matches_validated_decision() -> None:
    for slug, expected in _EXPECTED_9_REUSED_LANDMARKS.items():
        assert REIMS_NEIGHBORHOOD_LANDMARKS.get(slug) == expected, slug


def test_9_reused_neighborhoods_without_landmarks_have_no_entry() -> None:
    for slug in _REUSED_WITHOUT_LANDMARKS:
        assert slug not in REIMS_NEIGHBORHOOD_LANDMARKS, slug
