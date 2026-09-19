"""Garde-fou permanent des 12 secteurs officiels de Reims (referentiel metier valide).

Les 12 conseils de quartier de Reims regroupent 31 anciens quartiers. Le referentiel ci-dessous
est la source de verite METIER : il est ecrit en dur, independamment des seeds, pour que toute
derive du catalogue echoue ici plutot que de partir silencieusement en base.

Historique de la derive que ce lock ferme : apres QUARTIER-01 phase 3c (fusion de cernay,
jean-jaures et boulingrin dans cernay-jean-jaures), plusieurs listes derivees sont restees
figees sur les 12 slugs d'AVANT la fusion -- notamment REIMS_NEIGHBORHOOD_HERO_SLUGS, qui
portait 3 secteurs desactives et ignorait 3 secteurs actifs.

Regles verrouillees :
- exactement 12 secteurs actifs, ni plus ni moins ;
- slugs et identifiants stables et uniques ;
- libelle canonique (official_label) conforme au referentiel metier ;
- un alias rattache un ancien quartier a son secteur -- il ne cree JAMAIS un 13e secteur.
"""

from __future__ import annotations

import uuid

from app.core.neighborhood_hero_assets import REIMS_NEIGHBORHOOD_HERO_SLUGS
from app.db.seeds.reims_neighborhoods import REIMS_NEIGHBORHOOD_SEED
from app.db.seeds.reims_neighborhoods_3d_content import REIMS_NEIGHBORHOOD_3D_CONTENT
from app.db.seeds.reims_neighborhoods_3e_content import REIMS_NEIGHBORHOOD_3E_CONTENT
from app.db.seeds.reims_neighborhoods_catalog import REIMS_MERGED_NEIGHBORHOOD_SLUGS
from app.db.seeds.reims_neighborhoods_v2_editorial import REIMS_NEIGHBORHOOD_V2_EDITORIAL

OFFICIAL_SECTOR_COUNT = 12

# slug -> libelle canonique du conseil de quartier (referentiel metier valide).
REIMS_OFFICIAL_SECTORS: dict[str, str] = {
    "saint-remi": "Barbâtre – Saint-Remi – Verrerie",
    "courlancy": "Bois d'Amour – Porte de Paris – Courlancy",
    "centre-ville": "Centre-ville",
    "cernay-jean-jaures": "Cernay – Jamin – Jean Jaurès – Épinettes",
    "clairmarais": "Clairmarais – Charles Arnould",
    "chatillons": "Châtillons",
    "chemin-vert": "Chemin Vert – Europe",
    "croix-rouge": "Croix-Rouge – Hauts de Murigny",
    "la-neuvillette": "La Neuvillette – Trois-Fontaines",
    "orgeval": "Laon-Zola – Neufchâtel – Orgeval",
    "maison-blanche": "Maison-Blanche – Sainte-Anne – Wilson",
    "murigny": "Murigny",
}

# Alias explicitement demandes par le referentiel metier : anciens quartiers rattaches a leur
# secteur. Ils doivent exister ET ne jamais devenir un secteur a part entiere.
REQUIRED_ALIASES: dict[str, str] = {
    "Croix du Sud": "croix-rouge",
    "Clémenceau": "chemin-vert",
}

_OFFICIAL_LABELS_BY_SLUG = {
    slug: content["official_label"]
    for slug, content in {**REIMS_NEIGHBORHOOD_3D_CONTENT, **REIMS_NEIGHBORHOOD_3E_CONTENT}.items()
    if "official_label" in content
}


def _active_seed_slugs() -> set[str]:
    return {str(row["slug"]) for row in REIMS_NEIGHBORHOOD_SEED} - set(
        REIMS_MERGED_NEIGHBORHOOD_SLUGS
    )


def _aliases_by_slug() -> dict[str, list[str]]:
    return {
        str(row["slug"]): [str(a["alias"]) for a in row.get("aliases", ())]
        for row in REIMS_NEIGHBORHOOD_V2_EDITORIAL
    }


def test_exactly_twelve_active_sectors() -> None:
    """Ni plus ni moins : un 13e secteur actif, ou un secteur perdu, echoue ici."""
    assert _active_seed_slugs() == set(REIMS_OFFICIAL_SECTORS)
    assert len(REIMS_OFFICIAL_SECTORS) == OFFICIAL_SECTOR_COUNT


def test_sector_identifiers_are_stable_and_unique() -> None:
    rows = [r for r in REIMS_NEIGHBORHOOD_SEED if str(r["slug"]) in REIMS_OFFICIAL_SECTORS]
    ids = [r["id"] for r in rows]
    slugs = [str(r["slug"]) for r in rows]
    assert len(set(ids)) == OFFICIAL_SECTOR_COUNT, "identifiants dupliques"
    assert len(set(slugs)) == OFFICIAL_SECTOR_COUNT, "slugs dupliques"
    assert all(isinstance(i, uuid.UUID) for i in ids)


def test_official_labels_match_business_reference() -> None:
    """Le libelle canonique porte le nom compose complet -- jamais decoupe en entrees separees."""
    for slug, expected in REIMS_OFFICIAL_SECTORS.items():
        assert _OFFICIAL_LABELS_BY_SLUG.get(slug) == expected, (
            f"{slug}: official_label {_OFFICIAL_LABELS_BY_SLUG.get(slug)!r} != {expected!r}"
        )


def test_required_aliases_are_attached_to_their_sector() -> None:
    aliases = _aliases_by_slug()
    for alias, slug in REQUIRED_ALIASES.items():
        assert alias in aliases.get(slug, []), f"alias {alias!r} absent du secteur {slug!r}"


def test_aliases_never_create_a_thirteenth_sector() -> None:
    """Un alias ne doit etre ni un slug de secteur, ni un libelle canonique, ni partage."""
    seen: dict[str, str] = {}
    canonical_labels = set(REIMS_OFFICIAL_SECTORS.values())
    for slug, aliases in _aliases_by_slug().items():
        if slug not in REIMS_OFFICIAL_SECTORS:
            continue
        for alias in aliases:
            assert alias not in canonical_labels, f"alias {alias!r} = libelle canonique"
            # Un alias qui renvoie a SON PROPRE secteur est redondant mais inoffensif ; celui
            # qui renvoie a un AUTRE secteur rendrait le rattachement ambigu.
            collision = alias.lower().replace(" ", "-")
            assert collision == slug or collision not in REIMS_OFFICIAL_SECTORS, (
                f"alias {alias!r} du secteur {slug!r} pointe vers le secteur {collision!r}"
            )
            assert alias not in seen, f"alias {alias!r} partage entre {seen[alias]!r} et {slug!r}"
            seen[alias] = slug


def test_hero_slugs_cover_exactly_the_active_sectors() -> None:
    """La liste des heros derive du catalogue : elle ne doit ni omettre ni inclure un inactif."""
    assert set(REIMS_NEIGHBORHOOD_HERO_SLUGS) == set(REIMS_OFFICIAL_SECTORS)
    assert len(REIMS_NEIGHBORHOOD_HERO_SLUGS) == OFFICIAL_SECTOR_COUNT, "doublon dans les heros"


def test_merged_sectors_are_never_active_sectors() -> None:
    assert not set(REIMS_MERGED_NEIGHBORHOOD_SLUGS) & set(REIMS_OFFICIAL_SECTORS)
