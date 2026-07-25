"""Reims emblematic cultural places seed (WEB-MAP-03, WEB-SEARCH-02B.1)."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.cultural_place_assets import REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS
from app.db.seeds.reims_cultural_media import REIMS_CULTURAL_MEDIA_BY_SLUG
from app.models.cultural_place import CulturalPlace
from app.models.neighborhood import Neighborhood
from app.services.cultural_media import normalize_cultural_media

logger = logging.getLogger(__name__)

REIMS_CITY = "Reims"

_SOURCE = "Catalogue éditorial Yunicity — médias Wikimedia Commons"
_SOURCE_URL = "https://commons.wikimedia.org/"
_PROD_SOURCE = "Catalogue éditorial Yunicity"

_OFFICIAL_FEATURED_SLUGS = frozenset(
    {
        "cathedrale-notre-dame",
        "palais-du-tau",
        "basilique-saint-remi",
        "musee-des-beaux-arts",
        "opera-de-reims",
        "frac-grand-est",
    }
)

REIMS_CULTURAL_PLACES_SEED: tuple[dict[str, Any], ...] = (
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000001"),
        "slug": "cathedrale-notre-dame",
        "name": "Cathédrale Notre-Dame de Reims",
        "short_description": "Chef-d’œuvre gothique et lieu de sacre des rois de France.",
        "description": (
            "Monument emblématique de Reims, classé au patrimoine mondial. "
            "Point de départ idéal pour découvrir le centre historique."
        ),
        "address": "Place du Cardinal Luçon",
        "latitude": 49.2538,
        "longitude": 4.0340,
        "category": "cathedral",
        "neighborhood_slug": "centre-ville",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000002"),
        "slug": "palais-du-tau",
        "name": "Palais du Tau",
        "short_description": "Ancienne résidence des archevêques, face à la cathédrale.",
        "description": "Musée et architecture médiévale au cœur du parcours royal de Reims.",
        "address": "2 Place du Cardinal Luçon",
        "latitude": 49.2536,
        "longitude": 4.0348,
        "category": "museum",
        "neighborhood_slug": "centre-ville",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000003"),
        "slug": "basilique-saint-remi",
        "name": "Basilique Saint-Remi",
        "short_description": "Basilique romane et nécropole royale, quartier Saint-Remi.",
        "description": "Un des plus grands édifices religieux de style roman en France.",
        "address": "1 Rue Simon",
        "latitude": 49.24306,
        "longitude": 4.04194,
        "category": "heritage",
        "neighborhood_slug": "saint-remi",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000004"),
        "slug": "musee-saint-remi",
        "name": "Musée Saint-Remi",
        "short_description": "Collections archéologiques et histoire de Reims.",
        "description": (
            "Installé dans l’ancienne abbaye, complément naturel de la basilique voisine."
        ),
        "address": "53 Rue Simon",
        "latitude": 49.2436,
        "longitude": 4.0414,
        "category": "museum",
        "neighborhood_slug": "saint-remi",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000005"),
        "slug": "porte-de-mars",
        "name": "Porte de Mars",
        "short_description": "Arc de triomphe gallo-romain au centre-ville.",
        "description": "Monument antique parmi les mieux conservés du nord de la Gaule.",
        "address": "Place de la République",
        "latitude": 49.26061,
        "longitude": 4.02994,
        "category": "monument",
        "neighborhood_slug": "centre-ville",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000006"),
        "slug": "halles-boulingrin",
        "name": "Halles du Boulingrin",
        "short_description": "Marché couvert et architecture des années 1920.",
        "description": "Lieu de vie locale, marché et événements autour du Boulingrin.",
        "address": "34 Rue de Mars",
        "latitude": 49.26034,
        "longitude": 4.03203,
        "category": "market",
        # Reaffecte de boulingrin vers le quartier fusionne (QUARTIER-01 phase 3b). Le seed
        # met a jour neighborhood_id (dans _MEDIA_SYNC_FIELDS) sans toucher la cover CDN
        # deja posee (protegee par _UPLOAD_OWNED_MEDIA_FIELDS, #144).
        "neighborhood_slug": "cernay-jean-jaures",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000007"),
        "slug": "place-royale",
        "name": "Place Royale",
        "short_description": "Place classique au cœur du centre, commerces et terrasses.",
        "description": "Perspective ordonnée typique du XVIIIe siècle, proche de la cathédrale.",
        "address": "Place Royale",
        "latitude": 49.25552,
        "longitude": 4.03413,
        "category": "square",
        "neighborhood_slug": "centre-ville",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000008"),
        "slug": "place-erlon",
        "name": "Place d’Erlon",
        "short_description": "Artère commerçante et animée du centre de Reims.",
        "description": "Grande perspective urbaine entre gare et centre historique.",
        "address": "Place Drouet d’Erlon",
        "latitude": 49.2555,
        "longitude": 4.0258,
        "category": "square",
        "neighborhood_slug": "centre-ville",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000009"),
        "slug": "bibliotheque-carnegie",
        "name": "Bibliothèque Carnegie",
        "short_description": "Bibliothèque patrimoniale offerte par Andrew Carnegie.",
        "description": "Architecture éclectique et salon de lecture remarquable.",
        "address": "2 Place Carnegie",
        "latitude": 49.25297,
        "longitude": 4.03544,
        "category": "library",
        "neighborhood_slug": "saint-remi",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000010"),
        "slug": "villa-demoiselle",
        "name": "Villa Demoiselle",
        "short_description": "Villa Art nouveau et jardins, colline de Reims.",
        "description": "Demeure historique liée au patrimoine marnais de la ville.",
        "address": "56 Boulevard Henry Vasnier",
        "latitude": 49.24345,
        "longitude": 4.04972,
        "category": "heritage",
        "neighborhood_slug": "saint-remi",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000011"),
        "slug": "domaine-pommery",
        "name": "Domaine Pommery",
        "short_description": "Maison de champagne et crayères classées.",
        "description": "Visites des caves et architecture industrielle emblématique.",
        "address": "5 Place du Général Gouraud",
        "latitude": 49.24408,
        "longitude": 4.05007,
        "category": "winery",
        "neighborhood_slug": "saint-remi",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000012"),
        "slug": "opera-de-reims",
        "name": "Opéra de Reims",
        "short_description": "Scène nationale et façade néoclassique sur la place du Forum.",
        "description": "Programmation vivante au cœur du centre historique.",
        "address": "13 Rue Chanzy",
        "latitude": 49.25348,
        "longitude": 4.03107,
        "category": "theatre",
        "neighborhood_slug": "centre-ville",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000013"),
        "slug": "parc-de-champagne",
        "name": "Parc de Champagne",
        "short_description": "Grand parc urbain au sud de Reims, verdure et panoramas.",
        "description": "Promenades, jardins et vue sur la ville depuis les hauteurs.",
        "address": "Avenue du Général Giraud",
        "latitude": 49.23852,
        "longitude": 4.05499,
        "category": "park",
        "neighborhood_slug": "saint-remi",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000014"),
        "slug": "musee-des-beaux-arts",
        "name": "Musée des Beaux-Arts",
        "short_description": "Collections des XVe au XXIe siècles dans un palais du XVIIIe.",
        "description": "Peintures, sculptures et arts décoratifs au cœur de Reims.",
        "address": "8 Rue Chanzy",
        "latitude": 49.25333,
        "longitude": 4.03093,
        "category": "museum",
        "neighborhood_slug": "centre-ville",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000015"),
        "slug": "cryptoportique",
        "name": "Cryptoportique",
        "short_description": "Galerie gallo-romaine sous la place du Forum.",
        "description": "Mémoire souterraine de Durocortorum, accessible au public.",
        "address": "Place du Forum",
        "latitude": 49.25663,
        "longitude": 4.03391,
        "category": "heritage",
        "neighborhood_slug": "centre-ville",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000016"),
        "slug": "planetarium-de-reims",
        "name": "Planétarium de Reims",
        "short_description": "Découverte des étoiles et des sciences au cœur de Reims.",
        "description": (
            "Espace de médiation scientifique pour les familles et les curieux du ciel."
        ),
        "address": "49 avenue du Général de Gaulle",
        "latitude": 49.24285,
        "longitude": 4.01563,
        "category": "museum",
        # Rattachement corrige murigny -> maison-blanche : OSM point-in-polygon des coords
        # (verifiees correctes vs Wikipedia) place le planetarium dans "Cite-Jardin de la
        # Maison Blanche / La Haubette". murigny etait a 3,56 km (2e quartier le plus loin).
        "neighborhood_slug": "maison-blanche",
        "is_featured": False,
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000017"),
        "slug": "frac-grand-est",
        "name": "FRAC Champagne-Ardenne",
        "short_description": "Art contemporain et expositions au Frac Grand Est à Reims.",
        "description": (
            "Institution d'art contemporain, vitrine culturelle de la région Grand Est."
        ),
        "address": "1 Square Aly Nabarro",
        "latitude": 49.24625,
        "longitude": 4.03972,
        "category": "museum",
        "neighborhood_slug": "centre-ville",
        "is_featured": True,
    },
    # QUARTIER-01 phase 1 — nouveaux lieux. Coordonnees issues des articles Wikipedia
    # geolocalises, recoupees par geocodage Nominatim de l'adresse (voir la PR).
    #
    # Trois d'entre eux referencent des quartiers pas encore crees (europe-pommery,
    # courlancy, cernay-jean-jaures) : hood_ids.get() renvoie None, donc
    # neighborhood_id reste NULL. Le slug est ecrit quand meme plutot que None, pour
    # documenter l'intention et laisser le rattachement se faire au prochain seed une
    # fois ces quartiers crees (phase 3).
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000018"),
        "slug": "basilique-sainte-clotilde",
        "name": "Basilique Sainte-Clotilde",
        "short_description": "Basilique mineure erigee par le pape Leon XIII.",
        "description": (
            "Edifice de style romano-byzantin, coiffe d'un dome et encadre de deux tours."
        ),
        "address": "Place Sainte-Clotilde",
        "latitude": 49.2378,
        "longitude": 4.0325,
        "category": "heritage",
        "neighborhood_slug": "maison-blanche",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000019"),
        "slug": "eglise-saint-jean-baptiste-neuvillette",
        "name": "Eglise Saint-Jean-Baptiste de La Neuvillette",
        "short_description": "Eglise paroissiale en pierre meuliere, style champenois.",
        "description": (
            "Repere du quartier La Neuvillette, batie dans le style regionaliste champenois."
        ),
        "address": "1 Rue Jules Corpelet",
        "latitude": 49.2892,
        "longitude": 4.0059,
        "category": "heritage",
        "neighborhood_slug": "la-neuvillette",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000020"),
        "slug": "porte-de-paris",
        "name": "Porte de Paris",
        "short_description": "Monument classe, nomme d'apres la route sortant vers Paris.",
        "description": "Grille monumentale classee au titre des monuments historiques en 1919.",
        "address": "Rue Bir Hakeim",
        "latitude": 49.2550,
        "longitude": 4.0221,
        "category": "monument",
        # quartier pas encore cree (phase 3) -> neighborhood_id NULL
        "neighborhood_slug": "courlancy",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000021"),
        "slug": "eglise-saint-andre",
        "name": "Eglise Saint-Andre",
        "short_description": "Eglise du XIXe siecle elevee sur un edifice du XIIIe.",
        "description": "Reconstruite plus grande au XIXe siecle avec la croissance du quartier.",
        "address": "Avenue Jean-Jaures",
        "latitude": 49.2592,
        "longitude": 4.0413,
        "category": "heritage",
        # quartier pas encore cree (phase 3) -> neighborhood_id NULL
        "neighborhood_slug": "cernay-jean-jaures",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000022"),
        "slug": "hotel-de-ville",
        "name": "Hotel de Ville de Reims",
        "short_description": "Siege des institutions municipales remoises depuis 1499.",
        "description": "Facade classique et beffroi, au coeur du centre-ville.",
        "address": "Esplanade Simone Veil",
        "latitude": 49.2580,
        "longitude": 4.0317,
        "category": "heritage",
        "neighborhood_slug": "centre-ville",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000023"),
        "slug": "stade-auguste-delaune",
        "name": "Stade Auguste-Delaune",
        "short_description": "Stade du Stade de Reims, quatre tribunes.",
        "description": "Nomme en memoire d'Auguste Delaune, sportif mort sous la torture en 1943.",
        "address": "Voie Jean Taittinger",
        "latitude": 49.2467,
        "longitude": 4.0250,
        "category": "sport",
        # quartier pas encore cree (phase 3) -> neighborhood_id NULL
        "neighborhood_slug": "courlancy",
    },
)

# Champs ecrits par scripts/seed_prod_01b_upload_media.py (upload R2 -> CDN). Le seed ne
# les reecrit PAS quand la ligne porte deja une URL CDN : sinon relancer le seed apres un
# upload remet une URL derivee de web_frontend_url, qui renvoie 404 en prod, et efface au
# passage le credit et la licence d'images CC BY-SA — une obligation d'attribution, pas
# seulement un defaut d'affichage. Constate en prod le 2026-07-19 : 12 lieux casses.
_UPLOAD_OWNED_MEDIA_FIELDS = frozenset(
    {
        "image_url",
        "hero_image_url",
        "thumbnail_image_url",
        "image_source",
        "image_license",
        "photo_credit",
    }
)


def _has_uploaded_media(row: CulturalPlace, settings: Settings | None) -> bool:
    """True si la couverture pointe deja vers le CDN media (donc posee par l'upload)."""
    if settings is None:
        return False
    base = (settings.local_video_public_base_url or "").rstrip("/")
    current = (row.hero_image_url or "").strip()
    return bool(base) and current.startswith(f"{base}/")


_MEDIA_SYNC_FIELDS = (
    "name",
    "short_description",
    "description",
    "neighborhood_id",
    "address",
    "latitude",
    "longitude",
    "category",
    "image_url",
    "hero_image_url",
    "gallery_images",
    "thumbnail_image_url",
    "image_alt",
    "source_name",
    "source_url",
    "photo_credit",
    "image_credit",
    "image_source",
    "image_license",
    "editorial_excerpt",
    "image_blurhash",
    "featured_priority",
    "is_featured",
    "is_active",
)


async def _neighborhood_ids_by_slug(session: AsyncSession, city: str) -> dict[str, uuid.UUID]:
    result = await session.execute(
        select(Neighborhood.slug, Neighborhood.id).where(Neighborhood.city == city)
    )
    return {slug: row_id for slug, row_id in result.all()}


def _prod_media_for_place(entry: dict[str, Any], settings: Settings) -> dict[str, Any]:
    """Metadonnees editoriales pour prod/preprod — deliberement SANS media (#145).

    Ce bloc fabriquait auparavant une couverture :

        hero_image_url  = {web_frontend_url}/places/reims/{slug}/cover.jpg
        photo_credit    = "Yunicity"
        image_source    = "yunicity_asset"

    Deux problemes, tous deux invisibles a l'execution.

    L'URL renvoie 404 en production : elle vise l'app web, qui ne sert pas ces chemins.
    C'est un defaut pense pour le dev (fichiers dans public/ de Next, cf.
    DEV_PUBLIC_CULTURAL_MEDIA_PREFIX) applique tel quel en prod.

    Plus grave, le credit attribuait a Yunicity des photographies qui sont en realite
    sous CC BY-SA, dues a des auteurs Wikimedia. Une fiche fraichement seedee affirmait
    donc une paternite fausse sur une image dont la licence exige l'attribution.

    Ces champs restent desormais vides jusqu'a ce que scripts/seed_prod_01b_upload_media.py
    ecrive l'URL CDN reelle et le credit reel. Un champ vide est un etat observable ; une
    URL qui 404 et un credit errone ressemblent a un succes.

    Option B ecartee volontairement — NE PAS la reintroduire en croyant corriger un oubli.
    Elle consistait a deriver l'URL depuis settings.local_video_public_base_url, la meme
    source que l'upload. Le format aurait ete correct, mais l'objet R2 n'existe pas encore
    a cet instant : on aurait remplace une URL qui 404 par une autre URL qui 404, en la
    rendant seulement plus credible. C'est exactement le piege traque toute la session —
    une donnee qui a l'air juste sans l'etre.
    """
    slug = str(entry["slug"])
    featured = bool(entry.get("is_featured", slug in _OFFICIAL_FEATURED_SLUGS))
    priority = 100 if slug == "cathedrale-notre-dame" else (80 if featured else 10)
    return {
        "featured_priority": priority,
        "is_featured": featured,
    }


def _build_place_row(
    entry: dict[str, Any],
    *,
    neighborhood_id: uuid.UUID | None,
    media: dict[str, Any],
    settings: Settings | None = None,
    use_prod_media: bool = False,
) -> CulturalPlace:
    slug = str(entry["slug"])
    if use_prod_media and settings is not None:
        merged_media = {**_prod_media_for_place(entry, settings), **media}
        source_name = _PROD_SOURCE
        source_url = settings.web_frontend_url.rstrip("/")
    else:
        media_payload = REIMS_CULTURAL_MEDIA_BY_SLUG.get(slug, {})
        merged_media = {**media_payload, **media}
        source_name = _SOURCE
        source_url = _SOURCE_URL

    normalized = normalize_cultural_media(
        hero_image_url=merged_media.get("hero_image_url"),
        thumbnail_image_url=merged_media.get("thumbnail_image_url"),
        gallery_images=merged_media.get("gallery_images"),
        photo_credit=merged_media.get("photo_credit"),
        image_credit=merged_media.get("image_credit"),
        image_source=merged_media.get("image_source"),
        editorial_excerpt=merged_media.get("editorial_excerpt"),
        image_blurhash=merged_media.get("image_blurhash"),
    )

    image_alt = entry.get("image_alt") or f"{entry['name']} — Reims"

    return CulturalPlace(
        id=entry["id"],
        slug=slug,
        name=entry["name"],
        short_description=entry["short_description"],
        description=entry.get("description"),
        city=REIMS_CITY,
        neighborhood_id=neighborhood_id,
        address=entry["address"],
        latitude=entry["latitude"],
        longitude=entry["longitude"],
        category=entry["category"],
        image_url=normalized.image_url,
        hero_image_url=normalized.hero_image_url,
        gallery_images=normalized.gallery_images or None,
        thumbnail_image_url=normalized.thumbnail_image_url,
        image_alt=image_alt,
        source_name=source_name,
        source_url=source_url,
        photo_credit=normalized.photo_credit,
        image_credit=normalized.image_credit,
        image_source=normalized.image_source,
        image_license=merged_media.get("image_license"),
        editorial_excerpt=normalized.editorial_excerpt,
        image_blurhash=normalized.image_blurhash,
        featured_priority=int(merged_media.get("featured_priority", 0)),
        is_featured=bool(merged_media.get("is_featured", False)),
        is_active=True,
    )


def _apply_sync_fields(
    target: CulturalPlace, source: CulturalPlace, settings: Settings | None
) -> None:
    """Recopie les champs du seed, en preservant les medias deja uploades sur le CDN."""
    skip = _UPLOAD_OWNED_MEDIA_FIELDS if _has_uploaded_media(target, settings) else frozenset()
    for field in _MEDIA_SYNC_FIELDS:
        if field in skip:
            continue
        setattr(target, field, getattr(source, field))


async def seed_reims_cultural_places(
    session: AsyncSession,
    *,
    settings: Settings | None = None,
    official_only: bool = False,
) -> tuple[int, int]:
    hood_ids = await _neighborhood_ids_by_slug(session, REIMS_CITY)
    entries = REIMS_CULTURAL_PLACES_SEED
    if official_only:
        official_slugs = set(REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS)
        entries = tuple(entry for entry in entries if entry["slug"] in official_slugs)

    use_prod_media = settings is not None and settings.app_env in ("prod", "preprod")
    places_created = 0
    places_updated = 0

    for entry in entries:
        hood_slug = entry.get("neighborhood_slug")
        neighborhood_id = hood_ids.get(hood_slug) if isinstance(hood_slug, str) else None
        row = _build_place_row(
            entry,
            neighborhood_id=neighborhood_id,
            media={},
            settings=settings,
            use_prod_media=use_prod_media,
        )

        repo_row = await session.get(CulturalPlace, row.id)
        if repo_row is None:
            existing = await session.execute(
                select(CulturalPlace).where(
                    CulturalPlace.city == REIMS_CITY,
                    CulturalPlace.slug == row.slug,
                )
            )
            found = existing.scalar_one_or_none()
            if found is None:
                session.add(row)
                places_created += 1
            else:
                _apply_sync_fields(found, row, settings)
                places_updated += 1
        else:
            _apply_sync_fields(repo_row, row, settings)
            places_updated += 1

    await session.flush()
    logger.info(
        "reims_cultural_places_seed_completed",
        extra={
            "places_created": places_created,
            "places_updated": places_updated,
            "places_total": len(entries),
            "official_only": official_only,
        },
    )
    return places_created, places_updated
