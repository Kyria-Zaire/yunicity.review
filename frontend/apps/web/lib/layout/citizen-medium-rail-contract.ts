import { WEB_CITIZEN_NOTIFICATIONS_NAV, type WebNavItem } from "@/lib/layout/web-layout-config";

/**
 * Contrat du rail citoyen medium (C3-FEED-M2.4).
 *
 * Source UNIQUE de la navigation du rail : le composant la rend, les futurs
 * consommateurs ne la recopient jamais. Isolé ici parce que le runner de tests
 * de `apps/web` est en `environment: "node"` — la logique du contrat est donc
 * vérifiable sans DOM, tandis que le rendu réel (icônes, déclencheurs, noms
 * accessibles) reste verrouillé par la spec Playwright 22.
 */
export type CitizenMediumRailDestination = "feed" | "videos" | "map" | "sortir";

export const CITIZEN_MEDIUM_RAIL_DESTINATIONS: readonly (WebNavItem & {
  id: CitizenMediumRailDestination;
})[] = [
  { id: "feed", href: "/feed", label: "Accueil", icon: "feed", match: "prefix", tier: "primary" },
  { id: "videos", href: "/videos", label: "Vidéos", icon: "videos", match: "prefix", tier: "primary" },
  { id: "map", href: "/map", label: "Carte", icon: "map", match: "prefix", tier: "primary" },
  { id: "sortir", href: "/sortir", label: "Sortir", icon: "sortir", match: "prefix", tier: "primary" },
] as const;

/** Ordre visuel complet des neuf contrôles du rail, de haut en bas. */
export const CITIZEN_MEDIUM_RAIL_CONTROL_ORDER = [
  "Accueil",
  "Vidéos",
  "Carte",
  "Sortir",
  "Rechercher",
  "Menu",
  "Créer",
  WEB_CITIZEN_NOTIFICATIONS_NAV.label,
  "Profil",
] as const;

/**
 * Une destination est active uniquement si le consommateur la déclare. Aucune
 * déduction depuis le `pathname` : une route peut appartenir à une famille sans
 * que son préfixe le dise, et le shell connaît son propre contexte. L'absence de
 * destination active est un état valide (Explorer, Tribus, Passport…).
 */
export function isCitizenMediumRailDestinationActive(
  destination: CitizenMediumRailDestination,
  active: CitizenMediumRailDestination | undefined,
): boolean {
  return active !== undefined && destination === active;
}
