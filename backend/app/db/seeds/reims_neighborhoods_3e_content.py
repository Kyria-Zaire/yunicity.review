"""Contenu editorial des 3 quartiers crees (QUARTIER-01 phase 3e).

Meme convention que la phase 3d (reims_neighborhoods_3d_content) et applique par le meme
_apply_editorial_row, PAR-DESSUS le contenu de base. Source : documents fournis par le Founder.

Difference avec 3d : ces 3 quartiers sont *nouveaux* (crees en 3b), donc il n'y a pas d'ancien
long_story a ecraser. long_story et featured_quote vivent directement dans l'entree du tuple
REIMS_NEIGHBORHOOD_V2_EDITORIAL ; ce module ne porte que les colonnes qui n'ont pas de place
dans le tuple : official_label, ambiance, short_description et les 6 colonnes 3a.

Conventions (identiques a 3d) :
- official_label = nom officiel long ; chatillons n'a pas de forme composee -> official_label =
  son display_name ("Chatillons") pour eviter le placeholder generique "Quartier officiel".
- ambiance : enum NeighborhoodAmbiance. chatillons est en lively (vie associative / jeunesse) :
  aucune valeur ne capte "solidaire / en renouvellement" (meme trou que clairmarais en 3d).
- Landmarks : PAS ici (table neighborhood_landmarks, seed dedie). chatillons n'a aucun
  cultural_place source -> aucun landmark (decision 3e, validee par le Founder).

Garde-fous a l'import : reutilise EDITORIAL_3D_FIELDS (meme jeu de colonnes que 3d) — cle
inconnue ou official_label trop long = erreur immediate, pas donnee silencieuse en base.
"""

from __future__ import annotations

from typing import Any

from app.core.neighborhood_constants import NeighborhoodAmbiance
from app.db.seeds.reims_neighborhoods_3d_content import EDITORIAL_3D_FIELDS
from app.models.neighborhood import Neighborhood

REIMS_NEIGHBORHOOD_3E_CONTENT: dict[str, dict[str, Any]] = {
    "chatillons": {
        # Pas de nom compose -> official_label = display_name (evite le placeholder generique).
        "official_label": "Châtillons",
        "ambiance": NeighborhoodAmbiance.LIVELY.value,
        "short_description": (
            "Quartier du sud en renouvellement urbain, à la vie associative forte et à la "
            "population jeune."
        ),
        "audience": (
            "Familles, jeunes, associations, entrepreneurs locaux, acteurs de la vie de quartier"
        ),
        "neighborhood_type": "Quartier résidentiel en renouvellement urbain",
        "local_life": (
            "Commerces alimentaires, boulangeries, pharmacies, cafés, supermarchés, écoles, "
            "services publics, équipements sportifs, associations, structures jeunesse"
        ),
        "green_spaces": (
            "Parc des Châtillons, jardins publics, terrains de sport, aires de jeux, pistes "
            "piétonnes, espaces de rencontre"
        ),
        "mobility": (
            "Réseau CITURA, pistes cyclables, accès rapide au Centre-Ville, stationnements "
            "publics, bonne connexion avec les quartiers voisins"
        ),
        "daily_life": (
            "Fêtes de quartier, brocantes, ateliers citoyens, animations jeunesse, événements "
            "sportifs, spectacles, marchés solidaires, initiatives locales"
        ),
    },
    "courlancy": {
        "official_label": "Courlancy – Porte de Paris – Bois d'Amour",
        "ambiance": NeighborhoodAmbiance.GREEN.value,
        "short_description": (
            "Quartier du sud-ouest entre stade, parcs et Bois d'Amour — équilibre nature, "
            "sport et santé."
        ),
        "audience": "Familles, sportifs, étudiants, professionnels de santé, jeunes actifs",
        "neighborhood_type": "Quartier résidentiel, sportif et patrimonial",
        "local_life": (
            "Restaurants, boulangeries, pharmacies, cabinets médicaux, commerces alimentaires, "
            "salles de sport, cafés, supermarchés, services de proximité"
        ),
        "green_spaces": (
            "Parc Léo Lagrange, Bois d'Amour, jardins résidentiels, promenades, pistes "
            "cyclables, espaces sportifs extérieurs, aires de jeux"
        ),
        "mobility": (
            "Tramway A, réseau CITURA, pistes cyclables, station Zébullo, accès rapide à "
            "Bezannes, accès direct au Centre-Ville, parkings publics, accès A4"
        ),
        "daily_life": (
            "Matchs du Stade de Reims, événements sportifs, courses à pied, activités dans le "
            "parc, fêtes de quartier, brocantes, événements scolaires, animations associatives"
        ),
    },
    "cernay-jean-jaures": {
        "official_label": "Cernay – Jamin – Jean-Jaurès – Épinettes",
        "ambiance": NeighborhoodAmbiance.LIVELY.value,
        "short_description": (
            "Quartier vivant du nord-est : marché historique, commerces indépendants et cafés "
            "de quartier."
        ),
        "audience": "Habitants, familles, étudiants, commerçants, jeunes actifs",
        "neighborhood_type": "Quartier résidentiel et commerçant",
        "local_life": (
            "Commerces indépendants, boulangeries artisanales, cafés, restaurants, boucheries, "
            "épiceries fines, pharmacies, librairies, fleuristes, artisans locaux"
        ),
        "green_spaces": (
            "Square des Victimes de la Gestapo, petits jardins de proximité, promenades "
            "arborées, espaces de détente du quartier"
        ),
        "mobility": (
            "Réseau CITURA, plusieurs lignes de bus, nombreuses pistes cyclables, accès rapide "
            "au Centre-Ville, stations Zébullo, stationnements publics"
        ),
        "daily_life": (
            "Marché du Boulingrin, animations commerciales, brocantes, marchés artisanaux, "
            "événements associatifs, fêtes de quartier, terrasses animées"
        ),
    },
}


# --- Garde-fous a l'import (identiques a 3d, reutilisent EDITORIAL_3D_FIELDS) ---

_OFFICIAL_LABEL_MAX_LENGTH = 64  # Neighborhood.official_label = String(64)

for _field in EDITORIAL_3D_FIELDS:
    if not hasattr(Neighborhood, _field):
        raise AttributeError(
            f"EDITORIAL_3D_FIELDS reference {_field!r}, absent du modele Neighborhood"
        )

for _slug, _row in REIMS_NEIGHBORHOOD_3E_CONTENT.items():
    _unknown = set(_row) - set(EDITORIAL_3D_FIELDS)
    if _unknown:
        raise ValueError(
            f"contenu 3e {_slug!r} : champs inconnus {sorted(_unknown)} "
            f"(autorises : {sorted(EDITORIAL_3D_FIELDS)})"
        )
    _label = _row.get("official_label")
    if _label is not None and len(_label) > _OFFICIAL_LABEL_MAX_LENGTH:
        raise ValueError(
            f"contenu 3e {_slug!r} : official_label de {len(_label)} caracteres "
            f"depasse {_OFFICIAL_LABEL_MAX_LENGTH}"
        )
