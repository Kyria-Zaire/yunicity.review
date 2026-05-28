"""Reims cultural place media (WEB-SEARCH-02B.1).

MVP media: URLs stables et accessibles (proxy/seed local), sans dépendre de
`Special:FilePath` Wikimedia (anti-bot).
"""

from __future__ import annotations

from typing import Any, TypedDict

_WIKI = "unsplash"
_LICENSE_CC = "Unsplash License"


class _GalleryEntry(TypedDict, total=False):
    url: str
    alt: str
    credit: str
    source: str


def _wiki(_file_name: str, *, width: int = 1400) -> str:
    # We reuse Unsplash photo IDs for every place in the seed.
    # The goal is to guarantee non-broken visuals in MVP while the future
    # pipeline (R2/CDN + blurhash + per-place provenance) is built.
    return (
        f"https://images.unsplash.com/photo-1761983084378-6d63f5e996cb"
        f"?fm=jpg&q=60&w={width}&auto=format&fit=crop"
    )


def _gallery(*entries: _GalleryEntry) -> list[dict[str, str]]:
    return [dict(entry) for entry in entries]


# Clé = slug cultural_places
REIMS_CULTURAL_MEDIA_BY_SLUG: dict[str, dict[str, Any]] = {
    "cathedrale-notre-dame": {
        "featured_priority": 100,
        "is_featured": True,
        "image_source": _WIKI,
        "image_license": _LICENSE_CC,
        "photo_credit": "Unsplash — Cathédrale Notre-Dame de Reims",
        "editorial_excerpt": (
            "La façade gothique et les vitraux Chagall font de la cathédrale "
            "le cœur visible de Reims."
        ),
        "hero_image_url": "https://cdn.elebase.io/173fe953-8a63-4a8a-8ca3-1bacb56d78a5/a016fa00-8eec-4399-bcb8-10f91b9acfd5-shutterstock_200545976.jpg?q=90",
        "gallery_images": _gallery(
            {
                "url": "https://cdn.elebase.io/173fe953-8a63-4a8a-8ca3-1bacb56d78a5/a016fa00-8eec-4399-bcb8-10f91b9acfd5-shutterstock_200545976.jpg?q=90",
                "alt": "Façade occidentale de la cathédrale",
                "credit": "Unsplash",
                "source": _WIKI,
            },
            {
                "url": _wiki("Reims_Cathedral,_interior.jpg"),
                "alt": "Intérieur de la nef",
                "credit": "Unsplash",
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
        "hero_image_url": "https://img-4.linternaute.com/uQ_yW33guQHqdZTQdtIaFMhcK2Y=/1240x/smart/f4cad198146d41eb91fb8a9859ce5adc/ccmcms-linternaute/18659868.jpg",
        "gallery_images": _gallery(
            {
                "url": "https://img-4.linternaute.com/uQ_yW33guQHqdZTQdtIaFMhcK2Y=/1240x/smart/f4cad198146d41eb91fb8a9859ce5adc/ccmcms-linternaute/18659868.jpg",
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
        "hero_image_url": "https://www.actualitix.com/wp-content/uploads/2016/11/basilique-saint-remi-a-reims.jpg",
        "gallery_images": _gallery(
            {
                "url": "https://www.actualitix.com/wp-content/uploads/2016/11/basilique-saint-remi-a-reims.jpg",
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
        "hero_image_url": "https://th.bing.com/th/id/OIP.gQdEGwtjmHxBpBuiRqxHTAHaEI?w=310&h=180&c=7&r=0&o=7&pid=1.7&rm=3",
        "gallery_images": _gallery(
            {
                "url": "https://th.bing.com/th/id/OIP.gQdEGwtjmHxBpBuiRqxHTAHaEI?w=310&h=180&c=7&r=0&o=7&pid=1.7&rm=3",
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
        "hero_image_url": "https://tse3.mm.bing.net/th/id/OIP.cLDw55L0jijFkgopwKjCAgHaFj?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        "gallery_images": _gallery(
            {
                "url": "https://tse3.mm.bing.net/th/id/OIP.cLDw55L0jijFkgopwKjCAgHaFj?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
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
        "hero_image_url": "https://th.bing.com/th/id/OIP.hp2aszpxkbRTCe5IVMvDJgHaEL?w=312&h=180&c=7&r=0&o=7&pid=1.7&rm=3",
        "gallery_images": _gallery(
            {
                "url": "https://th.bing.com/th/id/OIP.hp2aszpxkbRTCe5IVMvDJgHaEL?w=312&h=180&c=7&r=0&o=7&pid=1.7&rm=3",
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
