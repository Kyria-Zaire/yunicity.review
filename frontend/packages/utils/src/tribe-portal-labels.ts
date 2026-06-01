/** Tribes portal micro-copy (WEB-TRIBES-LIST-01). */

import type { TribePortalTheme, TribesPortalView } from "./tribe-portal";

export const TRIBES_PORTAL_TITLE = "Des communautés locales pour vivre la ville autrement.";
export const TRIBES_PORTAL_SUBTITLE =
  "Découvrez les cercles qui font battre le cœur de Reims. Rencontrez vos voisins à travers des passions partagées.";

export const TRIBES_PORTAL_SEARCH_PLACEHOLDER = "Explorer tribus…";
export const TRIBES_PORTAL_FEATURED_BADGE = "Featured tribe";
export const TRIBES_PORTAL_HERO_CTA_EXPLORE = "Explorer";
export const TRIBES_PORTAL_HERO_CTA_MOMENTS = "Voir les moments";

export const TRIBES_PORTAL_THEMES_TITLE = "Parcourir les thématiques";
export const TRIBES_PORTAL_THEME_LABELS: Record<TribePortalTheme, string> = {
  photo: "Photo",
  cafe: "Café",
  lecture: "Lecture",
  "sport-doux": "Sport doux",
  balade: "Balade",
  culture: "Culture",
  benevolat: "Bénévolat",
};
export const TRIBES_PORTAL_THEME_EMPTY =
  "Aucune tribu ne correspond exactement à cette thématique pour le moment.";

export const TRIBES_PORTAL_CARDS_TITLE = "Tribus du quartier";
export const TRIBES_PORTAL_CARDS_SUBTITLE =
  "Des cercles humains ancrés dans les quartiers, sans bruit social.";

export const TRIBES_PORTAL_MOMENTS_TITLE = "Moments de tribus";
export const TRIBES_PORTAL_MOMENTS_EMPTY =
  "Les rencontres de tribus s’annoncent doucement dans la ville.";

export const TRIBES_PORTAL_STORY_TITLE = "Une matinée avec le Club des Lecteurs";
export const TRIBES_PORTAL_STORY_SUBTITLE = "Chronique locale";

export const TRIBES_PORTAL_LIFE_TITLE = "Micro-vie locale";
export const TRIBES_PORTAL_LIFE_EMPTY =
  "Les premiers cercles locaux prennent doucement vie ici.";

export const TRIBES_PORTAL_RAIL_NEARBY_TITLE = "Tribus actives près de vous";
export const TRIBES_PORTAL_RAIL_NEARBY_EMPTY = "De nouveaux cercles apparaissent progressivement.";
export const TRIBES_PORTAL_RAIL_PASSPORT_TITLE = "Passport citoyen";
export const TRIBES_PORTAL_CREATE_CTA = "Créer une tribu";
export const TRIBES_PORTAL_CREATE_HREF = "/tribes/create";
export const TRIBES_PORTAL_RAIL_TRANSIT_TITLE = "Transports à proximité";

export const TRIBES_PORTAL_BADGE_FEATURED = "À la une";
export const TRIBES_PORTAL_BADGE_NEW = "Nouveau";
export const TRIBES_PORTAL_BADGE_POPULAR = "Populaire";

export const TRIBES_PORTAL_LIST_TITLE = "Toutes les tribus";
export const TRIBES_PORTAL_LIST_SUBTITLE = "Des cercles ancrés dans votre quartier.";
export const TRIBES_PORTAL_LIST_EMPTY = "Aucune tribu ne correspond à votre recherche.";
export const TRIBES_PORTAL_LIST_EMPTY_FILTER = "Affinez vos filtres pour trouver une tribu.";

export const TRIBES_PORTAL_FEATURED_TITLE = "Tribus à la une";
export const TRIBES_PORTAL_FEATURED_CTA = "Voir toutes les tribus";

export const TRIBES_PORTAL_VIEW_LABELS: Record<TribesPortalView, string> = {
  all: "Toutes les tribus",
  mine: "Mes tribus",
  featured: "À la une",
  meetups: "Rencontres",
};

export const TRIBES_PORTAL_HERO_BODY = TRIBES_PORTAL_SUBTITLE;
export const TRIBES_PORTAL_MEETUPS_CTA = "Voir les rencontres";
export const TRIBES_PORTAL_MEETUPS_EMPTY = "Les rencontres de tribus s’annoncent doucement.";
export const TRIBES_PORTAL_MEETUPS_TITLE = "Rencontres à venir";
export const TRIBES_PORTAL_PAGE_TITLE = TRIBES_PORTAL_TITLE;
export const TRIBES_PORTAL_SIDEBAR_CTA_BODY = TRIBES_PORTAL_SUBTITLE;
export const TRIBES_PORTAL_SIDEBAR_CTA_BUTTON = TRIBES_PORTAL_CREATE_CTA;
export const TRIBES_PORTAL_SIDEBAR_CTA_TITLE = "Créer votre tribu";
export const TRIBES_PORTAL_STAT_MEETUPS = "Rencontres";
export const TRIBES_PORTAL_STAT_MEMBERS = "Membres engagés";
export const TRIBES_PORTAL_STAT_TRIBES = "Tribus actives";

export const TRIBES_PORTAL_CATEGORY_LABELS: Record<string, string> = {
  culture: "Culture",
  nature: "Nature",
  sport: "Sport",
  gastronomie: "Gastronomie",
  musique: "Musique",
  photo: "Photo",
  education: "Éducation",
  solidarite: "Solidarité",
};

export function formatTribesPortalMembersLabel(count: number): string {
  return count <= 1 ? "1 membre" : `${count} membres`;
}

export function formatTribesPortalMeetupsWeekLabel(count: number): string {
  return count <= 1 ? "1 rencontre cette semaine" : `${count} rencontres cette semaine`;
}

export const TRIBES_PORTAL_MEMBERS_LABEL = formatTribesPortalMembersLabel;
export const TRIBES_PORTAL_MEETUPS_WEEK_LABEL = formatTribesPortalMeetupsWeekLabel;

