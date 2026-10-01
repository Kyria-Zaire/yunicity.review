"""Contenu editorial des 9 quartiers reutilises (QUARTIER-01 phase 3d).

Source : documents fournis par le Founder. Applique par _apply_editorial_row (seed v2
editorial) PAR-DESSUS le contenu de base, donc il ne touche ni les moods, ni la timeline,
ni les aliases (geres par REIMS_NEIGHBORHOOD_V2_EDITORIAL) — point 4 du ticket 3d.

Conventions (validees en DESIGN 3d) :
- official_label = nom officiel long ; display_name (nom court affiche) reste inchange.
  murigny et centre-ville n'ont pas de forme composee -> official_label = leur display_name
  ("Murigny", "Centre-ville"). On NE laisse PAS le champ vide : le detail service retombe
  sinon sur le placeholder "Quartier officiel" (official_label non-nullable dans l'API), ce
  qui afficherait un libelle generique en prod (decision 3d, option A validee par le Founder).
- ambiance : enum NeighborhoodAmbiance (calm/lively/cultural/student/green), valeur la plus
  proche. clairmarais est en lively faute de valeur "affaires/tertiaire" dans l'enum (dette).
- La phrase d'identite ("X, Y, Z et W.") ouvre long_story ; elle n'est ni dans
  neighborhood_type ni dans l'enum ambiance.
- long_story / short_description sont REECRITS ici (ils remplacent le contenu editorial de
  base pour ces 9 quartiers) ; les 3 fusionnes gardent leur long_story du tuple v2.
- Landmarks / incontournables : PAS ici, c'est 3e.

Les valeurs sont ecrites directement sur le modele par le seed (sans passer par la validation
service). Deux garde-fous a l'import ci-dessous transforment une faute de frappe en erreur
immediate plutot qu'en donnee silencieuse : cle inconnue, ou official_label trop long.
"""

from __future__ import annotations

from typing import Any

from app.core.neighborhood_constants import NeighborhoodAmbiance
from app.models.neighborhood import Neighborhood

# Colonnes texte que la phase 3d peut ecrire. Toute autre cle dans une entree est une faute.
EDITORIAL_3D_FIELDS: tuple[str, ...] = (
    "official_label",
    "ambiance",
    "short_description",
    "long_story",
    "audience",
    "neighborhood_type",
    "local_life",
    "green_spaces",
    "mobility",
    "daily_life",
)

