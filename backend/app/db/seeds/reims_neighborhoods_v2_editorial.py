"""Reims neighborhoods V2 editorial seed (FEATURE-QUARTIERS-V2 / Q2-S1-01)."""
# ruff: noqa: E501

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.neighborhood_v2_constants import (
    MVP_NEIGHBORHOOD_MOODS,
    NEIGHBORHOOD_V2_MOOD_LABELS,
    NeighborhoodMood,
)
from app.db.seeds.reims_neighborhoods_3d_content import REIMS_NEIGHBORHOOD_3D_CONTENT
from app.db.seeds.reims_neighborhoods_3e_content import REIMS_NEIGHBORHOOD_3E_CONTENT
from app.models.neighborhood import Neighborhood
from app.models.neighborhood_editorial import (
    NeighborhoodAlias,
    NeighborhoodMoodAssignment,
    NeighborhoodMoodTag,
    NeighborhoodTimelineEntry,
)

logger = logging.getLogger(__name__)

REIMS_CITY = "Reims"

# Contenu editorial riche (official_label, ambiance, short_description, long_story, 6 colonnes 3a),
# applique PAR-DESSUS la ligne de base. 3d = 9 quartiers reutilises, 3e = 3 quartiers crees ;
# slugs disjoints, donc la fusion ne peut pas se recouvrir.
_EDITORIAL_CONTENT_BY_SLUG: dict[str, dict[str, Any]] = {
    **REIMS_NEIGHBORHOOD_3D_CONTENT,
    **REIMS_NEIGHBORHOOD_3E_CONTENT,
}

_DEFAULT_TIMELINE: tuple[dict[str, Any], ...] = (
    {"year": 1900, "title": "Origines du quartier", "body": "Le quartier prend forme autour de son identité locale.", "sort_order": 0},
    {"year": 1980, "title": "Évolution urbaine", "body": "Reims se transforme ; le quartier s'adapte et se renouvelle.", "sort_order": 1},
    {"year": 2026, "title": "Aujourd'hui", "body": "Une vie locale qui continue de s'écrire.", "sort_order": 2},
)

