/** Events agenda page micro-copy (WEB-EVENTS-02A). */

export const EVENTS_AGENDA_HERO_TITLE = "Que faire ce soir ?";

export function eventsAgendaHeroSubtitle(city: string): string {
  const name = city.trim() || "Reims";
  return `Votre soirée à ${name}, en deux gestes — Yunicity affine l’ambiance, pas un moteur de recherche.`;
}

export const EVENTS_AGENDA_HERO_KICKER = "Assistant sortie";
export const EVENTS_AGENDA_HERO_CTA = "Affiner ma soirée";

export const EVENTS_AGENDA_TIME_PLACEHOLDER = "À quelle heure ?";
export const EVENTS_AGENDA_THEME_PLACEHOLDER = "Thème ou Lieu";
export const EVENTS_AGENDA_SEARCH_ARIA = "Explorer l’agenda";
export const EVENTS_AGENDA_WEEK_TITLE = "Votre Semaine";
export const EVENTS_AGENDA_WEEK_SUBTITLE = (city: string): string =>
  `Planifiez votre semaine à ${city} — sélectionnez un jour.`;

export const EVENTS_AGENDA_MOMENTS_TITLE = "Moments à ne pas manquer";
export const EVENTS_AGENDA_MOMENTS_SUBTITLE =
  "Heure, lieu et envie — le reste suit.";
export const EVENTS_FEATURED_TITLE = "À la une";
export const EVENTS_FEATURED_SUBTITLE =
  "Moments, lieux et privilèges locaux — à parcourir à votre rythme.";
export const EVENTS_FEATURED_EMPTY = "Rien à mettre en avant pour l’instant — l’agenda se remplit.";

export const EVENTS_NEIGHBORHOOD_ATMOSPHERE_TITLE = "L’ambiance des quartiers";
export const EVENTS_NEIGHBORHOOD_ATMOSPHERE_SUBTITLE =
  "Découvrez les quartiers qui vivent au rythme de la ville aujourd’hui.";
export const EVENTS_NEIGHBORHOOD_CTA = "Voir le quartier";
export const EVENTS_NEIGHBORHOOD_MAP_CTA = "Voir sur la carte";

export const NEIGHBORHOOD_ATMOSPHERE_TAG_LABELS: Record<
  "culture" | "soiree" | "calme" | "balade" | "etudiant",
  string
> = {
  culture: "Culture",
  soiree: "Soirée",
  calme: "Calme",
  balade: "Balade",
  etudiant: "Étudiant",
};
export const EVENTS_AGENDA_EMPTY_DAY =
  "Rien d’annoncé ce jour-là — parcourez la semaine ou revenez bientôt.";
export const EVENTS_AGENDA_LOADING = "Chargement de l’agenda…";
export const EVENTS_AGENDA_ERROR = "Impossible de charger l’agenda local.";
export const EVENTS_AGENDA_RETRY = "Réessayer";

export const EVENTS_RAIL_PLANNING_TITLE = "Mon planning";
export const EVENTS_RAIL_PLANNING_EMPTY =
  "Sauvegardez un moment pour le retrouver ici avant votre sortie.";
export const EVENTS_RAIL_PLANNING_VISITOR =
  "Connectez-vous pour sauvegarder vos sorties locales.";
export const EVENTS_RAIL_PLANNING_CTA_LOGIN = "Se connecter";
export const EVENTS_RAIL_PLANNING_CTA = "Créer mon planning";
export const EVENTS_RAIL_TRIBES_TITLE = "Tribus liées";
export const EVENTS_RAIL_TRIBES_EMPTY = "Les tribus locales apparaîtront au fil des sorties.";
export const EVENTS_RAIL_TRANSIT_TITLE = "Transports du soir";
export const EVENTS_RAIL_CITY_TITLE = "Flux de la ville";
export const EVENTS_RAIL_VIEW_TRIBES = "Toutes les tribus";

export const EVENTS_MOMENT_CTA = "Voir la fiche";
export const EVENTS_MOMENT_MAP_CTA = "Carte";
export const EVENTS_MOMENT_SAVE = "Sauvegarder";
export const EVENTS_MOMENT_SAVED = "Sauvegardé";

export const EVENTS_TIME_SLOT_ANY = "Toute la semaine";
export const EVENTS_TIME_SLOT_TONIGHT = "Ce soir (à partir de 18 h)";
export const EVENTS_TIME_SLOT_AFTERNOON = "Cet après-midi";
