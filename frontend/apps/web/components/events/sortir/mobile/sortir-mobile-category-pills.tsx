"use client";

import type { SortirMobileCategoryId } from "@yunicity/utils";
import {
  SORTIR_MOBILE_CATEGORY_ALL,
  SORTIR_MOBILE_CATEGORY_CONCERTS,
  SORTIR_MOBILE_CATEGORY_EXPOS,
  SORTIR_MOBILE_CATEGORY_OTHER,
  SORTIR_MOBILE_CATEGORY_PARTIES,
  SORTIR_MOBILE_CATEGORY_SPORT,
} from "@yunicity/utils";
import {
  Dumbbell,
  Grid3X3,
  Image,
  Martini,
  MoreHorizontal,
  Music2,
} from "lucide-react";

const CATEGORIES: {
  id: SortirMobileCategoryId;
  label: string;
  icon: typeof Grid3X3;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    id: "all",
    label: SORTIR_MOBILE_CATEGORY_ALL,
    icon: Grid3X3,
    activeClass: "bg-yunicity-primary text-white",
    idleClass: "border border-neutral-200 bg-white text-neutral-700",
  },
  {
    id: "concerts",
    label: SORTIR_MOBILE_CATEGORY_CONCERTS,
    icon: Music2,
    activeClass: "bg-[#F3EEFF] text-[#7C3AED] ring-1 ring-[#C4B5FD]",
    idleClass: "border border-[#DDD6FE] bg-[#FAF5FF] text-[#7C3AED]",
  },
  {
    id: "parties",
    label: SORTIR_MOBILE_CATEGORY_PARTIES,
    icon: Martini,
    activeClass: "bg-[#FFF0F6] text-[#DB2777] ring-1 ring-[#F9A8D4]",
    idleClass: "border border-[#FBCFE8] bg-[#FFF1F2] text-[#DB2777]",
  },
  {
    id: "expos",
    label: SORTIR_MOBILE_CATEGORY_EXPOS,
    icon: Image,
    activeClass: "bg-[#FDF2F8] text-[#BE185D] ring-1 ring-[#F9A8D4]",
    idleClass: "border border-[#FBCFE8] bg-[#FFF1F2] text-[#BE185D]",
  },
  {
    id: "sport",
    label: SORTIR_MOBILE_CATEGORY_SPORT,
    icon: Dumbbell,
    activeClass: "bg-[#ECFDF5] text-[#059669] ring-1 ring-[#6EE7B7]",
    idleClass: "border border-[#A7F3D0] bg-[#F0FDF4] text-[#059669]",
  },
  {
    id: "other",
    label: SORTIR_MOBILE_CATEGORY_OTHER,
    icon: MoreHorizontal,
    activeClass: "bg-neutral-100 text-neutral-700 ring-1 ring-neutral-300",
    idleClass: "border border-neutral-200 bg-white text-neutral-600",
  },
];

type SortirMobileCategoryPillsProps = {
  activeCategory: SortirMobileCategoryId;
  onSelectCategory: (category: SortirMobileCategoryId) => void;
};

/** Pills catégories mobile Sortir (MOBILE-SORTIR-01). */
export function SortirMobileCategoryPills({
  activeCategory,
  onSelectCategory,
}: SortirMobileCategoryPillsProps) {
  return (
    <nav aria-label="Filtrer les sorties" className="overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
