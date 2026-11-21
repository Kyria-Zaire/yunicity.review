/**
 * SEARCH-EVENT-PAST-STATUS-01 — statut « Terminé » d'un événement des résultats de recherche.
 *
 * Réutilise la règle de fin d'EVENTS-PAST-01 (`resolveEventTimeStatus`, décision D1-F2), avec
 * une contrainte propre à la recherche (décision D3 du 13/11) : n'afficher « Terminé » que
 * lorsque la fin est CONNUE ou explicitement absente.
 * - clé `ends_at` absente (réponse antérieure à ce champ) → jamais terminé : sans elle, un
 *   événement sur plusieurs jours encore en cours serait déclaré terminé à tort ;
 * - `ends_at === null` → convention de fin estimée de la règle partagée ;
 * - `ends_at` lisible et non antérieure au début → règle partagée ;
 * - `ends_at` non nulle mais inexploitable (illisible, antérieure au début) → jamais terminé :
 *   la règle partagée y appliquerait la convention estimée, qui pourrait conclure à tort.
 *
 * Calculé à l'instant fourni, sans minuteur (décision D2) : la liste est recalculée à chaque rendu.
 */
import type { SearchResultItem } from "@yunicity/types";

import { EVENT_DETAIL_DESKTOP_ENDED } from "./event-detail-portal-labels";
import { resolveEventTimeStatus } from "./event-time-status";

/** Même libellé que la fiche d'événement. */
export const SEARCH_EVENT_ENDED_LABEL = EVENT_DETAIL_DESKTOP_ENDED;

export function isSearchEventEnded(
  item: Pick<SearchResultItem, "starts_at" | "ends_at">,
  now: Date = new Date(),
): boolean {
  const startsAt = item.starts_at;
  const endsAt = item.ends_at;
  if (!startsAt || endsAt === undefined) return false;
  const start = Date.parse(startsAt);
  if (!Number.isFinite(start)) return false;
  if (endsAt !== null) {
    const end = Date.parse(endsAt);
    if (!Number.isFinite(end) || end < start) return false;
  }
  return resolveEventTimeStatus(startsAt, endsAt, now) === "ended";
}
