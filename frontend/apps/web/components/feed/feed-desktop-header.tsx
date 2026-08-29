"use client";

import { FEED_PORTAL_FILTER } from "@yunicity/utils";
import { SlidersHorizontal } from "lucide-react";
import type { MouseEvent } from "react";

type FeedDesktopHeaderProps = {
  city: string;
  userFirstName: string;
  filterPanelOpen: boolean;
  filterActive: boolean;
  onOpenFilter: (trigger: HTMLButtonElement) => void;
};

/**
 * En-tête Desktop du fil — salutation + accès au filtre.
 *
 * Élément de shell : monté en permanence, masqué sous 1280px par media query
 * (`.feed-shell-desktop-header`). Le markup reprend à l'identique celui que
 * `FeedDesktopScreen` rendait en tête de colonne — seul le `mb-5` disparaît,
 * remplacé par le `row-gap` de la colonne unique, de valeur identique (20px).
 */
export function FeedDesktopHeader({
  city,
  userFirstName,
  filterPanelOpen,
  filterActive,
  onOpenFilter,
}: FeedDesktopHeaderProps) {
  return (
    <div className="feed-shell-desktop-header flex items-start justify-between">
      <div className="feed-desktop-greeting">
        <h1 className="feed-desktop-greeting-title">Bonjour {userFirstName}</h1>
        <p className="feed-desktop-greeting-subtitle">Bienvenue sur le fil de {city}</p>
      </div>
      <button
        type="button"
        data-feed-desktop-filter=""
        data-feed-medium-filter-active={filterActive ? "" : undefined}
        onClick={(event: MouseEvent<HTMLButtonElement>) => onOpenFilter(event.currentTarget)}
        aria-expanded={filterPanelOpen}
        aria-haspopup="dialog"
        aria-pressed={filterActive}
        className={`mt-1 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium shadow-sm transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 ${
          filterActive
            ? "border-yunicity-primary bg-yunicity-primary-soft text-yunicity-primary"
            : filterPanelOpen
              ? "border-neutral-400 bg-neutral-50 text-neutral-800"
              : "border-neutral-200/90 bg-white text-neutral-600 hover:bg-neutral-50"
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
        {FEED_PORTAL_FILTER}
        {filterActive ? <span className="sr-only"> — filtre actif</span> : null}
      </button>
    </div>
  );
}
