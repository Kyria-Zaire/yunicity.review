/** Copy UI — carte territoire vivant (WEB-MAP-05A). */

import type { MapTerritoryLayer } from "./map-living-territory";

export const MAP_LIVING_TITLE = "Carte vivante de Reims";
export const MAP_LIVING_SUBTITLE =
  "Moments, lieux, quartiers et trajets utiles — sans suivi en direct.";

export const MAP_LIVING_SEARCH_PLACEHOLDER = "Rechercher un lieu, un moment…";
export const MAP_LIVING_RECENTER = "Recentrer sur Reims";
export const MAP_LIVING_USE_POSITION = "Utiliser ma position";
export const MAP_LIVING_USE_POSITION_HINT =
  "Votre position n’est demandée que lorsque vous choisissez cette option.";

export const MAP_LAYER_LABELS: Record<MapTerritoryLayer, string> = {
  all: "Tous",
  moments: "Moments",
  lieux: "Lieux",
  quartiers: "Quartiers",
  tribus: "Tribus",
  transports: "Transports",
};

export const MAP_RAIL_AMBIANCE_TITLE = "Ambiance des quartiers";
export const MAP_RAIL_AMBIANCE_EMPTY =
  "Les ambiances de quartier se précisent au fil des contenus locaux.";
export const MAP_RAIL_PASSPORT_AROUND_TITLE = "Passport autour";
export const MAP_RAIL_PASSPORT_AROUND_EMPTY =
  "Aucune offre Passport active à mettre en avant pour le moment.";
export const MAP_RAIL_PASSPORT_AROUND_CTA = "Voir le Passport";

export const MAP_PANEL_EVENT_ROUTE = "Itinéraire";
export const MAP_PANEL_PLACE_ROUTE = "Itinéraire";
export const MAP_PANEL_NEIGHBORHOOD_VIEW = "Voir le quartier";
export const MAP_PANEL_NEIGHBORHOOD_MOMENTS = "Moments ici";
export const MAP_PANEL_TRIBE_VIEW = "Voir la tribu";
export const MAP_PANEL_CLOSE = "Fermer";

export const MAP_TRIBE_ANCHOR_NEIGHBORHOOD = (label: string): string =>
  `Ancrage quartier — ${label}`;
export const MAP_TRIBE_ANCHOR_CITY = "Ancrage éditorial — centre-ville";
export const MAP_NEIGHBORHOOD_APPROXIMATE =
  "Repère éditorial — pas de frontière exacte sur la carte.";
