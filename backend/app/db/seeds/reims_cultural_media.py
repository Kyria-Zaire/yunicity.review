"""Reims cultural place media (WEB-SEARCH-02B.1).

Sources: Wikimedia Commons (CC / domaine public), via Special:FilePath.
Pas de hotlinking arbitraire.
"""

from __future__ import annotations

from typing import Any, TypedDict

_WIKI = "wikimedia_commons"
_LICENSE_CC = "CC BY-SA 4.0 (Wikimedia Commons)"


class _GalleryEntry(TypedDict, total=False):
    url: str
    alt: str
    credit: str
    source: str


def _wiki(file_name: str, *, width: int = 1400) -> str:
    return f"https://commons.wikimedia.org/wiki/Special:FilePath/{file_name}?width={width}"


def _gallery(*entries: _GalleryEntry) -> list[dict[str, str]]:
    return [dict(entry) for entry in entries]


# Clé = slug cultural_places
REIMS_CULTURAL_MEDIA_BY_SLUG: dict[str, dict[str, Any]] = {
    "cathedrale-notre-dame": {
        "featured_priority": 100,
        "is_featured": True,
        "image_source": _WIKI,
        "image_license": _LICENSE_CC,
        "photo_credit": "Wikimedia Commons — Cathédrale Notre-Dame de Reims",
        "editorial_excerpt": (
            "La façade gothique et les vitraux Chagall font de la cathédrale "
            "le cœur visible de Reims."
        ),
        "hero_image_url": _wiki("Facade_Notre-Dame_de_Reims.JPG"),
        "gallery_images": _gallery(
            {
                "url": _wiki("Facade_Notre-Dame_de_Reims.JPG"),
                "alt": "Façade occidentale de la cathédrale",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
            {
                "url": _wiki("Reims_Cathedral,_interior.jpg"),
                "alt": "Intérieur de la nef",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
            {
                "url": _wiki("Reims_Cathedral_stained_glass_Chagall.jpg"),
                "alt": "Vitrail Chagall",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
        ),
    },
    "palais-du-tau": {
        "featured_priority": 95,
        "is_featured": True,
        "image_source": _WIKI,
        "image_license": _LICENSE_CC,
        "photo_credit": "Wikimedia Commons — Palais du Tau",
        "editorial_excerpt": (
            "Face à la cathédrale, l'ancienne demeure des archevêques raconte le sacre des rois."
        ),
        "hero_image_url": _wiki("Palais_du_Tau_(Reims,_France).jpg"),
        "gallery_images": _gallery(
            {
                "url": _wiki("Palais_du_Tau_(Reims,_France).jpg"),
                "alt": "Façade du Palais du Tau",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
            {
                "url": _wiki("Palais_du_Tau_-_cour_d'honneur.jpg"),
                "alt": "Cour d'honneur",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
        ),
    },
    "basilique-saint-remi": {
        "featured_priority": 90,
        "is_featured": True,
        "image_source": _WIKI,
        "image_license": _LICENSE_CC,
        "photo_credit": "Wikimedia Commons — Basilique Saint-Remi",
        "editorial_excerpt": (
            "Roman et royal, le quartier Saint-Remi se lit autour de cette basilique majeure."
        ),
        "hero_image_url": _wiki("Saint-Remi_(Reims)_04.JPG"),
        "gallery_images": _gallery(
            {
                "url": _wiki("Saint-Remi_(Reims)_04.JPG"),
                "alt": "Basilique Saint-Remi",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
            {
                "url": _wiki("Basilique_Saint-Remi_de_Reims_-_nef.jpg"),
                "alt": "Nef romane",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
        ),
    },
    "musee-saint-remi": {
        "featured_priority": 75,
        "is_featured": True,
        "image_source": _WIKI,
        "image_license": _LICENSE_CC,
        "photo_credit": "Wikimedia Commons — Musée Saint-Remi",
        "editorial_excerpt": "Archéologie gallo-romaine et histoire locale dans l'ancienne abbaye.",
        "hero_image_url": _wiki("Musee_Saint-Remi_Reims.jpg"),
        "gallery_images": _gallery(
            {
                "url": _wiki("Musee_Saint-Remi_Reims.jpg"),
                "alt": "Musée Saint-Remi",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
        ),
    },
    "porte-de-mars": {
        "featured_priority": 85,
        "is_featured": True,
        "image_source": _WIKI,
        "image_license": _LICENSE_CC,
        "photo_credit": "Wikimedia Commons — Porte de Mars",
        "editorial_excerpt": (
            "Un des arcs antiques les mieux conservés du nord de la Gaule, au cœur du centre."
        ),
        "hero_image_url": _wiki("Reims-Porte-de-Mars.jpg"),
        "gallery_images": _gallery(
            {
                "url": _wiki("Reims-Porte-de-Mars.jpg"),
                "alt": "Porte de Mars",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
        ),
    },
    "halles-boulingrin": {
        "featured_priority": 55,
        "is_featured": True,
        "image_source": _WIKI,
        "image_license": _LICENSE_CC,
        "photo_credit": "Wikimedia Commons — Halles du Boulingrin",
        "editorial_excerpt": "Marché couvert et vie locale : un repère Art déco du centre.",
        "hero_image_url": _wiki("Halles_du_Boulingrin_Reims.jpg"),
        "gallery_images": _gallery(
            {
                "url": _wiki("Halles_du_Boulingrin_Reims.jpg"),
                "alt": "Halles du Boulingrin",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
        ),
    },
    "place-royale": {
        "featured_priority": 40,
        "is_featured": False,
        "image_source": _WIKI,
        "image_license": _LICENSE_CC,
        "photo_credit": "Wikimedia Commons — Place Royale de Reims",
        "editorial_excerpt": "Perspective classique et terrasses à deux pas de la cathédrale.",
        "hero_image_url": _wiki("Place_royale_de_Reims.jpg"),
        "gallery_images": _gallery(
            {
                "url": _wiki("Place_royale_de_Reims.jpg"),
                "alt": "Place Royale",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
        ),
    },
    "place-erlon": {
        "featured_priority": 35,
        "is_featured": False,
        "image_source": _WIKI,
        "image_license": _LICENSE_CC,
        "photo_credit": "Wikimedia Commons — Place d'Erlon",
        "editorial_excerpt": "L'artère commerçante qui relie la gare au centre historique.",
        "hero_image_url": _wiki("Place_Drouet-d'Erlon_Reims.jpg"),
        "gallery_images": _gallery(
            {
                "url": _wiki("Place_Drouet-d'Erlon_Reims.jpg"),
                "alt": "Place d'Erlon",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
        ),
    },
    "bibliotheque-carnegie": {
        "featured_priority": 80,
        "is_featured": True,
        "image_source": _WIKI,
        "image_license": _LICENSE_CC,
        "photo_credit": "Wikimedia Commons — Bibliothèque Carnegie",
        "editorial_excerpt": "Un salon de lecture patrimonial offert par Andrew Carnegie à Reims.",
        "hero_image_url": _wiki("Bibliotheque_Carnegie_de_Reims.jpg"),
        "gallery_images": _gallery(
            {
                "url": _wiki("Bibliotheque_Carnegie_de_Reims.jpg"),
                "alt": "Bibliothèque Carnegie",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
            {
                "url": _wiki("Bibliotheque_Carnegie_Reims_salle_de_lecture.jpg"),
                "alt": "Salle de lecture",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
        ),
    },
    "villa-demoiselle": {
        "featured_priority": 65,
        "is_featured": False,
        "image_source": _WIKI,
        "image_license": _LICENSE_CC,
        "photo_credit": "Wikimedia Commons — Villa Demoiselle",
        "editorial_excerpt": (
            "Art nouveau et jardins sur la colline : une villa emblématique de Reims."
        ),
        "hero_image_url": _wiki("Villa_Demoiselle_Reims.jpg"),
        "gallery_images": _gallery(
            {
                "url": _wiki("Villa_Demoiselle_Reims.jpg"),
                "alt": "Villa Demoiselle",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
        ),
    },
    "domaine-pommery": {
        "featured_priority": 70,
        "is_featured": True,
        "image_source": _WIKI,
        "image_license": _LICENSE_CC,
        "photo_credit": "Wikimedia Commons — Domaine Pommery",
        "editorial_excerpt": "Crayères classées et architecture de champagne au sud de Reims.",
        "hero_image_url": _wiki("Pommery_Champagne_cellars_Reims.jpg"),
        "gallery_images": _gallery(
            {
                "url": _wiki("Pommery_Champagne_cellars_Reims.jpg"),
                "alt": "Crayères Pommery",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
        ),
    },
    "opera-de-reims": {
        "featured_priority": 72,
        "is_featured": True,
        "image_source": _WIKI,
        "image_license": _LICENSE_CC,
        "photo_credit": "Wikimedia Commons — Opéra de Reims",
        "editorial_excerpt": "Scène nationale et façade néoclassique sur la place du Forum.",
        "hero_image_url": _wiki("Opera_de_Reims.jpg"),
        "gallery_images": _gallery(
            {
                "url": _wiki("Opera_de_Reims.jpg"),
                "alt": "Opéra de Reims",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
        ),
    },
    "parc-de-champagne": {
        "featured_priority": 60,
        "is_featured": True,
        "image_source": _WIKI,
        "image_license": _LICENSE_CC,
        "photo_credit": "Wikimedia Commons — Parc de Champagne",
        "editorial_excerpt": "Verdure, promenades et panorama sur la ville au sud de Reims.",
        "hero_image_url": _wiki("Parc_de_Champagne_Reims.jpg"),
        "gallery_images": _gallery(
            {
                "url": _wiki("Parc_de_Champagne_Reims.jpg"),
                "alt": "Parc de Champagne",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
        ),
    },
    "musee-des-beaux-arts": {
        "featured_priority": 78,
        "is_featured": True,
        "image_source": _WIKI,
        "image_license": _LICENSE_CC,
        "photo_credit": "Wikimedia Commons — Musée des Beaux-Arts de Reims",
        "editorial_excerpt": "Collections des XVe au XXIe siècles dans un palais du XVIIIe siècle.",
        "hero_image_url": _wiki("Musee_des_Beaux-Arts_de_Reims.jpg"),
        "gallery_images": _gallery(
            {
                "url": _wiki("Musee_des_Beaux-Arts_de_Reims.jpg"),
                "alt": "Musée des Beaux-Arts",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
        ),
    },
    "cryptoportique": {
        "featured_priority": 68,
        "is_featured": True,
        "image_source": _WIKI,
        "image_license": _LICENSE_CC,
        "photo_credit": "Wikimedia Commons — Cryptoportique de Reims",
        "editorial_excerpt": (
            "Galerie gallo-romaine sous la place du Forum, mémoire souterraine de la ville."
        ),
        "hero_image_url": _wiki("Cryptoportique_de_Reims.jpg"),
        "gallery_images": _gallery(
            {
                "url": _wiki("Cryptoportique_de_Reims.jpg"),
                "alt": "Cryptoportique",
                "credit": "Wikimedia Commons",
                "source": _WIKI,
            },
        ),
    },
}
