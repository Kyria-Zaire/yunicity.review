/** Neighborhood portal micro-copy (WEB-NEIGHBORHOODS-LIST-01). */

import type { NeighborhoodPortalMood } from "./neighborhood-portal";

export const NEIGHBORHOODS_PORTAL_HERO_TITLE = "Mini Reims";
export const NEIGHBORHOODS_PORTAL_HERO_SUBTITLE =
  "Chaque quartier a son rythme, ses lieux, ses moments et ses habitudes.";
export const NEIGHBORHOODS_PORTAL_HERO_CHIPS = [
  "Cathédrale",
  "Boulingrin",
  "Saint-Remi",
  "Centre-ville",
  "Cernay",
  "Croix-Rouge",
] as const;
export const NEIGHBORHOODS_PORTAL_CTA_EXPLORE = "Explorer les quartiers";
export const NEIGHBORHOODS_PORTAL_CTA_MAP = "Voir la carte";
export const NEIGHBORHOODS_PORTAL_CTA_LIVE = "Ce qui vit aujourd’hui";

export const NEIGHBORHOODS_PORTAL_KICKER = "Territoire · Reims";
export const NEIGHBORHOODS_PORTAL_HERO_CTA_MAP = "Ouvrir la carte";
export const NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL = "https://images.unsplash.com/photo-1549918844-3bc88390b162?auto=format&fit=crop&q=80&w=1280";

const NEIGHBORHOODS_PORTAL_MOMENTS_WORD = "Moments";
const NEIGHBORHOODS_PORTAL_CAFES_WORD = "Cafés";
const NEIGHBORHOODS_PORTAL_EVENTS_WEEK_WORD = "Moments / semaine";

export const NEIGHBORHOODS_PORTAL_PULSE_TITLE = "Aujourd’hui, Reims respire comme ça";
export const NEIGHBORHOODS_PORTAL_PULSE_EMPTY =
  "La ville garde un rythme calme aujourd’hui — chaque quartier se découvre en marchant.";

export const NEIGHBORHOODS_PORTAL_CARDS_TITLE = "Quartiers à explorer";
export const NEIGHBORHOODS_PORTAL_CARDS_SUBTITLE =
  "Des repères humains pour choisir où flâner, sortir ou respirer.";

export const NEIGHBORHOODS_PORTAL_LIST_TITLE = "Tous les quartiers";
export const NEIGHBORHOODS_PORTAL_FEATURED_TITLE = "Habitudes & quartiers";
export const NEIGHBORHOODS_PORTAL_FEATURED_CTA = "Tout explorer";

export const NEIGHBORHOODS_PORTAL_MOODS_TITLE = "Les quartiers à vivre selon votre envie";
export const NEIGHBORHOODS_PORTAL_MOOD_LABELS: Record<NeighborhoodPortalMood, string> = {
  calme: "Calme",
  culture: "Culture",
  sortir: "Sortir",
  marcher: "Marcher",
  famille: "Famille",
  "cafe-lecture": "Café / lecture",
  "soiree-douce": "Soirée douce",
  patrimoine: "Patrimoine",
};
export const NEIGHBORHOODS_PORTAL_MOOD_EMPTY =
  "Aucun quartier ne correspond exactement à cette envie pour l’instant.";

export const NEIGHBORHOODS_PORTAL_LIFE_TITLE = "Morceaux de vie";
export const NEIGHBORHOODS_PORTAL_LIFE_EMPTY =
  "Des fragments de vie locale apparaîtront ici au fil de la journée.";

export const NEIGHBORHOODS_PORTAL_RAIL_MAP_TITLE = "Mini carte Reims";
export const NEIGHBORHOODS_PORTAL_RAIL_TRANSIT_TITLE = "Accès & transports";
export const NEIGHBORHOODS_PORTAL_RAIL_DAY_TITLE = "Quartier du jour";
export const NEIGHBORHOODS_PORTAL_RAIL_DAY_EMPTY = "Une journée paisible à Reims.";
export const NEIGHBORHOODS_PORTAL_RAIL_PASSPORT_TITLE = "Passport local";
export const NEIGHBORHOODS_PORTAL_RAIL_PASSPORT_EMPTY =
  "Les offres locales apparaîtront ici au fil des partenaires.";

export const NEIGHBORHOODS_PORTAL_STAT_CAFES = "Cafés";
export const NEIGHBORHOODS_PORTAL_STAT_MOMENTS = "Moments actifs";
export const NEIGHBORHOODS_PORTAL_STAT_NEIGHBORHOODS = "Quartiers";
export const NEIGHBORHOODS_PORTAL_STAT_EVENTS_WEEK = "Moments / semaine";

export const NEIGHBORHOODS_PORTAL_SIGNAL_EVENT = "Moment";
export const NEIGHBORHOODS_PORTAL_SIGNAL_PLACE = "Lieu";
export const NEIGHBORHOODS_PORTAL_SIGNAL_TRIBE = "Tribu";
export const NEIGHBORHOODS_PORTAL_SIGNAL_PASSPORT = "Passport";

export function formatNeighborhoodPortalMomentsLabel(count: number): string {
  return `${count} ${NEIGHBORHOODS_PORTAL_MOMENTS_WORD}`;
}

export function formatNeighborhoodPortalCafesLabel(count: number): string {
  return `${count} ${NEIGHBORHOODS_PORTAL_CAFES_WORD}`;
}

export function formatNeighborhoodPortalEventsWeekLabel(count: number): string {
  return `${count} ${NEIGHBORHOODS_PORTAL_EVENTS_WEEK_WORD}`;
}

/** Callable labels for portal cards (count → localized string). */
export const NEIGHBORHOODS_PORTAL_MOMENTS_LABEL = formatNeighborhoodPortalMomentsLabel;
export const NEIGHBORHOODS_PORTAL_CAFES_LABEL = formatNeighborhoodPortalCafesLabel;
export const NEIGHBORHOODS_PORTAL_EVENTS_WEEK_LABEL = formatNeighborhoodPortalEventsWeekLabel;