REIMS_NEIGHBORHOOD_3D_CONTENT: dict[str, dict[str, Any]] = {
    "chemin-vert": {
        "official_label": "Chemin Vert – Europe",
        "ambiance": NeighborhoodAmbiance.CULTURAL.value,
        "short_description": (
            "La Cité-jardin classée et le patrimoine du XXᵉ siècle, entre secteur Europe "
            "et axe Clemenceau."
        ),
        "long_story": (
            "Résidentiel, historique, familial et verdoyant. Le quartier Europe – "
            "Chemin-Vert – Clemenceau est un territoire aux identités complémentaires. Il "
            "associe la Cité-jardin du Chemin-Vert, référence nationale de l'urbanisme du "
            "XXᵉ siècle, le secteur résidentiel d'Europe et l'axe Clemenceau, qui relie "
            "efficacement le nord-est au centre de Reims."
        ),
        "audience": "Familles, jeunes actifs, seniors, passionnés d'architecture, associations",
        "neighborhood_type": "Quartier résidentiel avec patrimoine remarquable",
        "local_life": (
            "Commerces alimentaires, boulangeries, pharmacies, supermarchés, restaurants, "
            "écoles, centres médicaux, équipements sportifs, associations, services de proximité"
        ),
        "green_spaces": (
            "Jardins de la Cité-jardin, squares résidentiels, promenades arborées, pistes "
            "cyclables, aires de jeux, espaces de détente"
        ),
        "mobility": (
            "Réseau CITURA, pistes cyclables, accès rapide au Centre-Ville, accès vers les "
            "quartiers nord-est, stationnements publics, mobilité douce"
        ),
        "daily_life": (
            "Fêtes de quartier, journées du patrimoine, marchés, animations associatives, "
            "expositions, événements familiaux, activités sportives, ateliers citoyens"
        ),
    },
    "saint-remi": {
        "official_label": "Barbâtre – Saint-Remi – Verrerie",
        "ambiance": NeighborhoodAmbiance.CULTURAL.value,
        "short_description": (
            "Patrimoine UNESCO, grandes maisons de Champagne et équipements culturels au "
            "sud-est du centre."
        ),
        "long_story": (
            "Historique, culturel, élégant et résidentiel. Le quartier Barbâtre – Saint-Remi "
            "– Verrerie est situé au sud-est du Centre-Ville. Il réunit un patrimoine "
            "exceptionnel, de grandes maisons de Champagne, des quartiers résidentiels "
            "historiques et des équipements culturels majeurs."
        ),
        "audience": "Habitants, touristes, étudiants, amateurs de patrimoine, professionnels",
        "neighborhood_type": "Quartier patrimonial et touristique",
        "local_life": (
            "Commerces de proximité, restaurants, boulangeries, cavistes, hôtels, cafés, "
            "artisans, services, équipements culturels"
        ),
        "green_spaces": (
            "Parc de Champagne, jardins de la Basilique, promenades arborées, pistes "
            "cyclables, espaces familiaux"
        ),
        "mobility": (
            "Réseau CITURA, tramway à proximité, pistes cyclables, stations Zébullo, accès "
            "rapide au Centre-Ville, stationnements publics, itinéraires touristiques"
        ),
        "daily_life": (
            "Visites guidées, Journées européennes du patrimoine, dégustations de Champagne, "
            "expositions, concerts, événements au Parc de Champagne, animations "
            "associatives, marchés"
        ),
    },
    "croix-rouge": {
        "official_label": "Croix-Rouge – Hauts de Murigny",
        "ambiance": NeighborhoodAmbiance.STUDENT.value,
        "short_description": (
            "Le grand quartier universitaire de Reims — campus, Sciences Po et vie étudiante."
        ),
        "long_story": (
            "Étudiant, dynamique, cosmopolite et sportif. Le quartier Croix-Rouge – "
            "Hauts-de-Murigny est le plus grand quartier universitaire de Reims. Il accueille "
            "des milliers d'étudiants, plusieurs établissements d'enseignement supérieur, des "
            "équipements sportifs majeurs et un important tissu associatif. Les Hauts-de-"
            "Murigny apportent une dimension plus résidentielle."
        ),
        "audience": "Étudiants, enseignants, chercheurs, familles, associations",
        "neighborhood_type": "Quartier universitaire et résidentiel",
        "local_life": (
            "Restaurants étudiants, cafés, boulangeries, supermarchés, résidences "
            "étudiantes, pharmacies, salles de sport, banques, commerces, services "
            "universitaires"
        ),
        "green_spaces": (
            "Jardins universitaires, promenades, terrains de sport, espaces de détente, "
            "pistes cyclables, squares des Hauts-de-Murigny"
        ),
        "mobility": (
            "Tramway A, Tramway B, réseau CITURA, stations Zébullo, nombreuses pistes "
            "cyclables, accès rapide au Centre-Ville, connexion avec Bezannes, "
            "stationnements publics"
        ),
        "daily_life": (
            "Rentrée étudiante, soirées étudiantes, conférences, forums associatifs, "
            "compétitions sportives, festivals étudiants, journées portes ouvertes, "
            "événements culturels"
        ),
    },
    "murigny": {
        # Pas de nom compose -> official_label = display_name (evite le placeholder generique).
        "official_label": "Murigny",
        "ambiance": NeighborhoodAmbiance.GREEN.value,
        "short_description": (
            "Un cadre résidentiel au sud-ouest, entre lac, parc et équipements familiaux."
        ),
        "long_story": (
            "Résidentiel, vert, familial et paisible. Le quartier Murigny est situé au "
            "sud-ouest de Reims. Il est reconnu pour son équilibre entre habitat, nature, "
            "équipements publics et vie familiale. Plus calme que le Centre-Ville, il offre "
            "un cadre de vie recherché."
        ),
        "audience": "Familles, jeunes actifs, étudiants, seniors",
        "neighborhood_type": "Grand quartier résidentiel",
        "local_life": (
            "Supermarchés, boulangeries, pharmacies, restaurants, cabinets médicaux, "
            "commerces alimentaires, banques, services publics, écoles, équipements sportifs"
        ),
        "green_spaces": (
            "Lac de Murigny, Parc de Murigny, jardins publics, promenades arborées, pistes "
            "cyclables, aires de jeux"
        ),
        "mobility": (
            "Réseau CITURA, tramway A à proximité selon les secteurs, pistes cyclables, "
            "stations Zébullo, accès rapide à Bezannes, accès rapide au Centre-Ville, "
            "stationnements publics"
        ),
        "daily_life": (
            "Fêtes de quartier, événements sportifs, brocantes, animations associatives, "
            "activités familiales, marchés, manifestations culturelles, événements scolaires"
        ),
    },
    "maison-blanche": {
        "official_label": "Maison-Blanche – Sainte-Anne – Wilson",
        "ambiance": NeighborhoodAmbiance.CALM.value,
        "short_description": (
            "Quartier résidentiel du sud, entre CHU, campus santé et espaces verts."
        ),
        "long_story": (
            "Familial, résidentiel, étudiant et solidaire. Le quartier Maison-Blanche – "
            "Sainte-Anne – Wilson est situé au sud de Reims. Il est l'un des secteurs les "
            "plus complets de la ville, mêlant patrimoine, santé, enseignement, espaces "
            "verts, commerces et vie résidentielle. Il accueille notamment le CHU de Reims."
        ),
        "audience": "Familles, étudiants, professionnels de santé, enseignants, seniors",
        "neighborhood_type": "Quartier résidentiel avec pôles santé et enseignement",
        "local_life": (
            "Pharmacies, cabinets médicaux, restaurants, boulangeries, commerces "
            "alimentaires, supermarchés, écoles, universités, cafés, services publics"
        ),
        "green_spaces": (
            "Parc Saint-Remi, jardins publics, promenades arborées, terrains sportifs, "
            "aires de jeux, pistes cyclables"
        ),
        "mobility": (
            "Tramway A, réseau CITURA, pistes cyclables, stations Zébullo, accès rapide au "
            "Centre-Ville, accès rapide au CHU, stationnement public"
        ),
        "daily_life": (
            "Événements universitaires, animations étudiantes, activités associatives, "
            "événements sportifs, marchés, brocantes, fêtes de quartier, journées santé, "
            "manifestations culturelles"
        ),
    },
    "la-neuvillette": {
        "official_label": "La Neuvillette – Trois-Fontaines",
        "ambiance": NeighborhoodAmbiance.CALM.value,
        "short_description": (
            "Ancien village au nord-ouest, esprit de proximité et cadre paisible."
        ),
        "long_story": (
            "Calme, familial, résidentiel, esprit village. Le quartier La Neuvillette – "
            "Trois Fontaines est situé au nord-ouest de Reims. Ancien village devenu quartier "
            "de la ville, il a conservé une identité forte, un esprit de proximité et un "
            "cadre de vie paisible."
        ),
        "audience": "Familles, jeunes couples, seniors, associations, artisans",
        "neighborhood_type": "Quartier résidentiel et pavillonnaire",
        "local_life": (
            "Boulangeries, pharmacies, supermarchés, restaurants, cafés, artisans, "
            "commerces alimentaires, écoles, services publics, associations"
        ),
        "green_spaces": (
            "Parc des Trois Fontaines, jardins publics, promenades, aires de jeux, terrains "
            "sportifs, pistes cyclables"
        ),
        "mobility": (
            "Réseau CITURA, pistes cyclables, stationnement résidentiel, accès rapide à la "
            "rocade, liaison rapide vers le Centre-Ville, accès aux zones commerciales nord"
        ),
        "daily_life": (
            "Fêtes de quartier, brocantes, événements scolaires, activités associatives, "
            "animations familiales, tournois sportifs, marchés saisonniers"
        ),
    },
    "orgeval": {
        "official_label": "Laon-Zola – Neufchâtel – Orgeval",
        "ambiance": NeighborhoodAmbiance.LIVELY.value,
        "short_description": (
            "Quatre secteurs contrastés au nord — axe commerçant de Laon et renouvellement urbain."
        ),
        "long_story": (
            "Populaire, dynamique, familial et solidaire. Ce quartier est l'un des plus "
            "vastes et les plus contrastés de Reims. Il réunit quatre secteurs : Laon (axe "
            "commercial), Zola (résidentiel historique), Neufchâtel (familial et "
            "pavillonnaire), Orgeval (renouvellement urbain, dynamique associatif)."
        ),
        "audience": "Familles, jeunes, étudiants, commerçants, associations, seniors",
        "neighborhood_type": "Quartier résidentiel, commerçant et en renouvellement urbain",
        "local_life": (
            "Nombreux commerces, supermarchés, restaurants, boulangeries, pharmacies, "
            "écoles, équipements sportifs, centres sociaux, services publics, marchés"
        ),
        "green_spaces": (
            "Parc d'Orgeval, squares de quartier, aires de jeux, jardins publics, "
            "promenades, terrains sportifs"
        ),
        "mobility": (
            "Tramway A, Tramway B, bus CITURA, pistes cyclables, stations Zébullo, gare à "
            "proximité selon les secteurs, accès rapide au centre-ville"
        ),
        "daily_life": (
            "Fêtes de quartier, événements associatifs, marchés, brocantes, animations "
            "jeunesse, tournois sportifs, manifestations culturelles, ateliers citoyens"
        ),
    },
    "clairmarais": {
        "official_label": "Clairmarais – Charles Arnould",
        # lively faute de valeur "affaires/tertiaire" dans l'enum ambiance (dette signalee 3d).
        "ambiance": NeighborhoodAmbiance.LIVELY.value,
        "short_description": (
            "Quartier d'affaires et de mobilité autour de la gare, entre Clairmarais et "
            "Charles-Arnould."
        ),
        "long_story": (
            "Moderne, connecté, résidentiel et professionnel. Le quartier Clairmarais – "
            "Charles Arnould se situe au nord-ouest du Centre-Ville, autour de l'arrière de "
            "la gare. Il a une identité double : Clairmarais (moderne, connecté, tertiaire) "
            "et Charles Arnould (résidentiel, patrimonial)."
        ),
        "audience": "Habitants, salariés, voyageurs, étudiants, familles, entrepreneurs",
        "neighborhood_type": "Quartier d'affaires, de mobilité et de vie quotidienne",
        "local_life": (
            "Boulangeries, supérettes, restaurants, hôtels, cafés, pharmacies, services "
            "administratifs, espaces de formation, activités sportives, associations, "
            "services aux entreprises"
        ),
        "green_spaces": (
            "Square Alexandre-Henrot, Square Charles-Arnould, jardins résidentiels, espaces "
            "arborés de la cité-jardin, petites aires de jeux, cheminements piétons"
        ),
        "mobility": (
            "Gare SNCF de Reims, trains TER et TGV, tramway à proximité, réseau CITURA, "
            "accès rapide au Centre-Ville, stations vélo, pistes cyclables, taxis/VTC, "
            "parkings gare, connexion A4"
        ),
        "daily_life": (
            "Animations Maison de quartier, ateliers familiaux, activités sportives, "
            "vide-greniers, rencontres habitants, événements scolaires, formations, portes "
            "ouvertes, événements professionnels, initiatives associatives"
        ),
    },
    "centre-ville": {
        # Pas de nom compose -> official_label = display_name (evite le placeholder generique).
        "official_label": "Centre-ville",
        "ambiance": NeighborhoodAmbiance.LIVELY.value,
        "short_description": "Le cœur historique, commercial et touristique de Reims.",
        "long_story": (
            "Historique, prestige, vivant, touristique et urbain. Le Centre-Ville est le "
            "cœur historique, économique, culturel et touristique de Reims. C'est le "
            "quartier le plus fréquenté de la ville."
        ),
        "audience": "Habitants, touristes, étudiants, salariés, visiteurs",
        "neighborhood_type": "Centre historique et commercial",
        "local_life": (
            "Shopping, restaurants gastronomiques, fast-foods, bars, rooftops, salons de "
            "thé, hôtels, cinémas, banques, commerces indépendants, grandes enseignes, "
            "marchés saisonniers"
        ),
        "green_spaces": "Les Hautes Promenades, les Basses Promenades, Square Colbert",
        "mobility": (
            "Gare Centre, Tramway A, Tramway B, réseau CITURA, stations Zébullo, taxis, "
            "parkings souterrains, bornes de recharge"
        ),
        "daily_life": (
            "Concerts, expositions, festivals, Marché de Noël, Fêtes Johanniques, "
            "spectacles, animations estivales"
        ),
    },
}