REIMS_NEIGHBORHOOD_V2_EDITORIAL: tuple[dict[str, Any], ...] = (
    {
        "slug": "boulingrin",
        "featured_quote": "Le cœur gourmand de Reims.",
        "long_story": (
            "Depuis le début du XXe siècle, Boulingrin rassemble marchés, terrasses et passages "
            "couverts au cœur de Reims. Le quartier a longtemps été le rendez-vous des Rémois qui "
            "veulent sentir la ville respirer — entre le marché du samedi, les cafés qui s'ouvrent "
            "tôt et les halles qui structurent la journée. Aujourd'hui, Boulingrin conserve cette "
            "énergie douce : on s'y retrouve sans rendez-vous, on y passe en flânant, on y revient "
            "par habitude autant que par plaisir."
        ),
        "aliases": ({"alias": "Halles du Boulingrin", "is_primary": True, "sort_order": 0},),
        "moods": (NeighborhoodMood.GOURMET.value, NeighborhoodMood.FESTIVE.value, NeighborhoodMood.HERITAGE.value),
        "timeline": (
            {"year": 1900, "title": "Naissance des Halles", "body": "Le marché couvert structure le quartier.", "sort_order": 0},
            {"year": 1945, "title": "Reconstruction", "body": "Le quartier se relève et retrouve sa vie commerçante.", "sort_order": 1},
            {"year": 1980, "title": "Terrasses et rencontres", "body": "Cafés et halles deviennent un lieu de passage quotidien.", "sort_order": 2},
            {"year": 2026, "title": "Aujourd'hui", "body": "Boulingrin, lieu de rencontre et de vie locale.", "sort_order": 3},
        ),
    },
    {
        "slug": "centre-ville",
        "featured_quote": "La cathédrale ouvre la ville à celui qui lève les yeux.",
        "long_story": (
            "Centre-ville, c'est le cœur historique de Reims : cathédrale, commerces, places et "
            "ruelles qui racontent huit siècles de sacres et de vie urbaine. Entre le parcours royal, "
            "les terrasses de la place d'Erlon et les rythmes du quotidien, le centre reste le point "
            "de convergence de tous les quartiers — celui par lequel on explique Reims à un visiteur."
        ),
        "aliases": (
            {"alias": "Cathédrale", "is_primary": True, "sort_order": 0},
            {"alias": "Place d'Erlon", "is_primary": False, "sort_order": 1},
        ),
        "moods": (NeighborhoodMood.HERITAGE.value, NeighborhoodMood.FESTIVE.value, NeighborhoodMood.GOURMET.value),
        "timeline": (
            {"year": 1211, "title": "La cathédrale gothique", "body": "Un symbole de Reims et de la France.", "sort_order": 0},
            {"year": 1918, "title": "Reconstruction", "body": "La ville se relève autour de son centre historique.", "sort_order": 1},
            {"year": 2026, "title": "Aujourd'hui", "body": "Un centre vivant entre patrimoine et vie quotidienne.", "sort_order": 2},
        ),
    },
    {
        "slug": "saint-remi",
        "featured_quote": "La mémoire culturelle de Reims respire ici.",
        "long_story": (
            "Autour de la basilique Saint-Remi, le quartier porte une histoire millénaire de foi, "
            "de culture et de ruelles habitées. C'est un Reims plus calme, où l'on flâne entre musées, "
            "basilique et vie de quartier. Les Rémois y viennent pour le patrimoine autant que pour "
            "la quiétude d'un coin de ville où le temps semble ralentir."
        ),
        "aliases": ({"alias": "Basilique", "is_primary": True, "sort_order": 0},),
        "moods": (NeighborhoodMood.HERITAGE.value, NeighborhoodMood.CALM.value, NeighborhoodMood.CREATIVE.value),
    },
    {
        "slug": "clairmarais",
        "featured_quote": "Entre canal et rues commerçantes, Reims bat son plein.",
        "long_story": (
            "Clairmarais mêle canal, commerces et vie de quartier au rythme du quotidien rémois. "
            "C'est un quartier où l'on croise étudiants, familles et habitués des terrasses. "
            "L'énergie est douce mais constante — un bon exemple de la Reims qui vit, pas seulement "
            "de celle qu'on visite."
        ),
        "aliases": ({"alias": "Canal", "is_primary": True, "sort_order": 0},),
        "moods": (NeighborhoodMood.FESTIVE.value, NeighborhoodMood.FAMILY.value, NeighborhoodMood.GOURMET.value),
    },
    {
        "slug": "cernay",
        "featured_quote": "Un Reims populaire, ancré et chaleureux.",
        "long_story": (
            "Cernay incarne un visage résidentiel et populaire de Reims. Marchés, proximité et "
            "habitudes de quartier s'y transmettent. Loin des circuits touristiques, c'est une Reims "
            "authentique où les liens se tissent au fil des années et des rencontres du quotidien."
        ),
        "aliases": ({"alias": "Les Basses", "is_primary": True, "sort_order": 0},),
        "moods": (NeighborhoodMood.FAMILY.value, NeighborhoodMood.CALM.value, NeighborhoodMood.GOURMET.value),
    },
    {
        "slug": "croix-rouge",
        "featured_quote": "La Reims résidentielle, loin du tumulte.",
        "long_story": (
            "Croix-Rouge offre un visage résidentiel de Reims : parcs, écoles et rythme de vie "
            "apaisé. C'est un quartier où les familles s'installent, où les associations animent "
            "la vie locale et où la ville se vit au quotidien, loin de l'agitation du centre."
        ),
        "aliases": (
            {"alias": "Croix-Rouge sud", "is_primary": True, "sort_order": 0},
            {"alias": "Croix du Sud", "is_primary": False, "sort_order": 1},
        ),
        "moods": (NeighborhoodMood.FAMILY.value, NeighborhoodMood.CALM.value, NeighborhoodMood.CREATIVE.value),
    },
    {
        "slug": "murigny",
        "featured_quote": "Des rues calmes où Reims respire.",
        "long_story": (
            "Murigny est un quartier résidentiel au sud de Reims, fait de rues calmes et de "
            "commerces de proximité. Les habitants y construisent une vie de quartier discrète "
            "mais solide — loin des grands axes, proche de l'essentiel : écoles, parcs et voisins."
        ),
        "aliases": ({"alias": "Murigny sud", "is_primary": True, "sort_order": 0},),
        "moods": (NeighborhoodMood.FAMILY.value, NeighborhoodMood.CALM.value, NeighborhoodMood.GOURMET.value),
    },
    {
        "slug": "jean-jaures",
        "featured_quote": "L'énergie étudiante et populaire de Reims.",
        "long_story": (
            "Jean-Jaurès concentre une part de l'énergie populaire et étudiante de Reims. "
            "Commerces, passages quotidiens et vie de rue composent un quartier en mouvement "
            "permanent — moins institutionnel que le centre, plus proche des rythmes de ceux "
            "qui vivent et travaillent ici."
        ),
        "aliases": ({"alias": "Jaurès", "is_primary": True, "sort_order": 0},),
        "moods": (NeighborhoodMood.STUDENT.value, NeighborhoodMood.FESTIVE.value, NeighborhoodMood.GOURMET.value),
    },
    {
        "slug": "la-neuvillette",
        "featured_quote": "Reims qui se construit vers le nord.",
        "long_story": (
            "La Neuvillette mêle zones d'activité, logements récents et dynamisme en développement. "
            "C'est une facette de Reims en transformation — où la ville s'étend, où de nouveaux "
            "habitants s'installent et où la vie locale se structure quartier par quartier."
        ),
        "aliases": ({"alias": "Neuvillette", "is_primary": True, "sort_order": 0},),
        "moods": (NeighborhoodMood.FAMILY.value, NeighborhoodMood.CALM.value, NeighborhoodMood.CREATIVE.value),
    },
    {
        "slug": "orgeval",
        "featured_quote": "Entre ville et campagne champenoise.",
        "long_story": (
            "Orgeval, à l'ouest de Reims, offre un cadre résidentiel verdoyant proche de la "
            "campagne champenoise. Les habitants y chercient calme et espace tout en restant "
            "connectés à la ville — une Reims périphérique où la qualité de vie prime."
        ),
        "aliases": ({"alias": "Orgeval ouest", "is_primary": True, "sort_order": 0},),
        "moods": (NeighborhoodMood.CALM.value, NeighborhoodMood.FAMILY.value, NeighborhoodMood.HERITAGE.value),
    },
    {
        "slug": "chemin-vert",
        "featured_quote": "Un Reims habité, accessible et en mouvement.",
        "long_story": (
            "Chemin-Vert se situe entre centre et faubourgs — un quartier où la vie quotidienne "
            "prend le pas sur le monument. Commerces, associations et habitants y composent "
            "une trame locale dense, accessible à pied, ouverte à ceux qui veulent découvrir "
            "une autre facette de Reims."
        ),
        "aliases": (
            {"alias": "Chemin Vert", "is_primary": True, "sort_order": 0},
            {"alias": "Clémenceau", "is_primary": False, "sort_order": 1},
        ),
        "moods": (NeighborhoodMood.FAMILY.value, NeighborhoodMood.FESTIVE.value, NeighborhoodMood.GOURMET.value),
    },
    {
        "slug": "maison-blanche",
        "featured_quote": "Solidarité et diversité au sud-est de Reims.",
        "long_story": (
            "Maison-Blanche porte une diversité humaine et associative forte au sud-est de Reims. "
            "C'est un quartier où la solidarité de proximité compte, où les initiatives locales "
            "prennent forme et où la ville se vit autrement — loin des cartes postales, proche "
            "des réalités et des liens humains."
        ),
        "aliases": ({"alias": "Maison Blanche", "is_primary": True, "sort_order": 0},),
        "moods": (NeighborhoodMood.FAMILY.value, NeighborhoodMood.CALM.value, NeighborhoodMood.CREATIVE.value),
    },
    # QUARTIER-01 phase 3e — les 3 quartiers crees en 3b. long_story + featured_quote ici ;
    # les autres colonnes editoriales (official_label, ambiance, short_description, 6 colonnes 3a)
    # vivent dans REIMS_NEIGHBORHOOD_3E_CONTENT et sont appliquees par-dessus. timeline = defaut.
    {
        "slug": "cernay-jean-jaures",
        "featured_quote": "Le marché, les commerces et la vie de quartier au quotidien.",
        "long_story": (
            "Convivial, commerçant, authentique et familial. Le quartier Cernay – Jamin – "
            "Jean-Jaurès – Épinettes est situé au nord-est du centre-ville. C'est l'un des "
            "quartiers les plus vivants de Reims, réputé pour son marché historique, ses "
            "nombreux commerces indépendants, ses cafés de quartier et son ambiance conviviale."
        ),
        "aliases": (
            {"alias": "Boulingrin", "is_primary": True, "sort_order": 0},
            {"alias": "Jamin", "is_primary": False, "sort_order": 1},
            {"alias": "Épinettes", "is_primary": False, "sort_order": 2},
        ),
        "moods": (NeighborhoodMood.GOURMET.value, NeighborhoodMood.FESTIVE.value, NeighborhoodMood.FAMILY.value),
    },
    {
        "slug": "courlancy",
        "featured_quote": "Entre stade, parcs et Bois d'Amour, Reims au grand air.",
        "long_story": (
            "Sportif, nature, familial et élégant. Le quartier Courlancy – Porte de Paris – "
            "Bois d'Amour est situé au sud-ouest du Centre-Ville. Il est reconnu pour son "
            "équilibre entre nature, sport, patrimoine et habitat. On y retrouve le stade du "
            "Stade de Reims, de vastes espaces verts, des quartiers résidentiels recherchés "
            "et des établissements de santé majeurs."
        ),
        "aliases": (
            {"alias": "Porte de Paris", "is_primary": True, "sort_order": 0},
            {"alias": "Bois d'Amour", "is_primary": False, "sort_order": 1},
        ),
        "moods": (NeighborhoodMood.FAMILY.value, NeighborhoodMood.CALM.value, NeighborhoodMood.HERITAGE.value),
    },
    {
        "slug": "chatillons",
        "featured_quote": "Un quartier qui se réinvente, porté par ses habitants.",
        "long_story": (
            "Solidaire, jeune, familial et en transformation. Le quartier des Châtillons est "
            "situé au sud de Reims. Construit dans les années 1960-1970, il fait aujourd'hui "
            "l'objet d'importants projets de renouvellement urbain. Il se distingue par une "
            "forte vie associative, des équipements de proximité et une population jeune et "
            "multiculturelle."
        ),
        "aliases": ({"alias": "Les Châtillons", "is_primary": True, "sort_order": 0},),
        "moods": (NeighborhoodMood.FAMILY.value, NeighborhoodMood.CREATIVE.value, NeighborhoodMood.FESTIVE.value),
    },
)


