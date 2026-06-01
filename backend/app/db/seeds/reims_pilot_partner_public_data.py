"""Verified public catalog fields for Reims pilot partners (WEB-PARTNERS-08A).

Sources (2026-06-01) — à revalider si le partenaire déménage :
- Belga Queen : https://gaufresbelgaqueen.com/points-de-vente-belga-queen/
- Pittaya : https://pitaya-thaistreetfood.com/restaurants/reims
- Centre des Ressources : https://www.centre-ressource-reims.org/contact/
- Garçon Barbiers : https://www.lesgarconsbarbiers.com/salons/reims

GPS : coordonnées dérivées de l'adresse postale (géocodage manuel Reims).
Visuels : chemins statiques Yunicity recette (`/seed/partners/*`).
Remplacer par assets signés lorsque le partenaire les fournit.
"""

from __future__ import annotations

from typing import Any

# Slugs must match reims_signed_partners.py pilot entries.
REIMS_PILOT_PARTNER_PUBLIC_DATA: dict[str, dict[str, Any]] = {
    "belga-queen": {
        "address": "Galerie Espace d'Erlon, Place Drouet d'Erlon",
        "postal_code": "51100",
        "latitude": 49.25563,
        "longitude": 4.03102,
        "phone": None,
        "website": "https://gaufresbelgaqueen.com/",
        "social_links": {},
        "logo_url": "/seed/partners/belga-queen-logo.svg",
        "banner_url": "/seed/partners/belga-queen-banner.svg",
    },
    "pittaya": {
        "address": "64 Place Drouet d'Erlon",
        "postal_code": "51100",
        "latitude": 49.25571,
        "longitude": 4.03118,
        "phone": "+33326507738",
        "website": "https://pitaya-thaistreetfood.com/restaurants/reims",
        "social_links": {
            "instagram": "https://www.instagram.com/pitayathai/",
        },
        "logo_url": "/seed/partners/pittaya-logo.svg",
        "banner_url": "/seed/partners/pittaya-banner.svg",
    },
    "centre-des-ressources": {
        "address": "38 bis rue de Courlancy, 4e étage",
        "postal_code": "51100",
        "latitude": 49.24492,
        "longitude": 4.01738,
        "phone": "+33326354705",
        "website": "https://www.centre-ressource-reims.org/",
        "social_links": {
            "instagram": "https://www.instagram.com/centre_ressource_reims/",
        },
        "logo_url": "/seed/partners/centre-des-ressources-logo.svg",
        "banner_url": "/seed/partners/centre-des-ressources-banner.svg",
    },
    "garcon-barbiers": {
        "address": "3 rue Buirette",
        "postal_code": "51100",
        "latitude": 49.25418,
        "longitude": 4.02804,
        "phone": "+33326471541",
        "website": "https://www.lesgarconsbarbiers.com/salons/reims",
        "social_links": {
            "instagram": "https://www.instagram.com/lesgarconsbarbiers/",
        },
        "logo_url": "/seed/partners/garcon-barbiers-logo.svg",
        "banner_url": "/seed/partners/garcon-barbiers-banner.svg",
    },
}

PILOT_PARTNER_SLUGS: frozenset[str] = frozenset(REIMS_PILOT_PARTNER_PUBLIC_DATA.keys())


def merge_pilot_public_fields(entry: dict[str, Any]) -> dict[str, Any]:
    """Overlay verified pilot fields onto a signed-partners seed entry."""
    slug = entry.get("slug")
    if not isinstance(slug, str) or slug not in REIMS_PILOT_PARTNER_PUBLIC_DATA:
        return entry
    merged = dict(entry)
    merged.update(REIMS_PILOT_PARTNER_PUBLIC_DATA[slug])
    return merged
