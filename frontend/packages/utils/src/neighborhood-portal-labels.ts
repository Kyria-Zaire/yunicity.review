/** Neighborhood portal micro-copy (WEB-NEIGHBORHOODS-LIST-01). */

import type { NeighborhoodPortalMood } from "./neighborhood-portal";

export const NEIGHBORHOODS_PORTAL_HERO_TITLE = "Reims par morceaux humains";
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

export const NEIGHBORHOODS_PORTAL_PULSE_TITLE = "Aujourd’hui, Reims respire comme ça";
export const NEIGHBORHOODS_PORTAL_PULSE_EMPTY =
  "La ville garde un rythme calme aujourd’hui — chaque quartier se découvre en marchant.";

export const NEIGHBORHOODS_PORTAL_CARDS_TITLE = "Quartiers à explorer";
export const NEIGHBORHOODS_PORTAL_CARDS_SUBTITLE =
  "Des repères humains pour choisir où flâner, sortir ou respirer.";

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

export const NEIGHBORHOODS_PORTAL_SIGNAL_EVENT = "Moment";
export const NEIGHBORHOODS_PORTAL_SIGNAL_PLACE = "Lieu";
export const NEIGHBORHOODS_PORTAL_SIGNAL_TRIBE = "Tribu";
export const NEIGHBORHOODS_PORTAL_SIGNAL_PASSPORT = "Passport";

