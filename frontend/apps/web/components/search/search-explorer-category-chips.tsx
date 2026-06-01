"use client";

import type { ExplorerCategoryId } from "@yunicity/utils";
import { EXPLORER_NAV_CATEGORIES } from "@yunicity/utils";

type SearchExplorerCategoryChipsProps = {
  activeCategory: ExplorerCategoryId;
  onCategoryChange: (id: ExplorerCategoryId) => void;
};

/** Navigation catégories mobile (sidebar masquée < lg). */
export function SearchExplorerCategoryChips({
  activeCategory,
  onCategoryChange,
}: SearchExplorerCategoryChipsProps) {
  return (
    <div className="lg:hidden">
      <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {EXPLORER_NAV_CATEGORIES.map((item) => {
          const active = activeCategory === item.id;
          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onCategoryChange(item.id)}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-yunicity-primary text-white"
                    : "border border-neutral-200 bg-white text-neutral-700"
                }`}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