async def _ensure_mood_tags(session: AsyncSession) -> None:
    for slug, label in NEIGHBORHOOD_V2_MOOD_LABELS.items():
        if slug not in MVP_NEIGHBORHOOD_MOODS:
            continue
        existing = await session.get(NeighborhoodMoodTag, slug)
        if existing is None:
            session.add(NeighborhoodMoodTag(slug=slug, label=label))
        elif existing.label != label:
            existing.label = label
    await session.flush()


async def _get_neighborhood(session: AsyncSession, slug: str) -> Neighborhood | None:
    result = await session.execute(
        select(Neighborhood).where(
            Neighborhood.city == REIMS_CITY,
            Neighborhood.slug == slug,
        )
    )
    return result.scalar_one_or_none()


async def _apply_editorial_row(session: AsyncSession, hood: Neighborhood, row: dict[str, Any]) -> None:
    hood.long_story = row.get("long_story")
    hood.featured_quote = row.get("featured_quote")

    await session.execute(
        delete(NeighborhoodAlias).where(NeighborhoodAlias.neighborhood_id == hood.id)
    )
    for alias_row in row.get("aliases", ()):
        session.add(
            NeighborhoodAlias(
                id=uuid.uuid4(),
                neighborhood_id=hood.id,
                alias=str(alias_row["alias"]),
                is_primary=bool(alias_row.get("is_primary", False)),
                sort_order=int(alias_row.get("sort_order", 0)),
            )
        )

    await session.execute(
        delete(NeighborhoodMoodAssignment).where(
            NeighborhoodMoodAssignment.neighborhood_id == hood.id
        )
    )
    for sort_order, mood_slug in enumerate(row.get("moods", ())):
        if mood_slug not in MVP_NEIGHBORHOOD_MOODS:
            continue
        session.add(
            NeighborhoodMoodAssignment(
                id=uuid.uuid4(),
                neighborhood_id=hood.id,
                mood_slug=str(mood_slug),
                sort_order=sort_order,
            )
        )

    timeline_rows = row.get("timeline", _DEFAULT_TIMELINE)
    await session.execute(
        delete(NeighborhoodTimelineEntry).where(
            NeighborhoodTimelineEntry.neighborhood_id == hood.id
        )
    )
    for entry in timeline_rows:
        session.add(
            NeighborhoodTimelineEntry(
                id=uuid.uuid4(),
                neighborhood_id=hood.id,
                year=int(entry["year"]),
                title=str(entry["title"]),
                body=entry.get("body"),
                sort_order=int(entry.get("sort_order", 0)),
            )
        )

    # Contenu editorial riche (3d : 9 reutilises · 3e : 3 crees). Applique PAR-DESSUS les champs
    # ci-dessus (override long_story/short_description, pose official_label/ambiance + les 6
    # colonnes 3a). Ne touche ni moods, ni timeline, ni aliases. Un quartier absent du dict
    # (les 3 fusionnes) garde son contenu de base.
    content = _EDITORIAL_CONTENT_BY_SLUG.get(str(row["slug"]))
    if content is not None:
        for field, value in content.items():
            setattr(hood, field, value)


async def seed_reims_neighborhoods_v2_editorial(session: AsyncSession) -> int:
    await _ensure_mood_tags(session)

    applied = 0
    for row in REIMS_NEIGHBORHOOD_V2_EDITORIAL:
        slug = str(row["slug"])
        hood = await _get_neighborhood(session, slug)
        if hood is None:
            logger.warning("neighborhood_v2_editorial_skip_missing slug=%s", slug)
            continue
        await _apply_editorial_row(session, hood, row)
        applied += 1

    await session.flush()
    logger.info("reims_neighborhoods_v2_editorial_seed_completed count=%s", applied)
    return applied
