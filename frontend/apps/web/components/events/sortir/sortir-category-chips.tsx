"use client";

import type { SortirCategoryId } from "@yunicity/utils";
import { SORTIR_CATEGORIES } from "@yunicity/utils";
import {
  Coffee,
  Flame,
  GlassWater,
  Landmark,
  Moon,
  Music2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CATEGORY_ICONS: Record<Exclude<SortirCategoryId, "">, LucideIcon> = {
  culture: Landmark,
  sortir: GlassWater,
  cafe: Coffee,
  concerts: Music2,
  rencontres: Users,
  tonight: Moon,
  trend: Flame,
};

type SortirCategoryChipsProps = {
  activeCategory: SortirCategoryId;
  onSelect: (categoryId: SortirCategoryId) => void;
};

export function SortirCategoryChips({ activeCategory, onSelect }: SortirCategoryChipsProps) {
  return (
    <nav aria-label="Filtrer les sorties" className="overflow-x-auto pb-0.5">
      <ul className="flex min-w-max gap-2 sm:gap-2.5">
        <li className="shrink-0">
          <button
            type="button"
            onClick={() => onSelect("")}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              activeCategory === ""
                ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
            }`}
          >
            <span aria-hidden>✦</span>
            Tout
          </button>
        </li>
        {SORTIR_CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category.id as Exclude<SortirCategoryId, "">];
          const active = activeCategory === category.id;
          return (
            <li key={category.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(category.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {category.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
