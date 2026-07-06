"use client";

import type { NeighborhoodsMobileCategoryId } from "@yunicity/utils";
import {
  NEIGHBORHOODS_MOBILE_CATEGORY_ALL,
  NEIGHBORHOODS_MOBILE_CATEGORY_CULTURE,
  NEIGHBORHOODS_MOBILE_CATEGORY_FAMILY,
  NEIGHBORHOODS_MOBILE_CATEGORY_NATURE,
  NEIGHBORHOODS_MOBILE_CATEGORY_POPULAR,
  NEIGHBORHOODS_MOBILE_CATEGORY_SORTIR,
} from "@yunicity/utils";
import {
  Flame,
  Grid3X3,
  Leaf,
  Martini,
  Theater,
  Users,
} from "lucide-react";

const CATEGORIES: {
  id: NeighborhoodsMobileCategoryId;
  label: string;
  icon: typeof Grid3X3;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    id: "all",
    label: NEIGHBORHOODS_MOBILE_CATEGORY_ALL,
    icon: Grid3X3,
    activeClass: "bg-yunicity-primary text-white",
    idleClass: "border border-neutral-200 bg-white text-neutral-700",
  },
  {
    id: "popular",
    label: NEIGHBORHOODS_MOBILE_CATEGORY_POPULAR,
    icon: Flame,
    activeClass: "bg-[#FFF7ED] text-[#EA580C] ring-1 ring-[#FDBA74]",
    idleClass: "border border-[#FED7AA] bg-[#FFFBEB] text-[#EA580C]",
  },
  {
    id: "culture",
    label: NEIGHBORHOODS_MOBILE_CATEGORY_CULTURE,
    icon: Theater,
    activeClass: "bg-[#F3EEFF] text-[#7C3AED] ring-1 ring-[#C4B5FD]",
    idleClass: "border border-[#DDD6FE] bg-[#FAF5FF] text-[#7C3AED]",
  },
  {
    id: "sortir",
    label: NEIGHBORHOODS_MOBILE_CATEGORY_SORTIR,
    icon: Martini,
    activeClass: "bg-[#FFF0F6] text-[#DB2777] ring-1 ring-[#F9A8D4]",
    idleClass: "border border-[#FBCFE8] bg-[#FFF1F2] text-[#DB2777]",
  },
  {
    id: "famille",
    label: NEIGHBORHOODS_MOBILE_CATEGORY_FAMILY,
    icon: Users,
    activeClass: "bg-[#ECFDF5] text-[#059669] ring-1 ring-[#6EE7B7]",
    idleClass: "border border-[#A7F3D0] bg-[#F0FDF4] text-[#059669]",
  },
  {
    id: "nature",
    label: NEIGHBORHOODS_MOBILE_CATEGORY_NATURE,
    icon: Leaf,
    activeClass: "bg-[#F0FDF4] text-[#15803D] ring-1 ring-[#86EFAC]",
    idleClass: "border border-[#BBF7D0] bg-[#F7FEE7] text-[#15803D]",
  },
];

type NeighborhoodsMobileCategoryPillsProps = {
  activeCategory: NeighborhoodsMobileCategoryId;
  onSelectCategory: (category: NeighborhoodsMobileCategoryId) => void;
};

/** Pills catégories mobile Quartiers (MOBILE-QUARTIERS-01). */
export function NeighborhoodsMobileCategoryPills({
  activeCategory,
  onSelectCategory,
}: NeighborhoodsMobileCategoryPillsProps) {
  return (
    <nav
      aria-label="Filtrer les quartiers"
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
