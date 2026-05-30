"""Local discussions portal (WEB-DISCUSSIONS-01)."""

from __future__ import annotations

from enum import StrEnum


class DiscussionCategory(StrEnum):
    ALL = "all"
    QUESTIONS = "questions"
    TIPS = "tips"
    NEWS = "news"
    CULTURE = "culture"
    SPORTS = "sports"
    TRIBES = "tribes"


DISCUSSION_CATEGORY_LABELS: dict[DiscussionCategory, str] = {
    DiscussionCategory.ALL: "Toutes",
    DiscussionCategory.QUESTIONS: "Questions",
    DiscussionCategory.TIPS: "Bons plans",
    DiscussionCategory.NEWS: "Actualités locales",
    DiscussionCategory.CULTURE: "Culture",
    DiscussionCategory.SPORTS: "Sports",
    DiscussionCategory.TRIBES: "Tribus",
}

DISCUSSION_CATEGORY_KEYWORDS: dict[DiscussionCategory, tuple[str, ...]] = {
    DiscussionCategory.QUESTIONS: (
        "?",
        "question",
        "conseil",
        "avis",
        "recommand",
        "quel",
        "quelle",
        "comment",
        "où",
        "pourquoi",
    ),
    DiscussionCategory.TIPS: (
        "bon plan",
        "bons plans",
        "adresse",
        "adresses",
        "astuce",
        "promo",
        "réduction",
        "gratuit",
    ),
    DiscussionCategory.NEWS: (
        "actualité",
        "info",
        "nouveau",
        "nouvelle",
        "ouverture",
        "fermeture",
        "travaux",
    ),
    DiscussionCategory.CULTURE: (
        "culture",
        "expo",
        "musée",
        "théâtre",
        "concert",
        "art",
        "galerie",
        "photo",
    ),
    DiscussionCategory.SPORTS: (
        "sport",
        "running",
        "course",
        "vélo",
        "foot",
        "fitness",
        "yoga",
        "marche",
    ),
    DiscussionCategory.TRIBES: (
        "tribu",
        "tribus",
        "groupe",
        "communauté",
        "rejoindre",
    ),
}

DISCUSSION_PAGE_SIZE_DEFAULT = 15
DISCUSSION_PAGE_SIZE_MAX = 30

DISCUSSION_TITLE_MAX_LENGTH = 80
DISCUSSION_BODY_MAX_LENGTH = 2000
DISCUSSION_TAGS_MAX_COUNT = 8
DISCUSSION_TAG_MAX_LENGTH = 32
