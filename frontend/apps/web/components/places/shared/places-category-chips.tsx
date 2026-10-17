"use client";

import type { PlacesCategoryFilterId } from "@yunicity/utils";
import {
  PLACES_DESKTOP_CHIP_ALL,
  PLACES_DESKTOP_CHIP_CULTURE,
  PLACES_DESKTOP_CHIP_FOOD,
  PLACES_DESKTOP_CHIP_NATURE,
  PLACES_DESKTOP_CHIP_SERVICES,
  PLACES_DESKTOP_CHIP_SHOPPING,
  PLACES_DESKTOP_CHIP_SPORT,
} from "@yunicity/utils";
import {
  Briefcase,
  Compass,
  Dumbbell,
  LayoutGrid,
  Leaf,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CHIP_OPTIONS: Array<{ id: PlacesCategoryFilterId; label: string; icon: LucideIcon }> = [
  { id: "all", label: PLACES_DESKTOP_CHIP_ALL, icon: LayoutGrid },
  { id: "culture", label: PLACES_DESKTOP_CHIP_CULTURE, icon: Compass },
  { id: "nature", label: PLACES_DESKTOP_CHIP_NATURE, icon: Leaf },
  { id: "gastronomy", label: PLACES_DESKTOP_CHIP_FOOD, icon: UtensilsCrossed },
  { id: "market", label: PLACES_DESKTOP_CHIP_SHOPPING, icon: ShoppingBag },
  { id: "sport", label: PLACES_DESKTOP_CHIP_SPORT, icon: Dumbbell },
  { id: "leisure", label: PLACES_DESKTOP_CHIP_SERVICES, icon: Briefcase },
];

type PlacesCategoryChipsProps = {
  activeCategory: PlacesCategoryFilterId;
  onCategoryChange: (categoryId: PlacesCategoryFilterId) => void;
  className?: string;
  layout?: "wrap" | "scroll";
};

export function PlacesCategoryChips({
  activeCategory,
  onCategoryChange,
  className = "",
  layout = "wrap",
}: PlacesCategoryChipsProps) {
  const layoutClass =
    layout === "scroll"
      ? "flex-nowrap overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      : "flex-wrap";

  return (
    <nav
      aria-label="Filtres rapides"
      data-places-category-chips=""
      className={`flex gap-2 ${layoutClass} ${className}`.trim()}
    >
      {CHIP_OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = activeCategory === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onCategoryChange(option.id)}
            aria-pressed={active}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
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
  );
}
