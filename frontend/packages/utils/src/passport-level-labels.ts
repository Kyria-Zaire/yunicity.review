/** Passport level micro-copy (TICKET-502) — territorial, prestigious, calm. */

import type { PassportTierCode } from "@yunicity/types";

export const PASSPORT_LEVEL_UNLOCKED = "Votre Passport évolue.";

export const PASSPORT_LEVEL_SECTION_TITLE = "Votre niveau";

export const PASSPORT_LEVEL_ABOUT_TITLE = "À propos de votre niveau";

export const PASSPORT_LEVEL_PROGRESS_HINT =
  "Votre progression reflète votre participation réelle sur le territoire — pas votre temps d’écran.";

export const PASSPORT_TIER_LABELS: Record<PassportTierCode, string> = {
  basic: "Citoyen·ne",
  silver: "Silver",
  gold: "Gold",
  neo_arrivant: "Néo-arrivant",
  press_creator: "Créateur·rice local·e",
  business: "Business",
};

export const PASSPORT_TIER_SIGNIFICANCE: Record<PassportTierCode, string> = {
  basic: "Votre place dans la ville commence ici — exploration et découverte locale.",
  silver: "Engagement régulier reconnu — vous faites vivre le territoire.",
  gold: "Contribution durable et crédible — ambassadeur·rice de votre ville.",
  neo_arrivant: "Parcours d’accueil — bienvenue sur le territoire.",
  press_creator: "Voix locale — création et médias au service du territoire.",
  business: "Identité organisation — réservée aux lieux partenaires.",
};

export function formatPassportProgressionHint(
  hint: string | null | undefined,
  pointsToNext: number | null | undefined,
): string | null {
  if (hint) {
    return hint;
  }
  if (pointsToNext != null && pointsToNext > 0) {
    return "Continuez à explorer la ville à votre rythme.";
  }
  return null;
}
