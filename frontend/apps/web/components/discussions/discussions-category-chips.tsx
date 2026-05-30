"use client";

import type { DiscussionCategoryId } from "@yunicity/types";
import { DISCUSSION_CATEGORY_CHIPS } from "@yunicity/utils";
import { ChevronRight } from "lucide-react";

type DiscussionsCategoryChipsProps = {
  activeCategory: DiscussionCategoryId;
  onCategoryChange: (category: DiscussionCategoryId) => void;
};

export function DiscussionsCategoryChips({
  activeCategory,
  onCategoryChange,
}: DiscussionsCategoryChipsProps) {
  return (
    <div className="relative -mx-1">
      <div className="overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-2 pr-10" role="tablist" aria-label="Filtrer les discussions">
          {DISCUSSION_CATEGORY_CHIPS.map((chip) => {
            const active = activeCategory === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onCategoryChange(chip.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>
      <span
        className="pointer-events-none absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 shadow-sm"
        aria-hidden
      >
        <ChevronRight className="h-4 w-4" />
      </span>
    </div>
  );
}