# --- Garde-fous a l'import (fail-fast) : une faute devient une erreur au chargement du
#     module, pas une donnee silencieuse en base. ---

_OFFICIAL_LABEL_MAX_LENGTH = 64  # Neighborhood.official_label = String(64)

# 1. Chaque champ autorise doit exister sur le modele (attrape un renommage de colonne).
for _field in EDITORIAL_3D_FIELDS:
    if not hasattr(Neighborhood, _field):
        raise AttributeError(
            f"EDITORIAL_3D_FIELDS reference {_field!r}, absent du modele Neighborhood"
        )

# 2. Chaque entree ne contient que des champs autorises, et official_label tient dans la
#    colonne (asyncpg leverait sinon une StringDataRightTruncation au seed en prod).
for _slug, _row in REIMS_NEIGHBORHOOD_3D_CONTENT.items():
    _unknown = set(_row) - set(EDITORIAL_3D_FIELDS)
    if _unknown:
        raise ValueError(
            f"contenu 3d {_slug!r} : champs inconnus {sorted(_unknown)} "
            f"(autorises : {sorted(EDITORIAL_3D_FIELDS)})"
        )
    _label = _row.get("official_label")
    if _label is not None and len(_label) > _OFFICIAL_LABEL_MAX_LENGTH:
        raise ValueError(
            f"contenu 3d {_slug!r} : official_label de {len(_label)} caracteres "
            f"depasse {_OFFICIAL_LABEL_MAX_LENGTH}"
        )
