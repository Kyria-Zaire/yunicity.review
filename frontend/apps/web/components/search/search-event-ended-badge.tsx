import { SEARCH_EVENT_ENDED_LABEL } from "@yunicity/utils";

/**
 * SEARCH-EVENT-PAST-STATUS-01 — pastille neutre « Terminé » des cartes d'événement de la
 * recherche (desktop, medium et mobile). Texte réel, lu avec le reste du lien ; aucun dégradé.
 */
export function SearchEventEndedBadge() {
  return (
    <span
      data-search-event-ended
      className="inline-flex shrink-0 items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold leading-4 text-neutral-700"
    >
      {SEARCH_EVENT_ENDED_LABEL}
    </span>
  );
}
