"use client";

import type { SearchMobileCategoryId } from "@yunicity/utils";
import { SEARCH_MOBILE_CATEGORIES } from "@yunicity/utils";
import {
  CalendarDays,
  LayoutGrid,
  PlayCircle,
  Store,
  Tag,
  Users,
} from "lucide-react";

const CATEGORY_ICONS: Record<
  SearchMobileCategoryId,
  typeof LayoutGrid
> = {
  all: LayoutGrid,
  organization: Store,
  event: CalendarDays,
  post: PlayCircle,
  tribe: Users,
  offer: Tag,
};

type SearchMobileCategoryGridProps = {
  activeCategory: SearchMobileCategoryId;
  onCategoryChange: (id: SearchMobileCategoryId) => void;
};

/** Grille catégories mobile Recherche (MOBILE-SEARCH-01). */
export function SearchMobileCategoryGrid({
  activeCategory,
  onCategoryChange,
}: SearchMobileCategoryGridProps) {
  return (
    <section id="search-mobile-categories" className="scroll-mt-24">
      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {SEARCH_MOBILE_CATEGORIES.map((item) => {
          const active = activeCategory === item.id;
          const Icon = CATEGORY_ICONS[item.id];
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onCategoryChange(item.id)}
                className={`flex w-full flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center transition ${
                  active
                    ? "border-yunicity-primary bg-yunicity-primary text-white shadow-sm"
                    : "border-neutral-200/90 bg-white text-neutral-700"
                }`}
              >
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                    active ? "bg-white/15" : "bg-neutral-50 text-yunicity-primary"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="text-[11px] font-semibold leading-tight">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
