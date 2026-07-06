"use client";

import type { TribesMobileCategoryId } from "@yunicity/utils";
import {
  TRIBES_MOBILE_CATEGORY_ALL,
  TRIBES_MOBILE_CATEGORY_ART,
  TRIBES_MOBILE_CATEGORY_CULTURE,
  TRIBES_MOBILE_CATEGORY_ENTREPRENEURSHIP,
  TRIBES_MOBILE_CATEGORY_SPORT,
  TRIBES_MOBILE_CATEGORY_STUDENT,
} from "@yunicity/utils";
import {
  GraduationCap,
  Grid3X3,
  Music2,
  Palette,
  Rocket,
  Trophy,
} from "lucide-react";

const CATEGORIES: {
  id: TribesMobileCategoryId;
  label: string;
  icon: typeof Grid3X3;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    id: "all",
    label: TRIBES_MOBILE_CATEGORY_ALL,
    icon: Grid3X3,
    activeClass: "bg-yunicity-primary text-white",
    idleClass: "border border-neutral-200 bg-white text-neutral-700",
  },
  {
    id: "culture",
    label: TRIBES_MOBILE_CATEGORY_CULTURE,
    icon: Music2,
    activeClass: "bg-[#F3EEFF] text-[#7C3AED] ring-1 ring-[#C4B5FD]",
    idleClass: "border border-[#DDD6FE] bg-[#FAF5FF] text-[#7C3AED]",
  },
  {
    id: "sport",
    label: TRIBES_MOBILE_CATEGORY_SPORT,
    icon: Trophy,
    activeClass: "bg-[#ECFDF5] text-[#059669] ring-1 ring-[#6EE7B7]",
    idleClass: "border border-[#A7F3D0] bg-[#F0FDF4] text-[#059669]",
  },
  {
    id: "art",
    label: TRIBES_MOBILE_CATEGORY_ART,
    icon: Palette,
    activeClass: "bg-[#FFF0F6] text-[#DB2777] ring-1 ring-[#F9A8D4]",
    idleClass: "border border-[#FBCFE8] bg-[#FFF1F2] text-[#DB2777]",
  },
  {
    id: "student",
    label: TRIBES_MOBILE_CATEGORY_STUDENT,
    icon: GraduationCap,
    activeClass: "bg-[#EFF6FF] text-[#2563EB] ring-1 ring-[#93C5FD]",
    idleClass: "border border-[#BFDBFE] bg-[#F0F9FF] text-[#2563EB]",
  },
  {
    id: "entrepreneurship",
    label: TRIBES_MOBILE_CATEGORY_ENTREPRENEURSHIP,
    icon: Rocket,
    activeClass: "bg-[#FFFBEB] text-[#D97706] ring-1 ring-[#FCD34D]",
    idleClass: "border border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]",
  },
];

type TribesMobileCategoryPillsProps = {
  activeCategory: TribesMobileCategoryId;
  onSelectCategory: (category: TribesMobileCategoryId) => void;
};

/** Pills catégories mobile Tribus (MOBILE-TRIBES-01). */
export function TribesMobileCategoryPills({
  activeCategory,
  onSelectCategory,
}: TribesMobileCategoryPillsProps) {
  return (
    <nav
      id="tribes-mobile-categories"
      aria-label="Filtrer les tribus"
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
