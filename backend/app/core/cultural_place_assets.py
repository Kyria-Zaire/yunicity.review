"""Cultural place media conventions — Yunicity-owned, prod-safe (PROD-DATA-05C)."""

from __future__ import annotations

REIMS_CITY_SLUG = "reims"
CULTURAL_PLACE_COVER_FILENAME = "cover.jpg"
DEV_PUBLIC_CULTURAL_MEDIA_PREFIX = f"/places/{REIMS_CITY_SLUG}"

REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS: tuple[str, ...] = (
    "cathedrale-notre-dame",
    "palais-du-tau",
    "basilique-saint-remi",
    "musee-saint-remi",
    "musee-des-beaux-arts",
    "porte-de-mars",
    "cryptoportique",
    "opera-de-reims",
    "halles-boulingrin",
    "parc-de-champagne",
    "planetarium-de-reims",
    "frac-grand-est",
    # QUARTIER-01 phase 1. Cette liste pilote `official_only` du seed : un slug absent
    # d'ici est ignore en silence, meme s'il est defini dans REIMS_CULTURAL_PLACES_SEED.
    # Le garde-fou de reims_cultural_places_catalog compte les lieux actifs et leve une
    # RuntimeError si le total ne correspond pas a len() de ce tuple — il s'ajuste donc
    # tout seul et verifiera que les 11 ajouts ont bien ete crees.
    #
    # Cinq etaient deja definis dans le seed sans avoir jamais ete appliques en prod :
    "place-royale",
    "place-erlon",
    "bibliotheque-carnegie",
    "villa-demoiselle",
    "domaine-pommery",
    # Six creations :
    "basilique-sainte-clotilde",
    "eglise-saint-jean-baptiste-neuvillette",
    "porte-de-paris",
    "eglise-saint-andre",
    "hotel-de-ville",
    "stade-auguste-delaune",
)


def cultural_place_dev_public_cover_url(slug: str) -> str:
    normalized = slug.strip().lower()
    return f"{DEV_PUBLIC_CULTURAL_MEDIA_PREFIX}/{normalized}/{CULTURAL_PLACE_COVER_FILENAME}"


# cultural_place_seed_cover_url() a ete supprimee (#145). Elle construisait
# {web_frontend_url}/places/reims/{slug}/cover.jpg pour le seed prod — une URL qui renvoie
# 404, l'app web ne servant pas ces chemins. La supprimer plutot que de la laisser inutilisee
# est volontaire : une fonction absente ne peut pas etre rappelee par erreur en croyant
# reparer un oubli. Les couvertures de prod viennent de scripts/seed_prod_01b_upload_media.py,
# seul endroit qui connait l'URL CDN reelle.
