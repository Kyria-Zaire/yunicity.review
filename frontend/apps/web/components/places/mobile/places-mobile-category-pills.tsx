"use client";

import type { PlacesMobileCategoryId } from "@yunicity/utils";
import {
  PLACES_MOBILE_CATEGORY_ALL,
  PLACES_MOBILE_CATEGORY_BARS_CAFE,
  PLACES_MOBILE_CATEGORY_CULTURE,
  PLACES_MOBILE_CATEGORY_HEALTH,
  PLACES_MOBILE_CATEGORY_RESTAURANTS,
  PLACES_MOBILE_CATEGORY_SERVICES,
  PLACES_MOBILE_CATEGORY_SHOPPING,
} from "@yunicity/utils";
import {
  Coffee,
  Grid3X3,
  HeartPulse,
  ShoppingBag,
  Theater,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";

const CATEGORIES: {
  id: PlacesMobileCategoryId;
  label: string;
  icon: typeof Grid3X3;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    id: "all",
    label: PLACES_MOBILE_CATEGORY_ALL,
    icon: Grid3X3,
    activeClass: "bg-yunicity-primary text-white",
    idleClass: "border border-neutral-200 bg-white text-neutral-700",
  },
  {
    id: "restaurants",
    label: PLACES_MOBILE_CATEGORY_RESTAURANTS,
    icon: UtensilsCrossed,
    activeClass: "bg-[#FFF7ED] text-[#EA580C] ring-1 ring-[#FDBA74]",
    idleClass: "border border-[#FED7AA] bg-[#FFFBEB] text-[#EA580C]",
  },
  {
    id: "bars_cafe",
    label: PLACES_MOBILE_CATEGORY_BARS_CAFE,
    icon: Coffee,
    activeClass: "bg-[#FEF3C7] text-[#92400E] ring-1 ring-[#FCD34D]",
    idleClass: "border border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
  },
  {
    id: "culture",
    label: PLACES_MOBILE_CATEGORY_CULTURE,
    icon: Theater,
    activeClass: "bg-[#F3EEFF] text-[#7C3AED] ring-1 ring-[#C4B5FD]",
    idleClass: "border border-[#DDD6FE] bg-[#FAF5FF] text-[#7C3AED]",
  },
  {
    id: "shopping",
    label: PLACES_MOBILE_CATEGORY_SHOPPING,
    icon: ShoppingBag,
    activeClass: "bg-[#FFF0F6] text-[#DB2777] ring-1 ring-[#F9A8D4]",
    idleClass: "border border-[#FBCFE8] bg-[#FFF1F2] text-[#DB2777]",
  },
  {
    id: "services",
    label: PLACES_MOBILE_CATEGORY_SERVICES,
    icon: Wrench,
    activeClass: "bg-[#EFF6FF] text-[#2563EB] ring-1 ring-[#93C5FD]",
    idleClass: "border border-[#BFDBFE] bg-[#F0F9FF] text-[#2563EB]",
  },
  {
    id: "health",
    label: PLACES_MOBILE_CATEGORY_HEALTH,
    icon: HeartPulse,
    activeClass: "bg-[#ECFDF5] text-[#059669] ring-1 ring-[#6EE7B7]",
    idleClass: "border border-[#A7F3D0] bg-[#F0FDF4] text-[#059669]",
  },
];

type PlacesMobileCategoryPillsProps = {
  activeCategory: PlacesMobileCategoryId;
  onSelectCategory: (category: PlacesMobileCategoryId) => void;
};

/** Pills catégories mobile Lieux (MOBILE-LIEUX-01). */
export function PlacesMobileCategoryPills({
  activeCategory,
  onSelectCategory,
}: PlacesMobileCategoryPillsProps) {
  return (
    <nav
      aria-label="Filtrer les lieux"
      className="overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex min-w-max gap-2">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const active = activeCategory === category.id;
          return (
            <li key={category.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelectCategory(category.id)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold shadow-sm transition ${
                  active ? category.activeClass : category.idleClass
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {category.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
