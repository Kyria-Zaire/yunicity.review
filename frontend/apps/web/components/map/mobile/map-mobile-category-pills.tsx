"use client";

import type { MapMobileCategoryId } from "@yunicity/utils";
import {
  MAP_MOBILE_CATEGORY_ALL,
  MAP_MOBILE_CATEGORY_CULTURE,
  MAP_MOBILE_CATEGORY_DINING,
  MAP_MOBILE_CATEGORY_OUTINGS,
  MAP_MOBILE_CATEGORY_RETAIL,
} from "@yunicity/utils";
import { Grid3X3, Landmark, Megaphone, ShoppingBag, UtensilsCrossed } from "lucide-react";

const CATEGORIES: {
  id: MapMobileCategoryId;
  label: string;
  icon: typeof Grid3X3;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    id: "all",
    label: MAP_MOBILE_CATEGORY_ALL,
    icon: Grid3X3,
    activeClass: "bg-yunicity-primary text-white",
    idleClass: "border border-neutral-200 bg-white text-neutral-700",
  },
  {
    id: "dining",
    label: MAP_MOBILE_CATEGORY_DINING,
    icon: UtensilsCrossed,
    activeClass: "bg-[#FFF4EB] text-[#EA580C] ring-1 ring-[#FDBA74]",
    idleClass: "border border-[#FED7AA] bg-[#FFF7ED] text-[#EA580C]",
  },
  {
    id: "outings",
    label: MAP_MOBILE_CATEGORY_OUTINGS,
    icon: Megaphone,
    activeClass: "bg-[#F3EEFF] text-[#7C3AED] ring-1 ring-[#C4B5FD]",
    idleClass: "border border-[#DDD6FE] bg-[#FAF5FF] text-[#7C3AED]",
  },
  {
    id: "culture",
    label: MAP_MOBILE_CATEGORY_CULTURE,
    icon: Landmark,
    activeClass: "bg-[#EFF6FF] text-[#2563EB] ring-1 ring-[#93C5FD]",
    idleClass: "border border-[#BFDBFE] bg-[#F0F9FF] text-[#2563EB]",
  },
  {
    id: "retail",
    label: MAP_MOBILE_CATEGORY_RETAIL,
    icon: ShoppingBag,
    activeClass: "bg-[#ECFDF5] text-[#059669] ring-1 ring-[#6EE7B7]",
    idleClass: "border border-[#A7F3D0] bg-[#F0FDF4] text-[#059669]",
  },
];

type MapMobileCategoryPillsProps = {
  activeCategory: MapMobileCategoryId;
  onSelectCategory: (category: MapMobileCategoryId) => void;
};

/** Pills catégories mobile sur la carte (MOBILE-MAP-01). */
export function MapMobileCategoryPills({
  activeCategory,
  onSelectCategory,
}: MapMobileCategoryPillsProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[4.25rem] z-10 px-3">
      <div className="pointer-events-auto overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const active = activeCategory === category.id;
            return (
              <button
                key={category.id}
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
