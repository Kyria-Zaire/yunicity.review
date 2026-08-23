"use client";

import { SlidersHorizontal, Search, MapPin } from "lucide-react";
import type { MouseEvent, Ref } from "react";

import { useExplorerOptional } from "@/components/explorer/explorer-provider";
import { FEED_PORTAL_FILTER } from "@yunicity/utils";

/**
 * Header de contenu du Feed moyen — 640 → 1279,98 px (C3-FEED-M3 / M10).
 *
 * ── Filtrer (M10) ────────────────────────────────────────────────────────────
 * Le déclencheur ouvre la surface Sheet unique. `aria-expanded` reflète
 * l'ouverture du panneau ; l'état ACTIF du filtre (centres d'intérêt) est
 * annoncé séparément (texte + `aria-pressed` / `data-active`) pour ne pas
 * confondre ouverture et application.
 */
export function FeedMediumHeader({
  city,
  filterPanelOpen,
  filterActive,
  onOpenFilter,
  filterButtonRef,
}: {
  city: string;
  filterPanelOpen: boolean;
  filterActive: boolean;
  onOpenFilter: (trigger: HTMLButtonElement) => void;
  filterButtonRef?: Ref<HTMLButtonElement>;
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
        ref={filterButtonRef}
        data-feed-medium-header-filter=""
        data-feed-medium-filter-active={filterActive ? "" : undefined}
        onClick={(event: MouseEvent<HTMLButtonElement>) => onOpenFilter(event.currentTarget)}
        aria-expanded={filterPanelOpen}
        aria-haspopup="dialog"
        aria-pressed={filterActive}
        className={`inline-flex min-h-11 min-w-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 ${
          filterActive
            ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary ring-1 ring-yunicity-primary/40"
            : filterPanelOpen
              ? "border-neutral-400 bg-neutral-50 text-neutral-800"
              : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
        <span className="whitespace-nowrap">{FEED_PORTAL_FILTER}</span>
        {filterActive ? <span className="sr-only"> — filtre actif</span> : null}
      </button>
    </div>
  );
}
