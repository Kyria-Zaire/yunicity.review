"use client";

import type { TribeDetailSectionTab } from "@/hooks/use-tribe-detail-section-scroll";

type TribeDetailSectionNavProps<T extends string> = {
  tabs: readonly TribeDetailSectionTab[];
  activeId: T;
  onSelect: (tab: TribeDetailSectionTab) => void;
};

export function TribeDetailSectionNav<T extends string>({
  tabs,
  activeId,
  onSelect,
}: TribeDetailSectionNavProps<T>) {
  return (
    <nav
      aria-label="Sections de la tribu"
      className="flex overflow-x-auto border-b border-neutral-200/90 bg-white"
      data-tribe-detail-section-nav=""
    >
      {tabs.map((tab) => {
        const active = activeId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab)}
            className={`shrink-0 px-4 py-3 text-sm font-semibold transition ${
              active
                ? "border-b-2 border-yunicity-primary text-yunicity-primary"
                : "border-b-2 border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
