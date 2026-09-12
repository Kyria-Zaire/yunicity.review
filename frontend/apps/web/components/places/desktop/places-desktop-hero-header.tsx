"use client";

import type { PlacesCategoryFilterId } from "@yunicity/utils";
import {
  PLACES_DESKTOP_BREADCRUMB,
  PLACES_DESKTOP_CHIP_ALL,
  PLACES_DESKTOP_CHIP_CULTURE,
  PLACES_DESKTOP_CHIP_FOOD,
  PLACES_DESKTOP_CHIP_NATURE,
  PLACES_DESKTOP_CHIP_SERVICES,
  PLACES_DESKTOP_CHIP_SHOPPING,
  PLACES_DESKTOP_CHIP_SPORT,
  PLACES_DESKTOP_CTA_EXPLORE,
  PLACES_DESKTOP_CTA_MAP,
  PLACES_DESKTOP_EDITORIAL_BODY,
  PLACES_DESKTOP_EDITORIAL_TITLE,
  PLACES_DESKTOP_SEARCH_PLACEHOLDER,
  placesDesktopMapHref,
} from "@yunicity/utils";
import {
  Briefcase,
  Compass,
  Dumbbell,
  LayoutGrid,
  Leaf,
  Map,
  Search,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type PlacesDesktopHeroHeaderProps = {
  city: string;
  searchQuery: string;
  activeCategory: PlacesCategoryFilterId;
  onSearchChange: (query: string) => void;
  onCategoryChange: (categoryId: PlacesCategoryFilterId) => void;
};

const CHIP_OPTIONS: Array<{ id: PlacesCategoryFilterId; label: string; icon: LucideIcon }> = [
  { id: "all", label: PLACES_DESKTOP_CHIP_ALL, icon: LayoutGrid },
  { id: "culture", label: PLACES_DESKTOP_CHIP_CULTURE, icon: Compass },
  { id: "nature", label: PLACES_DESKTOP_CHIP_NATURE, icon: Leaf },
  { id: "gastronomy", label: PLACES_DESKTOP_CHIP_FOOD, icon: UtensilsCrossed },
  { id: "market", label: PLACES_DESKTOP_CHIP_SHOPPING, icon: ShoppingBag },
  { id: "sport", label: PLACES_DESKTOP_CHIP_SPORT, icon: Dumbbell },
  { id: "leisure", label: PLACES_DESKTOP_CHIP_SERVICES, icon: Briefcase },
];

/** Hero header desktop Lieux — fil d'Ariane, titre, recherche et chips (DESKTOP-LIEUX-01). */
export function PlacesDesktopHeroHeader({
  city,
  searchQuery,
  activeCategory,
  onSearchChange,
  onCategoryChange,
}: PlacesDesktopHeroHeaderProps) {
  return (
    <header
      className="places-desktop-hero-header space-y-4 border-b border-neutral-200/90 pb-5"
      aria-label="Découvrir les lieux"
      data-places-desktop-hero-header=""
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-yunicity-primary">
            {PLACES_DESKTOP_BREADCRUMB(city)}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
            {PLACES_DESKTOP_EDITORIAL_TITLE}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
            {PLACES_DESKTOP_EDITORIAL_BODY}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <a
            href="#places-desktop-selection"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
          >
            <Compass className="h-4 w-4" aria-hidden />
            {PLACES_DESKTOP_CTA_EXPLORE}
          </a>
          <Link
            href={placesDesktopMapHref(city)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300"
          >
            <Map className="h-4 w-4" aria-hidden />
            {PLACES_DESKTOP_CTA_MAP}
          </Link>
        </div>
      </div>

      <label className="relative block">
        <span className="sr-only">{PLACES_DESKTOP_SEARCH_PLACEHOLDER}</span>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-yunicity-primary"
          aria-hidden
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={PLACES_DESKTOP_SEARCH_PLACEHOLDER}
          className="h-12 w-full rounded-2xl border border-neutral-200/90 bg-white pl-11 pr-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-yunicity-primary/40 focus:outline-none focus:ring-2 focus:ring-yunicity-primary/15"
        />
      </label>

      <nav aria-label="Filtres rapides" className="flex flex-wrap gap-2">
        {CHIP_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = activeCategory === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onCategoryChange(option.id)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-yunicity-primary bg-yunicity-primary text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {option.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
