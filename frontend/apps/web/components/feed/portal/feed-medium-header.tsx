"use client";

import { SlidersHorizontal, Search, MapPin } from "lucide-react";
import type { MouseEvent } from "react";

import { useExplorerOptional } from "@/components/explorer/explorer-provider";
import { FEED_PORTAL_FILTER } from "@yunicity/utils";

/**
 * Header de contenu du Feed moyen — 640 → 1279,98 px (C3-FEED-M3).
 *
 * ── Pourquoi un composant Feed et non citoyen ────────────────────────────────
 * Contrairement au rail (extrait en M2.4), ce header porte le contrôle de
 * FILTRE, qui appartient au Feed : il n'est donc pas généralisé aux autres
 * familles de pages.
 *
 * ── Ville : information, jamais faux sélecteur ───────────────────────────────
 * L'audit des contrats n'a trouvé AUCUN contrat de sélection de ville côté Feed
 * (`portal.city || user?.city || "Reims"` est une lecture, pas un choix). La
 * ville est donc rendue en information non interactive : ni chevron, ni bouton,
 * ni action fictive. Le jour où un contrat de changement de ville existera, ce
 * point deviendra interactif — pas avant.
 *
 * ── Recherche ────────────────────────────────────────────────────────────────
 * La pilule appelle `openExplorer(event.currentTarget)` : c'est l'Explorer
 * autoritaire, et le déclencheur se désigne lui-même comme cible de retour du
 * focus via le contrat `returnFocusRef` verrouillé en C3-FEED-M2.3A/B — ce qui
 * rend la restitution correcte sur Chromium comme sur WebKit.
 *
 * La présence de « Rechercher » à la fois dans le rail et ici est intentionnelle
 * et validée : raccourci global dans le rail, surface contextuelle dans le
 * header.
 */
export function FeedMediumHeader({
  city,
  filterOpen,
  onToggleFilter,
}: {
  city: string;
  filterOpen: boolean;
  onToggleFilter: () => void;
}) {
  const explorer = useExplorerOptional();

  return (
    <div className="feed-medium-header">
      <span
        data-feed-medium-header-identity=""
        className="shrink-0 text-lg font-extrabold tracking-tight text-yunicity-primary"
      >
        Yunicity
      </span>

      {/* Information de contexte : aucune action n'est proposée car aucune
          n'existe. `role="status"` la rend lisible sans promettre un contrôle. */}
      <span
        data-feed-medium-header-city=""
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-neutral-700"
      >
        <MapPin className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
        <span className="whitespace-nowrap">
          <span className="sr-only">Ville courante : </span>
          {city}
        </span>
      </span>

      <button
        type="button"
        data-feed-medium-header-search=""
        onClick={(event: MouseEvent<HTMLButtonElement>) =>
          explorer?.openExplorer(event.currentTarget)
        }
        className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 text-left text-sm text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
      >
        <Search className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
        <span className="min-w-0 flex-1 truncate">Rechercher à {city}</span>
      </button>

      <button
        type="button"
        data-feed-medium-header-filter=""
        onClick={onToggleFilter}
        aria-expanded={filterOpen}
        className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition ${
          filterOpen
            ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
        <span className="whitespace-nowrap">{FEED_PORTAL_FILTER}</span>
      </button>
    </div>
  );
}
