"use client";

import type { PlacesCategoryFilterId } from "@yunicity/utils";
import {
  PLACES_DESKTOP_CATEGORIES_TITLE,
  PLACES_DESKTOP_CATEGORY_CULTURE,
  PLACES_DESKTOP_CATEGORY_FOOD,
  PLACES_DESKTOP_CATEGORY_NATURE,
  PLACES_DESKTOP_CATEGORY_SERVICES,
  PLACES_DESKTOP_CATEGORY_SHOPPING,
  PLACES_DESKTOP_CATEGORY_SPORT,
  PLACES_DESKTOP_ACCESSIBILITY_PMR,
  PLACES_DESKTOP_RESET_FILTERS,
  PLACES_MEDIUM_FILTERS_TITLE,
} from "@yunicity/utils";
import { Sheet } from "@yunicity/ui/primitives";
import {
  Briefcase,
  Building2,
  Dumbbell,
  Filter,
  Leaf,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RefObject } from "react";

import { NAVIGATION_MODAL_Z_INDEX } from "@/lib/layout/navigation-overlay-layers";

type PlacesMediumFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCategory: PlacesCategoryFilterId;
  accessiblePmr: boolean;
  onCategoryChange: (categoryId: PlacesCategoryFilterId) => void;
  onAccessibleChange: (value: boolean) => void;
  onResetFilters: () => void;
  returnFocusRef: RefObject<HTMLElement>;
};

const CATEGORY_OPTIONS: Array<{
  id: PlacesCategoryFilterId;
  label: string;
  icon: LucideIcon;
  iconTone: string;
}> = [
  { id: "culture", label: PLACES_DESKTOP_CATEGORY_CULTURE, icon: Building2, iconTone: "text-violet-600" },
  { id: "nature", label: PLACES_DESKTOP_CATEGORY_NATURE, icon: Leaf, iconTone: "text-emerald-600" },
  { id: "gastronomy", label: PLACES_DESKTOP_CATEGORY_FOOD, icon: UtensilsCrossed, iconTone: "text-orange-500" },
  { id: "market", label: PLACES_DESKTOP_CATEGORY_SHOPPING, icon: ShoppingBag, iconTone: "text-sky-600" },
  { id: "sport", label: PLACES_DESKTOP_CATEGORY_SPORT, icon: Dumbbell, iconTone: "text-teal-600" },
  { id: "leisure", label: PLACES_DESKTOP_CATEGORY_SERVICES, icon: Briefcase, iconTone: "text-neutral-700" },
];

export function PlacesMediumFilterSheet({
  open,
  onOpenChange,
  activeCategory,
  accessiblePmr,
  onCategoryChange,
  onAccessibleChange,
  onResetFilters,
  returnFocusRef,
}: PlacesMediumFilterSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      title={PLACES_MEDIUM_FILTERS_TITLE}
      closeLabel="Fermer"
      returnFocusRef={returnFocusRef}
      zIndex={NAVIGATION_MODAL_Z_INDEX}
      className="places-medium-filter-sheet max-w-md"
    >
      <div className="space-y-5 px-1 pb-6" data-places-medium-filter-sheet="">
        <div>
          <p className="text-sm font-bold text-neutral-900">{PLACES_DESKTOP_CATEGORIES_TITLE}</p>
          <nav className="mt-2 space-y-1" aria-label={PLACES_DESKTOP_CATEGORIES_TITLE}>
            <button
              type="button"
              onClick={() => onCategoryChange("all")}
              aria-pressed={activeCategory === "all"}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                activeCategory === "all"
                  ? "bg-[#EEF0FF] text-yunicity-primary"
                  : "text-neutral-800 hover:bg-neutral-50"
              }`}
            >
              Tous les lieux
            </button>
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onCategoryChange(option.id)}
                aria-pressed={activeCategory === option.id}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                  activeCategory === option.id
                    ? "bg-[#EEF0FF] text-yunicity-primary"
                    : "text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <option.icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    activeCategory === option.id ? "text-yunicity-primary" : option.iconTone
                  }`}
                  aria-hidden
                />
                {option.label}
              </button>
            ))}
          </nav>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-medium text-neutral-900">
          <input
            type="checkbox"
            checked={accessiblePmr}
            onChange={(event) => onAccessibleChange(event.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-yunicity-primary focus:ring-yunicity-primary/30"
          />
          {PLACES_DESKTOP_ACCESSIBILITY_PMR}
        </label>

        <button
          type="button"
          onClick={() => {
            onResetFilters();
            onOpenChange(false);
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-yunicity-primary/30 px-3 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:border-yunicity-primary hover:bg-[#EEF0FF]"
        >
          <Filter className="h-4 w-4" aria-hidden />
          {PLACES_DESKTOP_RESET_FILTERS}
        </button>
      </div>
    </Sheet>
  );
}
